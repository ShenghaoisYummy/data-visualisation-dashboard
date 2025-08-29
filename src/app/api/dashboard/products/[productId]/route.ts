import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
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
    
    const { productId } = await params;
    
    // Find product by ID (ensuring it belongs to the authenticated user)
    const product = await db.product.findFirst({
      where: {
        id: productId,
        userId: userId
      },
      include: {
        dailyData: {
          orderBy: { daySequence: 'asc' }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Generate detailed chart data
    const chartData = [];
    let runningInventory = product.openingInventory;
    
    // Add initial state (before Day 1)
    chartData.push({
      day: 'Opening',
      daySequence: 0,
      inventoryLevel: product.openingInventory,
      procurementAmount: null,
      salesAmount: null,
      procurementQty: null,
      procurementPrice: null,
      salesQty: null,
      salesPrice: null,
      isOpening: true
    });
    
    // Process each day's data
    for (let day = 1; day <= 3; day++) {
      const dayData = product.dailyData.find(d => d.daySequence === day);
      
      if (dayData) {
        // Calculate new inventory level
        runningInventory = runningInventory + 
          (dayData.procurementQty || 0) - 
          (dayData.salesQty || 0);
        
        chartData.push({
          day: `Day ${day}`,
          daySequence: day,
          inventoryLevel: runningInventory,
          procurementAmount: dayData.procurementAmount?.toNumber() || null,
          salesAmount: dayData.salesAmount?.toNumber() || null,
          procurementQty: dayData.procurementQty || null,
          procurementPrice: dayData.procurementPrice?.toNumber() || null,
          salesQty: dayData.salesQty || null,
          salesPrice: dayData.salesPrice?.toNumber() || null,
          isOpening: false
        });
      } else {
        // No data for this day
        chartData.push({
          day: `Day ${day}`,
          daySequence: day,
          inventoryLevel: runningInventory,
          procurementAmount: null,
          salesAmount: null,
          procurementQty: null,
          procurementPrice: null,
          salesQty: null,
          salesPrice: null,
          isOpening: false
        });
      }
    }
    
    // Calculate summary statistics
    const summary = {
      totalProcurementValue: product.dailyData.reduce(
        (sum, d) => sum + (d.procurementAmount?.toNumber() || 0), 0
      ),
      totalSalesValue: product.dailyData.reduce(
        (sum, d) => sum + (d.salesAmount?.toNumber() || 0), 0
      ),
      totalProcurementQty: product.dailyData.reduce(
        (sum, d) => sum + (d.procurementQty || 0), 0
      ),
      totalSalesQty: product.dailyData.reduce(
        (sum, d) => sum + (d.salesQty || 0), 0
      ),
      openingInventory: product.openingInventory,
      finalInventory: runningInventory,
      inventoryChange: runningInventory - product.openingInventory,
      hasNegativeInventory: chartData.some(d => d.inventoryLevel < 0),
      daysWithData: product.dailyData.length,
      averageProcurementPrice: product.dailyData.length > 0 
        ? product.dailyData.reduce((sum, d) => sum + (d.procurementPrice?.toNumber() || 0), 0) / product.dailyData.length
        : null,
      averageSalesPrice: product.dailyData.length > 0
        ? product.dailyData.reduce((sum, d) => sum + (d.salesPrice?.toNumber() || 0), 0) / product.dailyData.length
        : null
    };
    
    return NextResponse.json({
      product: {
        id: product.id,
        productId: product.productId,
        productName: product.productName,
        openingInventory: product.openingInventory,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      },
      chartData,
      summary,
      rawDailyData: product.dailyData.map(d => ({
        daySequence: d.daySequence,
        procurementQty: d.procurementQty,
        procurementPrice: d.procurementPrice?.toNumber(),
        procurementAmount: d.procurementAmount?.toNumber(),
        salesQty: d.salesQty,
        salesPrice: d.salesPrice?.toNumber(),
        salesAmount: d.salesAmount?.toNumber(),
        inventoryLevel: d.inventoryLevel
      }))
    });
    
  } catch (error) {
    console.error('Product details API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch product details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}