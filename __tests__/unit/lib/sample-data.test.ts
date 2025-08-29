import { createSampleProducts } from '@/lib/sample-data';
import { db } from '@/lib/database';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the database
jest.mock('@/lib/database', () => ({
  db: {
    importBatch: {
      create: jest.fn(),
    },
    product: {
      create: jest.fn(),
    },
    dailyData: {
      create: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('Sample Data Generation', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createSampleProducts', () => {
    test('should create import batch and sample products successfully', async () => {
      const mockImportBatch = {
        id: 'batch-123',
        userId: mockUserId,
        fileName: 'sample_data.xlsx',
        fileSize: 15000,
        totalRows: 5,
        validRows: 5,
        skippedRows: 0,
        status: 'COMPLETED',
        processingTimeMs: 150,
        completedAt: new Date(),
      };

      const mockProducts = [
        { id: 'product-1', productId: '0000001', productName: 'Premium Green Tea 500g' },
        { id: 'product-2', productId: '0000002', productName: 'Organic Rice 2kg' },
        { id: 'product-3', productId: '0000003', productName: 'Fresh Soy Sauce 1L' },
        { id: 'product-4', productId: '0000004', productName: 'Frozen Dumplings 500g' },
        { id: 'product-5', productId: '0000005', productName: 'Instant Ramen Pack (24pc)' },
      ];

      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockImplementation((data) => {
        const productData = data.data as any;
        const index = mockProducts.findIndex(p => p.productId === productData.productId);
        const mockProduct = mockProducts[index];
        return Promise.resolve({
          ...mockProduct, 
          ...productData,
          id: mockProduct.id,
          productId: mockProduct.productId,
          productName: mockProduct.productName
        } as any);
      });
      mockDb.dailyData.create.mockResolvedValue({} as any);

      const result = await createSampleProducts(mockUserId);

      expect(result).toEqual({
        success: true,
        productsCreated: 5,
        batchId: 'batch-123',
      });

      // Verify import batch creation
      expect(mockDb.importBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          fileName: 'sample_data.xlsx',
          fileSize: 15000,
          totalRows: 5,
          validRows: 5,
          skippedRows: 0,
          status: 'COMPLETED',
          processingTimeMs: 150,
        }),
      });

      // Verify products creation
      expect(mockDb.product.create).toHaveBeenCalledTimes(5);
      expect(mockDb.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: '0000001',
          productName: 'Premium Green Tea 500g',
          openingInventory: 100,
          userId: mockUserId,
        }),
      });

      // Verify daily data creation (3 days × 5 products = 15 total calls)
      expect(mockDb.dailyData.create).toHaveBeenCalledTimes(15);
    });

    test('should create daily data with correct calculations', async () => {
      const mockImportBatch = { id: 'batch-123' };
      const mockProduct = { id: 'product-1' };

      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockResolvedValue(mockProduct as any);
      mockDb.dailyData.create.mockResolvedValue({} as any);

      await createSampleProducts(mockUserId);

      // Check the first product's daily data calculations
      const dailyDataCalls = mockDb.dailyData.create.mock.calls;
      
      // Find calls for the first product (Green Tea)
      const greenTeaCalls = dailyDataCalls.filter(call => 
        call[0].data.sourceRow === 2 // First product is at row 2 (after header)
      );

      expect(greenTeaCalls).toHaveLength(3); // 3 days

      // Day 1: 50 qty × $12.50 price = $625.00
      const day1Data = greenTeaCalls[0][0].data;
      expect(day1Data.daySequence).toBe(1);
      expect(day1Data.procurementQty).toBe(50);
      expect(day1Data.procurementPrice.toString()).toBe('12.5');
      expect(day1Data.salesQty).toBe(30);
      expect(day1Data.salesPrice.toString()).toBe('18.99');
      expect(day1Data.inventoryLevel).toBe(120); // 100 + 50 - 30
      expect(day1Data.procurementAmount.toString()).toBe('625');
      expect(day1Data.salesAmount.toFixed(2)).toBe('569.70');
      expect(day1Data.importBatchId).toBe('batch-123');
      expect(day1Data.sourceRow).toBe(2);

      // Day 2: No procurement, 25 sales
      const day2Data = greenTeaCalls[1][0].data;
      expect(day2Data.daySequence).toBe(2);
      expect(day2Data.procurementQty).toBeNull();
      expect(day2Data.procurementPrice).toBeNull();
      expect(day2Data.salesQty).toBe(25);
      expect(day2Data.salesPrice.toString()).toBe('18.99');
      expect(day2Data.inventoryLevel).toBe(95); // 120 - 25 (no procurement)
      expect(day2Data.procurementAmount).toBeNull();
      expect(day2Data.salesAmount.toFixed(2)).toBe('474.75');

      // Day 3: 40 qty procurement, 35 sales
      const day3Data = greenTeaCalls[2][0].data;
      expect(day3Data.daySequence).toBe(3);
      expect(day3Data.procurementQty).toBe(40);
      expect(day3Data.procurementPrice.toString()).toBe('12');
      expect(day3Data.salesQty).toBe(35);
      expect(day3Data.salesPrice.toString()).toBe('17.99');
      expect(day3Data.inventoryLevel).toBe(100); // 95 + 40 - 35
      expect(day3Data.procurementAmount.toString()).toBe('480');
      expect(day3Data.salesAmount.toFixed(2)).toBe('629.65');
    });

    test('should handle null procurement correctly', async () => {
      const mockImportBatch = { id: 'batch-123' };
      const mockProduct = { id: 'product-2' };

      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockResolvedValue(mockProduct as any);
      mockDb.dailyData.create.mockResolvedValue({} as any);

      await createSampleProducts(mockUserId);

      const dailyDataCalls = mockDb.dailyData.create.mock.calls;
      
      // Find Day 3 call for Organic Rice (second product) - has null procurement
      const riceDay3Call = dailyDataCalls.find(call => 
        call[0].data.sourceRow === 3 && call[0].data.daySequence === 3
      );

      const riceDay3Data = riceDay3Call[0].data;
      expect(riceDay3Data.daySequence).toBe(3);
      expect(riceDay3Data.procurementQty).toBeNull();
      expect(riceDay3Data.procurementPrice).toBeNull();
      expect(riceDay3Data.salesQty).toBe(70);
      expect(riceDay3Data.salesPrice.toString()).toBe('5.49');
      expect(riceDay3Data.procurementAmount).toBeNull(); // Should be null, not zero
      expect(riceDay3Data.salesAmount.toFixed(2)).toBe('384.30');
    });

    test('should handle database errors gracefully', async () => {
      mockDb.importBatch.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(createSampleProducts(mockUserId)).rejects.toThrow('Database connection failed');
    });

    test('should create products with unique IDs and realistic data', async () => {
      const mockImportBatch = { id: 'batch-123' };
      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockResolvedValue({} as any);
      mockDb.dailyData.create.mockResolvedValue({} as any);

      await createSampleProducts(mockUserId);

      const productCalls = mockDb.product.create.mock.calls;
      const productIds = productCalls.map(call => call[0].data.productId);

      // Verify all product IDs are unique
      expect(new Set(productIds).size).toBe(5);
      
      // Verify product IDs follow expected format
      expect(productIds).toEqual(['0000001', '0000002', '0000003', '0000004', '0000005']);

      // Verify opening inventories are realistic
      const openingInventories = productCalls.map(call => call[0].data.openingInventory);
      expect(openingInventories).toEqual([100, 200, 75, 50, 120]);

      // Verify all products belong to the correct user
      productCalls.forEach(call => {
        expect(call[0].data.userId).toBe(mockUserId);
      });
    });

    test('should log progress during creation', async () => {
      const mockImportBatch = { id: 'batch-123' };
      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockImplementation((data) => {
        const productData = data.data as any;
        return Promise.resolve({
          id: `product-${productData.productId}`,
          productId: productData.productId,
          productName: productData.productName,
          ...productData
        } as any);
      });
      mockDb.dailyData.create.mockResolvedValue({} as any);

      const consoleSpy = jest.spyOn(console, 'log');

      await createSampleProducts(mockUserId);

      expect(consoleSpy).toHaveBeenCalledWith('Creating sample products for user:', mockUserId);
      expect(consoleSpy).toHaveBeenCalledWith('Created import batch:', 'batch-123');
      expect(consoleSpy).toHaveBeenCalledWith('Created product:', '0000001');
      expect(consoleSpy).toHaveBeenCalledWith('Sample data creation completed successfully!');
    });

    test('should calculate inventory levels correctly across multiple days', async () => {
      const mockImportBatch = { id: 'batch-123' };
      const mockProduct = { id: 'product-1' };

      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockResolvedValue(mockProduct as any);
      mockDb.dailyData.create.mockResolvedValue({} as any);

      await createSampleProducts(mockUserId);

      const dailyDataCalls = mockDb.dailyData.create.mock.calls;
      
      // Find all calls for the first product (Green Tea, sourceRow: 2)
      const greenTeaCalls = dailyDataCalls
        .filter(call => call[0].data.sourceRow === 2)
        .sort((a, b) => a[0].data.daySequence - b[0].data.daySequence);

      // Verify running inventory calculation
      expect(greenTeaCalls[0][0].data.inventoryLevel).toBe(120); // 100 + 50 - 30
      expect(greenTeaCalls[1][0].data.inventoryLevel).toBe(95);  // 120 + 0 - 25
      expect(greenTeaCalls[2][0].data.inventoryLevel).toBe(100); // 95 + 40 - 35
    });
  });

  describe('Data Integrity', () => {
    test('should maintain referential integrity between batch, products, and daily data', async () => {
      const mockImportBatch = { id: 'batch-123' };
      const mockProduct = { id: 'product-1' };

      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockResolvedValue(mockProduct as any);
      mockDb.dailyData.create.mockResolvedValue({} as any);

      await createSampleProducts(mockUserId);

      // Verify all daily data references the correct batch
      const dailyDataCalls = mockDb.dailyData.create.mock.calls;
      dailyDataCalls.forEach(call => {
        expect(call[0].data.importBatchId).toBe('batch-123');
        expect(call[0].data.productId).toBe('product-1');
      });
    });

    test('should use Decimal type for monetary values', async () => {
      const mockImportBatch = { id: 'batch-123' };
      const mockProduct = { id: 'product-1' };

      mockDb.importBatch.create.mockResolvedValue(mockImportBatch as any);
      mockDb.product.create.mockResolvedValue(mockProduct as any);
      mockDb.dailyData.create.mockResolvedValue({} as any);

      await createSampleProducts(mockUserId);

      const dailyDataCalls = mockDb.dailyData.create.mock.calls;
      const firstCall = dailyDataCalls[0][0].data;

      // Verify Decimal types are used for prices and amounts
      expect(firstCall.procurementPrice).toBeInstanceOf(Decimal);
      expect(firstCall.salesPrice).toBeInstanceOf(Decimal);
      expect(firstCall.procurementAmount).toBeInstanceOf(Decimal);
      expect(firstCall.salesAmount).toBeInstanceOf(Decimal);
    });
  });
});