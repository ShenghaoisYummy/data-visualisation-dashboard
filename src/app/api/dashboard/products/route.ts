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
    
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50') || 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0);
    const search = searchParams.get('search') || '';
    
    // Build where clause for search
    const whereClause = {
      userId: userId,
      ...(search && {
        OR: [
          { productId: { contains: search, mode: 'insensitive' as const } },
          { productName: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };
    
    // Get products with pagination
    const products = await db.product.findMany({
      where: whereClause,
      include: {
        dailyData: {
          orderBy: { daySequence: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
    
    // Get total count for pagination
    const totalCount = await db.product.count({
      where: whereClause
    });
    
    // Transform products for frontend consumption
    const productsWithChartData = products.map(product => {
      const chartData = [];
      let currentInventory = product.openingInventory;
      
      // Create chart data for each day
      for (let day = 1; day <= 3; day++) {
        const dayData = product.dailyData.find(d => d.daySequence === day);
        
        if (day > 1) {
          // Calculate inventory level for days 2 and 3
          const previousDay = chartData[day - 2];
          if (previousDay && dayData) {
            currentInventory = previousDay.inventoryLevel + 
              (dayData.procurementQty || 0) - 
              (dayData.salesQty || 0);
          } else if (dayData) {
            currentInventory = currentInventory + 
              (dayData.procurementQty || 0) - 
              (dayData.salesQty || 0);
          }
        } else if (dayData) {
          // Day 1: opening inventory + procurement - sales
          currentInventory = currentInventory + 
            (dayData.procurementQty || 0) - 
            (dayData.salesQty || 0);
        }
        
        chartData.push({
          day: `Day ${day}`,
          daySequence: day,
          inventoryLevel: dayData?.inventoryLevel || currentInventory,
          procurementAmount: dayData?.procurementAmount?.toNumber() || null,
          salesAmount: dayData?.salesAmount?.toNumber() || null,
          procurementQty: dayData?.procurementQty || null,
          procurementPrice: dayData?.procurementPrice?.toNumber() || null,
          salesQty: dayData?.salesQty || null,
          salesPrice: dayData?.salesPrice?.toNumber() || null
        });
      }
      
      return {
        id: product.id,
        productId: product.productId,
        productName: product.productName,
        openingInventory: product.openingInventory,
        chartData,
        // Summary statistics
        summary: {
          totalProcurementValue: chartData.reduce((sum, d) => sum + (d.procurementAmount || 0), 0),
          totalSalesValue: chartData.reduce((sum, d) => sum + (d.salesAmount || 0), 0),
          finalInventory: chartData[chartData.length - 1]?.inventoryLevel || product.openingInventory,
          hasNegativeInventory: chartData.some(d => d.inventoryLevel < 0)
        }
      };
    });
    
    return NextResponse.json({
      products: productsWithChartData,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasNext: offset + limit < totalCount,
        hasPrevious: offset > 0
      }
    });
    
  } catch (error) {
    console.error('Dashboard products API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}