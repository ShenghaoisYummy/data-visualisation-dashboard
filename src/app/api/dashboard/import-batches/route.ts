import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
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

    // Get import batches for the current user
    const batches = await db.importBatch.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED' // Only show successfully completed imports
      },
      select: {
        id: true,
        fileName: true,
        createdAt: true,
        completedAt: true,
        validRows: true,
        totalRows: true,
        processingTimeMs: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      batches: batches.map(batch => ({
        id: batch.id,
        fileName: batch.fileName,
        uploadDate: batch.createdAt,
        completedDate: batch.completedAt,
        productsCount: batch.validRows,
        totalRows: batch.totalRows,
        processingTime: batch.processingTimeMs
      }))
    });

  } catch (error) {
    console.error('Error fetching import batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import batches' },
      { status: 500 }
    );
  }
}