import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { registrationSchema, validateInput } from '@/lib/validation';
import { headers } from 'next/headers';

// Rate limiting map (in production, use Redis or external service)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests = 3, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (clientData.count >= maxRequests) {
    return false;
  }
  
  clientData.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const clientIP = forwardedFor?.split(',')[0] || 
                     headersList.get('x-real-ip') || 
                     'unknown';

    // Rate limiting: 3 registration attempts per hour per IP
    if (!checkRateLimit(clientIP, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many registration attempts. Please try again later.' 
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = validateInput(registrationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Get additional request info for audit trail
    const userAgent = headersList.get('user-agent') || '';
    
    // Remove confirmPassword from data before passing to AuthService
    const { confirmPassword, ...registrationData } = validation.data!;
    const finalRegistrationData = {
      ...registrationData,
      ipAddress: clientIP,
      userAgent
    };

    // Attempt registration
    const result = await AuthService.register(finalRegistrationData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: result.errors
        },
        { status: 400 }
      );
    }

    // Set HTTP-only cookie with JWT token
    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: {
        id: result.user!.id,
        username: result.user!.username,
        email: result.user!.email,
        status: result.user!.status
      }
    });

    // Set secure cookie with token
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An internal error occurred during registration'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}