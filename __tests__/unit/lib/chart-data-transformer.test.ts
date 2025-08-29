import { ChartDataTransformer, RawProduct, RawDailyData, ProductWithChartData } from '@/lib/chart-data-transformer';
import { Decimal } from '@prisma/client/runtime/library';

describe('ChartDataTransformer', () => {
  // Test fixtures
  const mockRawProduct: RawProduct = {
    id: 'test-product-1',
    productId: '0000001',
    productName: 'Test Product',
    openingInventory: 100,
    dailyData: [
      {
        daySequence: 1,
        procurementQty: 50,
        procurementPrice: new Decimal('10.50'),
        salesQty: 30,
        salesPrice: new Decimal('15.99'),
        inventoryLevel: 120,
        procurementAmount: new Decimal('525.00'),
        salesAmount: new Decimal('479.70')
      },
      {
        daySequence: 2,
        procurementQty: null,
        procurementPrice: null,
        salesQty: 25,
        salesPrice: new Decimal('15.99'),
        inventoryLevel: 95,
        procurementAmount: null,
        salesAmount: new Decimal('399.75')
      },
      {
        daySequence: 3,
        procurementQty: 40,
        procurementPrice: new Decimal('10.00'),
        salesQty: 35,
        salesPrice: new Decimal('14.99'),
        inventoryLevel: 100,
        procurementAmount: new Decimal('400.00'),
        salesAmount: new Decimal('524.65')
      }
    ]
  };

  const mockProductWithNegativeInventory: RawProduct = {
    id: 'test-product-2',
    productId: '0000002',
    productName: 'Oversold Product',
    openingInventory: 50,
    dailyData: [
      {
        daySequence: 1,
        procurementQty: 20,
        procurementPrice: new Decimal('5.00'),
        salesQty: 80,
        salesPrice: new Decimal('10.00'),
        inventoryLevel: -10,
        procurementAmount: new Decimal('100.00'),
        salesAmount: new Decimal('800.00')
      }
    ]
  };

  const mockProductWithMissingDays: RawProduct = {
    id: 'test-product-3',
    productId: '0000003',
    productName: 'Partial Data Product',
    openingInventory: 75,
    dailyData: [
      {
        daySequence: 1,
        procurementQty: 30,
        procurementPrice: new Decimal('8.00'),
        salesQty: 20,
        salesPrice: new Decimal('12.00'),
        inventoryLevel: 85,
        procurementAmount: new Decimal('240.00'),
        salesAmount: new Decimal('240.00')
      }
      // Missing days 2 and 3
    ]
  };

  describe('transformSingleProduct', () => {
    test('should transform product with complete daily data correctly', () => {
      const result = ChartDataTransformer.transformSingleProduct(mockRawProduct);

      expect(result).toMatchObject({
        id: 'test-product-1',
        productId: '0000001',
        productName: 'Test Product',
        openingInventory: 100
      });

      expect(result.chartData).toHaveLength(3);
      
      // Day 1
      expect(result.chartData[0]).toEqual({
        day: 'Day 1',
        daySequence: 1,
        inventoryLevel: 120,
        procurementAmount: 525.00,
        salesAmount: 479.70,
        procurementQty: 50,
        procurementPrice: 10.50,
        salesQty: 30,
        salesPrice: 15.99
      });

      // Day 2 (null procurement)
      expect(result.chartData[1]).toEqual({
        day: 'Day 2',
        daySequence: 2,
        inventoryLevel: 95,
        procurementAmount: null,
        salesAmount: 399.75,
        procurementQty: null,
        procurementPrice: null,
        salesQty: 25,
        salesPrice: 15.99
      });

      // Day 3
      expect(result.chartData[2]).toEqual({
        day: 'Day 3',
        daySequence: 3,
        inventoryLevel: 100,
        procurementAmount: 400.00,
        salesAmount: 524.65,
        procurementQty: 40,
        procurementPrice: 10.00,
        salesQty: 35,
        salesPrice: 14.99
      });
    });

    test('should handle products with negative inventory levels', () => {
      const result = ChartDataTransformer.transformSingleProduct(mockProductWithNegativeInventory);

      expect(result.chartData[0].inventoryLevel).toBe(-10);
      expect(result.summary.hasNegativeInventory).toBe(true);
      expect(result.summary.finalInventory).toBe(-10);
    });

    test('should handle products with missing days', () => {
      const result = ChartDataTransformer.transformSingleProduct(mockProductWithMissingDays);

      expect(result.chartData).toHaveLength(3);
      
      // Day 1 should have data
      expect(result.chartData[0].procurementQty).toBe(30);
      expect(result.chartData[0].salesQty).toBe(20);

      // Days 2 and 3 should have null values
      expect(result.chartData[1].procurementQty).toBeNull();
      expect(result.chartData[1].salesQty).toBeNull();
      expect(result.chartData[2].procurementQty).toBeNull();
      expect(result.chartData[2].salesQty).toBeNull();

      // But inventory levels should be calculated
      expect(result.chartData[1].inventoryLevel).toBe(85); // Same as day 1
      expect(result.chartData[2].inventoryLevel).toBe(85); // Same as day 2
    });

    test('should handle product with no daily data', () => {
      const emptyProduct: RawProduct = {
        id: 'empty-product',
        productId: '0000999',
        productName: 'Empty Product',
        openingInventory: 50,
        dailyData: []
      };

      const result = ChartDataTransformer.transformSingleProduct(emptyProduct);

      expect(result.chartData).toHaveLength(3);
      
      // All days should have opening inventory level and null values
      result.chartData.forEach((day, index) => {
        expect(day.inventoryLevel).toBe(50);
        expect(day.procurementAmount).toBeNull();
        expect(day.salesAmount).toBeNull();
        expect(day.procurementQty).toBeNull();
        expect(day.salesQty).toBeNull();
        expect(day.day).toBe(`Day ${index + 1}`);
      });

      expect(result.summary.finalInventory).toBe(50);
      expect(result.summary.hasNegativeInventory).toBe(false);
    });
  });

  describe('calculateProductSummary', () => {
    test('should calculate summary statistics correctly', () => {
      const chartData = ChartDataTransformer.transformSingleProduct(mockRawProduct).chartData;
      const summary = ChartDataTransformer.calculateProductSummary(chartData);

      expect(summary).toEqual({
        totalProcurementValue: 925.00, // 525 + 0 + 400
        totalSalesValue: 1404.10, // 479.70 + 399.75 + 524.65
        finalInventory: 100,
        hasNegativeInventory: false
      });
    });

    test('should detect negative inventory correctly', () => {
      const chartData = ChartDataTransformer.transformSingleProduct(mockProductWithNegativeInventory).chartData;
      const summary = ChartDataTransformer.calculateProductSummary(chartData);

      expect(summary.hasNegativeInventory).toBe(true);
      expect(summary.finalInventory).toBe(-10);
    });

    test('should handle empty chart data', () => {
      const summary = ChartDataTransformer.calculateProductSummary([]);

      expect(summary).toEqual({
        totalProcurementValue: 0,
        totalSalesValue: 0,
        finalInventory: 0,
        hasNegativeInventory: false
      });
    });
  });

  describe('transformProductsForChart', () => {
    test('should transform multiple products correctly', () => {
      const products = [mockRawProduct, mockProductWithNegativeInventory];
      const results = ChartDataTransformer.transformProductsForChart(products);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('test-product-1');
      expect(results[1].id).toBe('test-product-2');
      expect(results[1].summary.hasNegativeInventory).toBe(true);
    });

    test('should handle empty product array', () => {
      const results = ChartDataTransformer.transformProductsForChart([]);
      expect(results).toEqual([]);
    });
  });

  describe('mergeMultipleProductData', () => {
    test('should merge data for single product', () => {
      const productData = ChartDataTransformer.transformSingleProduct(mockRawProduct);
      const merged = ChartDataTransformer.mergeMultipleProductData([productData], [productData.id]);

      expect(merged).toHaveLength(3);
      expect(merged[0]).toMatchObject({
        day: 'Day 1',
        inventoryLevel: 120,
        procurementAmount: 525.00,
        salesAmount: 479.70,
        procurementQty: 50,
        procurementPrice: 10.50
      });
    });

    test('should merge data for multiple products with unique keys', () => {
      const product1 = ChartDataTransformer.transformSingleProduct(mockRawProduct);
      const product2 = ChartDataTransformer.transformSingleProduct(mockProductWithNegativeInventory);
      const merged = ChartDataTransformer.mergeMultipleProductData([product1, product2], [product1.id, product2.id]);

      expect(merged).toHaveLength(3);
      expect(merged[0]).toMatchObject({
        day: 'Day 1',
        'inventoryLevel_0000001': 120,
        'inventoryLevel_0000002': -10,
        'procurementAmount_0000001': 525.00,
        'procurementAmount_0000002': 100.00
      });
    });

    test('should return empty array for no selected products', () => {
      const productData = ChartDataTransformer.transformSingleProduct(mockRawProduct);
      const merged = ChartDataTransformer.mergeMultipleProductData([productData], []);

      expect(merged).toEqual([]);
    });

    test('should handle selected products not in the products array', () => {
      const productData = ChartDataTransformer.transformSingleProduct(mockRawProduct);
      const merged = ChartDataTransformer.mergeMultipleProductData([productData], ['non-existent-id']);

      expect(merged).toEqual([]);
    });
  });

  describe('calculateInventoryLevel', () => {
    test('should calculate inventory correctly with all values', () => {
      const result = ChartDataTransformer.calculateInventoryLevel(100, 50, 30);
      expect(result).toBe(120); // 100 + 50 - 30
    });

    test('should handle null procurement quantity', () => {
      const result = ChartDataTransformer.calculateInventoryLevel(100, null, 30);
      expect(result).toBe(70); // 100 + 0 - 30
    });

    test('should handle null sales quantity', () => {
      const result = ChartDataTransformer.calculateInventoryLevel(100, 50, null);
      expect(result).toBe(150); // 100 + 50 - 0
    });

    test('should handle both null values', () => {
      const result = ChartDataTransformer.calculateInventoryLevel(100, null, null);
      expect(result).toBe(100); // 100 + 0 - 0
    });

    test('should allow negative inventory', () => {
      const result = ChartDataTransformer.calculateInventoryLevel(10, 5, 20);
      expect(result).toBe(-5); // 10 + 5 - 20
    });
  });

  describe('calculateAmount', () => {
    test('should calculate amount correctly', () => {
      const result = ChartDataTransformer.calculateAmount(10, new Decimal('5.50'));
      expect(result).toBe(55.0);
    });

    test('should return null for null quantity', () => {
      const result = ChartDataTransformer.calculateAmount(null, new Decimal('5.50'));
      expect(result).toBeNull();
    });

    test('should return null for null price', () => {
      const result = ChartDataTransformer.calculateAmount(10, null);
      expect(result).toBeNull();
    });

    test('should return null for both null values', () => {
      const result = ChartDataTransformer.calculateAmount(null, null);
      expect(result).toBeNull();
    });

    test('should handle zero quantity', () => {
      const result = ChartDataTransformer.calculateAmount(0, new Decimal('5.50'));
      expect(result).toBe(0);
    });

    test('should handle zero price', () => {
      const result = ChartDataTransformer.calculateAmount(10, new Decimal('0'));
      expect(result).toBe(0);
    });
  });
});