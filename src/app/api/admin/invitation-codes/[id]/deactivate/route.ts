import { NextRequest, NextResponse } from 'next/server';
import { InvitationCodeService } from '@/lib/invitation-codes';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Code ID is required' },
        { status: 400 }
      );
    }

    await InvitationCodeService.deactivateCode(id);

    return NextResponse.json({
      success: true,
      message: 'Invitation code deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating invitation code:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to deactivate invitation code'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}