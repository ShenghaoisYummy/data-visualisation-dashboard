import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ImportBatchManager } from '@/lib/import-batch';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from headers (set by middleware)
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id: batchId } = await params;
    
    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }
    
    // Get batch details first to verify ownership and provide feedback
    const batchDetails = await ImportBatchManager.getImportBatchDetails(batchId, userId);
    
    if (!batchDetails) {
      return NextResponse.json(
        { error: 'Import batch not found or access denied' },
        { status: 404 }
      );
    }
    
    // Prevent deletion of currently processing batches
    if (batchDetails.status === 'PROCESSING') {
      return NextResponse.json(
        { 
          error: 'Cannot delete batch that is currently being processed',
          details: 'Please wait for the batch to complete before deleting'
        },
        { status: 409 }
      );
    }
    
    // Perform the deletion
    const deleteSuccess = await ImportBatchManager.deleteImportBatch(batchId, userId);
    
    if (!deleteSuccess) {
      return NextResponse.json(
        { 
          error: 'Failed to delete import batch',
          details: 'An error occurred while deleting the batch and associated data'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Import batch and associated data deleted successfully',
      deletedBatch: {
        id: batchDetails.id,
        fileName: batchDetails.fileName,
        productsDeleted: batchDetails.productsCreated
      }
    });
    
  } catch (error) {
    console.error('Delete import batch API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown server error'
      },
      { status: 500 }
    );
  }
}