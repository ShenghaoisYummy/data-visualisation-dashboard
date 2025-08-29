import { db } from './database';
import { Decimal } from '@prisma/client/runtime/library';

export async function createSampleProducts(userId: string) {
  console.log('Creating sample products for user:', userId);
  
  // Sample product data with realistic numbers
  const sampleProducts = [
    {
      productId: '0000001',
      productName: 'Premium Green Tea 500g',
      openingInventory: 100,
      dailyData: [
        { day: 1, procurementQty: 50, procurementPrice: 12.50, salesQty: 30, salesPrice: 18.99 },
        { day: 2, procurementQty: null, procurementPrice: null, salesQty: 25, salesPrice: 18.99 },
        { day: 3, procurementQty: 40, procurementPrice: 12.00, salesQty: 35, salesPrice: 17.99 }
      ]
    },
    {
      productId: '0000002', 
      productName: 'Organic Rice 2kg',
      openingInventory: 200,
      dailyData: [
        { day: 1, procurementQty: 100, procurementPrice: 3.20, salesQty: 80, salesPrice: 5.99 },
        { day: 2, procurementQty: 50, procurementPrice: 3.15, salesQty: 90, salesPrice: 5.99 },
        { day: 3, procurementQty: null, procurementPrice: null, salesQty: 70, salesPrice: 5.49 }
      ]
    },
    {
      productId: '0000003',
      productName: 'Fresh Soy Sauce 1L',
      openingInventory: 75,
      dailyData: [
        { day: 1, procurementQty: 30, procurementPrice: 4.80, salesQty: 40, salesPrice: 8.99 },
        { day: 2, procurementQty: 60, procurementPrice: 4.75, salesQty: 35, salesPrice: 8.99 },
        { day: 3, procurementQty: null, procurementPrice: null, salesQty: 45, salesPrice: 8.49 }
      ]
    },
    {
      productId: '0000004',
      productName: 'Frozen Dumplings 500g',
      openingInventory: 50,
      dailyData: [
        { day: 1, procurementQty: 80, procurementPrice: 6.50, salesQty: 60, salesPrice: 12.99 },
        { day: 2, procurementQty: null, procurementPrice: null, salesQty: 45, salesPrice: 12.99 },
        { day: 3, procurementQty: 40, procurementPrice: 6.25, salesQty: 35, salesPrice: 11.99 }
      ]
    },
    {
      productId: '0000005',
      productName: 'Instant Ramen Pack (24pc)',
      openingInventory: 120,
      dailyData: [
        { day: 1, procurementQty: 60, procurementPrice: 18.00, salesQty: 90, salesPrice: 29.99 },
        { day: 2, procurementQty: 100, procurementPrice: 17.50, salesQty: 85, salesPrice: 29.99 },
        { day: 3, procurementQty: null, procurementPrice: null, salesQty: 75, salesPrice: 27.99 }
      ]
    }
  ];

  try {
    // Create import batch
    const importBatch = await db.importBatch.create({
      data: {
        userId,
        fileName: 'sample_data.xlsx',
        fileSize: 15000, // 15KB
        totalRows: sampleProducts.length,
        validRows: sampleProducts.length,
        skippedRows: 0,
        status: 'COMPLETED',
        processingTimeMs: 150,
        completedAt: new Date()
      }
    });

    console.log('Created import batch:', importBatch.id);

    // Create products and their daily data
    for (const productData of sampleProducts) {
      // Create product
      const product = await db.product.create({
        data: {
          productId: productData.productId,
          productName: productData.productName,
          openingInventory: productData.openingInventory,
          userId
        }
      });

      console.log('Created product:', product.productId);

      // Calculate and create daily data
      let runningInventory = productData.openingInventory;
      
      for (const dayData of productData.dailyData) {
        // Calculate inventory level for this day
        runningInventory = runningInventory + (dayData.procurementQty || 0) - (dayData.salesQty || 0);
        
        // Calculate amounts
        const procurementAmount = dayData.procurementQty && dayData.procurementPrice 
          ? new Decimal(dayData.procurementQty * dayData.procurementPrice)
          : null;
        
        const salesAmount = dayData.salesQty && dayData.salesPrice
          ? new Decimal(dayData.salesQty * dayData.salesPrice)
          : null;

        await db.dailyData.create({
          data: {
            productId: product.id,
            daySequence: dayData.day,
            procurementQty: dayData.procurementQty,
            procurementPrice: dayData.procurementPrice ? new Decimal(dayData.procurementPrice) : null,
            salesQty: dayData.salesQty,
            salesPrice: dayData.salesPrice ? new Decimal(dayData.salesPrice) : null,
            inventoryLevel: runningInventory,
            procurementAmount,
            salesAmount,
            importBatchId: importBatch.id,
            sourceRow: sampleProducts.indexOf(productData) + 2 // +2 for header row
          }
        });
      }

      console.log(`Created daily data for product ${product.productId}, final inventory: ${runningInventory}`);
    }

    console.log('Sample data creation completed successfully!');
    return {
      success: true,
      productsCreated: sampleProducts.length,
      batchId: importBatch.id
    };

  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
}