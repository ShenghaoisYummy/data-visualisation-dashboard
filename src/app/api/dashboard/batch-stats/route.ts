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

    // Get batchId from query parameters
    const { searchParams } = new URL(request.url);
    const selectedBatchId = searchParams.get('batchId');

    // Get batch statistics and financial data
    const [
      totalBatches,
      activeBatches, 
      completedBatches,
      latestBatch,
      recentBatches,
      currentBatchFinancials
    ] = await Promise.all([
      // Total import batches count
      db.importBatch.count({
        where: { userId }
      }),

      // Active batches (processing or pending)
      db.importBatch.count({
        where: { 
          userId,
          status: 'PROCESSING'
        }
      }),

      // Completed batches count  
      db.importBatch.count({
        where: { 
          userId,
          status: 'COMPLETED'
        }
      }),

      // Latest completed batch
      db.importBatch.findFirst({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        orderBy: { completedAt: 'desc' },
        select: {
          completedAt: true,
          fileName: true,
          validRows: true
        }
      }),

      // Recent batches for success rate calculation
      db.importBatch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10, // Last 10 batches
        select: {
          status: true,
          validRows: true,
          totalRows: true
        }
      }),

      // Get financial data for selected batch or most recent completed batch
      (async () => {
        let targetBatch;
        
        if (selectedBatchId) {
          // Use the specified batch if provided
          targetBatch = await db.importBatch.findFirst({
            where: { 
              id: selectedBatchId,
              userId,
              status: 'COMPLETED'
            },
            select: {
              id: true,
              fileName: true,
              completedAt: true,
              validRows: true
            }
          });
        } else {
          // Fall back to most recent completed batch
          targetBatch = await db.importBatch.findFirst({
            where: { 
              userId,
              status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            select: {
              id: true,
              fileName: true,
              completedAt: true,
              validRows: true
            }
          });
        }

        if (!targetBatch) return null;
        
        // Get financial totals for this batch
        const financials = await db.dailyData.aggregate({
          where: { 
            importBatchId: targetBatch.id,
            product: { userId }
          },
          _sum: {
            procurementAmount: true,
            salesAmount: true,
            inventoryLevel: true
          }
        });

        return {
          batchInfo: targetBatch,
          totals: {
            procurement: financials._sum.procurementAmount?.toString() || '0',
            sales: financials._sum.salesAmount?.toString() || '0', 
            inventory: financials._sum.inventoryLevel || 0
          }
        };
      })()
    ]);

    // Calculate success rate based on recent batches
    const successfulBatches = recentBatches.filter(batch => batch.status === 'COMPLETED').length;
    const successRate = recentBatches.length > 0 ? (successfulBatches / recentBatches.length) * 100 : 0;

    // Calculate total products processed from recent completed batches
    const totalProductsProcessed = recentBatches
      .filter(batch => batch.status === 'COMPLETED')
      .reduce((sum, batch) => sum + (batch.validRows || 0), 0);

    return NextResponse.json({
      stats: {
        totalProcurement: {
          amount: currentBatchFinancials?.totals.procurement || '0',
          label: 'Total Procurement',
          change: currentBatchFinancials ? `${currentBatchFinancials.batchInfo.validRows} products` : 'No data',
          trend: currentBatchFinancials && parseFloat(currentBatchFinancials.totals.procurement) > 0 ? 'up' : 'neutral'
        },
        totalSales: {
          amount: currentBatchFinancials?.totals.sales || '0',
          label: 'Total Sales',
          change: currentBatchFinancials ? `${currentBatchFinancials.batchInfo.validRows} products` : 'No data', 
          trend: currentBatchFinancials && parseFloat(currentBatchFinancials.totals.sales) > 0 ? 'up' : 'neutral'
        },
        inventoryLevel: {
          count: currentBatchFinancials?.totals.inventory || 0,
          label: 'Inventory Level',
          change: currentBatchFinancials ? `${currentBatchFinancials.batchInfo.validRows} products` : 'No data',
          trend: currentBatchFinancials && currentBatchFinancials.totals.inventory > 0 ? 'up' : 
                 currentBatchFinancials && currentBatchFinancials.totals.inventory < 0 ? 'down' : 'neutral'
        },
        importDate: {
          date: currentBatchFinancials?.batchInfo.completedAt || null,
          fileName: currentBatchFinancials?.batchInfo.fileName || 'No imports yet',
          label: 'Import Date',
          change: currentBatchFinancials ? 'Latest batch' : 'No data',
          trend: currentBatchFinancials ? 'neutral' : 'down'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching batch statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch statistics' },
      { status: 500 }
    );
  }
}