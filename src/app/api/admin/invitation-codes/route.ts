import { NextRequest, NextResponse } from 'next/server';
import { InvitationCodeService } from '@/lib/invitation-codes';
import { createInvitationCodeSchema, validateInput } from '@/lib/validation';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const codes = await InvitationCodeService.getCodes();
    
    return NextResponse.json({
      success: true,
      codes: codes.map(code => ({
        id: code.id,
        code: code.code,
        department: code.department,
        maxUses: code.maxUses,
        currentUses: code.currentUses,
        isActive: code.isActive,
        expiresAt: code.expiresAt.toISOString(),
        description: code.description,
        createdBy: code.createdBy,
        createdAt: code.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching invitation codes:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch invitation codes'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user email from middleware headers
    const headersList = await headers();
    const userEmail = headersList.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'User authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validation = validateInput(createInvitationCodeSchema, body);
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

    // Create invitation code
    const newCode = await InvitationCodeService.createCode({
      ...validation.data!,
      createdBy: userEmail
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation code created successfully',
      code: {
        id: newCode.id,
        code: newCode.code,
        department: newCode.department,
        maxUses: newCode.maxUses,
        currentUses: newCode.currentUses,
        isActive: newCode.isActive,
        expiresAt: newCode.expiresAt.toISOString(),
        description: newCode.description,
        createdBy: newCode.createdBy,
        createdAt: newCode.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating invitation code:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create invitation code'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}