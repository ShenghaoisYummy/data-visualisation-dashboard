import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { loginSchema, validateInput } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = validateInput(loginSchema, body);
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

    // Attempt login
    const result = await AuthService.login(validation.data!.username, validation.data!.password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message
        },
        { status: 401 }
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
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An internal error occurred during login'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}