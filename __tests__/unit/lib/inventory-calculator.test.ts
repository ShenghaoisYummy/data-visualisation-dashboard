import { InventoryCalculator, ProductCalculation, DailyCalculation } from '@/lib/inventory-calculator';
import { Decimal } from '@prisma/client/runtime/library';
import type { ValidatedExcelRow } from '@/lib/data-validator';

describe('InventoryCalculator', () => {
  const createMockValidatedRow = (
    id: string,
    productName: string,
    openingInventory: number,
    dayData: { [key: string]: number | null }
  ): ValidatedExcelRow => ({
    ID: id,
    'Product Name': productName,
    'Opening Inventory': openingInventory,
    'Procurement Qty (Day 1)': dayData.proc1Qty || null,
    'Procurement Price (Day 1)': dayData.proc1Price || null,
    'Sales Qty (Day 1)': dayData.sales1Qty || null,
    'Sales Price (Day 1)': dayData.sales1Price || null,
    'Procurement Qty (Day 2)': dayData.proc2Qty || null,
    'Procurement Price (Day 2)': dayData.proc2Price || null,
    'Sales Qty (Day 2)': dayData.sales2Qty || null,
    'Sales Price (Day 2)': dayData.sales2Price || null,
    'Procurement Qty (Day 3)': dayData.proc3Qty || null,
    'Procurement Price (Day 3)': dayData.proc3Price || null,
    'Sales Qty (Day 3)': dayData.sales3Qty || null,
    'Sales Price (Day 3)': dayData.sales3Price || null,
  });

  describe('calculateSingleProduct', () => {
    it('should calculate inventory correctly with complete data', () => {
      const mockRow = createMockValidatedRow('001', 'Test Product', 100, {
        proc1Qty: 50, proc1Price: 10.0,
        sales1Qty: 30, sales1Price: 15.0,
        proc2Qty: 25, proc2Price: 11.0,
        sales2Qty: 20, sales2Price: 16.0,
        proc3Qty: 15, proc3Price: 12.0,
        sales3Qty: 10, sales3Price: 17.0
      });

      const result = InventoryCalculator.calculateSingleProduct(mockRow);

      expect(result.productId).toBe('001');
      expect(result.productName).toBe('Test Product');
      expect(result.openingInventory).toBe(100);
      
      // Day 1: 100 + 50 - 30 = 120
      expect(result.dailyData[0].inventoryLevel).toBe(120);
      expect(result.dailyData[0].procurementAmount?.toNumber()).toBe(500); // 50 * 10
      expect(result.dailyData[0].salesAmount?.toNumber()).toBe(450); // 30 * 15
      
      // Day 2: 120 + 25 - 20 = 125
      expect(result.dailyData[1].inventoryLevel).toBe(125);
      expect(result.dailyData[1].procurementAmount?.toNumber()).toBe(275); // 25 * 11
      expect(result.dailyData[1].salesAmount?.toNumber()).toBe(320); // 20 * 16
      
      // Day 3: 125 + 15 - 10 = 130
      expect(result.dailyData[2].inventoryLevel).toBe(130);
      expect(result.dailyData[2].procurementAmount?.toNumber()).toBe(180); // 15 * 12
      expect(result.dailyData[2].salesAmount?.toNumber()).toBe(170); // 10 * 17
      
      expect(result.finalInventory).toBe(130);
    });

    it('should handle null values gracefully in calculations', () => {
      const mockRow = createMockValidatedRow('002', 'Null Product', 100, {
        proc1Qty: null, proc1Price: 10.0,  // Null qty
        sales1Qty: 30, sales1Price: null,  // Null price
        proc2Qty: null, proc2Price: null,  // Both null
        sales2Qty: null, sales2Price: null, // Both null
        proc3Qty: 15, proc3Price: 12.0,
        sales3Qty: 10, sales3Price: 17.0
      });

      const result = InventoryCalculator.calculateSingleProduct(mockRow);

      // Day 1: 100 + 0 - 30 = 70 (null qty treated as 0 for inventory calc)
      expect(result.dailyData[0].inventoryLevel).toBe(70);
      expect(result.dailyData[0].procurementAmount).toBeNull(); // null qty means null amount
      expect(result.dailyData[0].salesAmount).toBeNull(); // null price means null amount

      // Day 2: 70 + 0 - 0 = 70 (all nulls)
      expect(result.dailyData[1].inventoryLevel).toBe(70);
      expect(result.dailyData[1].procurementAmount).toBeNull();
      expect(result.dailyData[1].salesAmount).toBeNull();

      // Day 3: 70 + 15 - 10 = 75 (complete data)
      expect(result.dailyData[2].inventoryLevel).toBe(75);
      expect(result.dailyData[2].procurementAmount?.toNumber()).toBe(180); // 15 * 12
      expect(result.dailyData[2].salesAmount?.toNumber()).toBe(170); // 10 * 17
    });

    it('should allow negative inventory levels (oversold scenarios)', () => {
      const mockRow = createMockValidatedRow('003', 'Oversold Product', 10, {
        proc1Qty: 5, proc1Price: 10.0,
        sales1Qty: 30, sales1Price: 15.0, // Selling more than available
        proc2Qty: 10, proc2Price: 11.0,
        sales2Qty: 20, sales2Price: 16.0, // Still overselling
        proc3Qty: 50, proc3Price: 12.0,
        sales3Qty: 5, sales3Price: 17.0
      });

      const result = InventoryCalculator.calculateSingleProduct(mockRow);

      // Day 1: 10 + 5 - 30 = -15 (negative inventory allowed)
      expect(result.dailyData[0].inventoryLevel).toBe(-15);

      // Day 2: -15 + 10 - 20 = -25
      expect(result.dailyData[1].inventoryLevel).toBe(-25);

      // Day 3: -25 + 50 - 5 = 20 (back to positive)
      expect(result.dailyData[2].inventoryLevel).toBe(20);

      expect(result.finalInventory).toBe(20);
    });

    it('should use Decimal precision for currency calculations', () => {
      const mockRow = createMockValidatedRow('004', 'Precision Product', 100, {
        proc1Qty: 3, proc1Price: 10.33, // Should be 30.99
        sales1Qty: 7, sales1Price: 15.47 // Should be 108.29
      });

      const result = InventoryCalculator.calculateSingleProduct(mockRow);

      expect(result.dailyData[0].procurementAmount?.toNumber()).toBe(30.99);
      expect(result.dailyData[0].salesAmount?.toNumber()).toBe(108.29);

      // Verify these are Decimal objects
      expect(result.dailyData[0].procurementAmount).toBeInstanceOf(Decimal);
      expect(result.dailyData[0].salesAmount).toBeInstanceOf(Decimal);
    });

    it('should calculate totals correctly', () => {
      const mockRow = createMockValidatedRow('005', 'Total Product', 100, {
        proc1Qty: 50, proc1Price: 10.0, // 500
        sales1Qty: 30, sales1Price: 15.0, // 450
        proc2Qty: 25, proc2Price: 11.0, // 275
        sales2Qty: 20, sales2Price: 16.0, // 320
        proc3Qty: null, proc3Price: null, // null
        sales3Qty: 10, sales3Price: 17.0 // 170
      });

      const result = InventoryCalculator.calculateSingleProduct(mockRow);

      expect(result.totalProcurementAmount?.toNumber()).toBe(775); // 500 + 275
      expect(result.totalSalesAmount?.toNumber()).toBe(940); // 450 + 320 + 170
    });
  });

  describe('calculateInventoryData', () => {
    it('should calculate data for multiple products', () => {
      const mockRows = [
        createMockValidatedRow('001', 'Product 1', 100, {
          proc1Qty: 50, proc1Price: 10.0,
          sales1Qty: 30, sales1Price: 15.0
        }),
        createMockValidatedRow('002', 'Product 2', 200, {
          proc1Qty: 100, proc1Price: 5.0,
          sales1Qty: 80, sales1Price: 8.0
        })
      ];

      const results = InventoryCalculator.calculateInventoryData(mockRows);

      expect(results).toHaveLength(2);
      expect(results[0].productId).toBe('001');
      expect(results[1].productId).toBe('002');
      
      // Verify calculations are independent
      expect(results[0].dailyData[0].inventoryLevel).toBe(120); // 100 + 50 - 30
      expect(results[1].dailyData[0].inventoryLevel).toBe(220); // 200 + 100 - 80
    });
  });

  describe('generateSummary', () => {
    it('should generate summary statistics', () => {
      const mockCalculations: ProductCalculation[] = [
        {
          productId: '001',
          productName: 'Product 1',
          openingInventory: 100,
          finalInventory: 120,
          totalProcurementAmount: new Decimal(500),
          totalSalesAmount: new Decimal(450),
          dailyData: []
        },
        {
          productId: '002',
          productName: 'Product 2',
          openingInventory: 200,
          finalInventory: -10, // Negative inventory
          totalProcurementAmount: new Decimal(300),
          totalSalesAmount: new Decimal(640),
          dailyData: []
        }
      ];

      const summary = InventoryCalculator.generateSummary(mockCalculations);

      expect(summary.productCount).toBe(2);
      expect(summary.totalOpeningInventory).toBe(300);
      expect(summary.totalFinalInventory).toBe(110); // 120 + (-10)
      expect(summary.totalProcurementValue.toNumber()).toBe(800);
      expect(summary.totalSalesValue.toNumber()).toBe(1090);
      expect(summary.productsWithNegativeInventory).toEqual(['002']);
    });

    it('should handle null amounts in summary', () => {
      const mockCalculations: ProductCalculation[] = [
        {
          productId: '001',
          productName: 'Product 1',
          openingInventory: 100,
          finalInventory: 100,
          totalProcurementAmount: null,
          totalSalesAmount: null,
          dailyData: []
        }
      ];

      const summary = InventoryCalculator.generateSummary(mockCalculations);

      expect(summary.productCount).toBe(1);
      expect(summary.totalProcurementValue.toNumber()).toBe(0);
      expect(summary.totalSalesValue.toNumber()).toBe(0);
    });
  });

  describe('validateCalculations', () => {
    it('should validate calculation consistency', () => {
      const mockCalculations: ProductCalculation[] = [
        {
          productId: '001',
          productName: 'Valid Product',
          openingInventory: 100,
          finalInventory: 120,
          totalProcurementAmount: new Decimal(500),
          totalSalesAmount: new Decimal(450),
          dailyData: [
            {
              day: 1,
              procurementQty: 50,
              procurementPrice: new Decimal(10),
              procurementAmount: new Decimal(500),
              salesQty: 30,
              salesPrice: new Decimal(15),
              salesAmount: new Decimal(450),
              inventoryLevel: 120
            }
          ]
        }
      ];

      const validation = InventoryCalculator.validateCalculations(mockCalculations);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect negative inventory warnings', () => {
      const mockCalculations: ProductCalculation[] = [
        {
          productId: '001',
          productName: 'Negative Product',
          openingInventory: 10,
          finalInventory: -50,
          totalProcurementAmount: null,
          totalSalesAmount: new Decimal(600),
          dailyData: [
            {
              day: 1,
              procurementQty: null,
              procurementPrice: null,
              procurementAmount: null,
              salesQty: 60,
              salesPrice: new Decimal(10),
              salesAmount: new Decimal(600),
              inventoryLevel: -50
            }
          ]
        }
      ];

      const validation = InventoryCalculator.validateCalculations(mockCalculations);

      expect(validation.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'negative_inventory',
            message: expect.stringContaining('negative')
          })
        ])
      );
    });

    it('should detect extreme negative inventory errors', () => {
      const mockCalculations: ProductCalculation[] = [
        {
          productId: '001',
          productName: 'Extreme Product',
          openingInventory: 10,
          finalInventory: -2000, // Extremely negative
          totalProcurementAmount: null,
          totalSalesAmount: new Decimal(20000),
          dailyData: []
        }
      ];

      const validation = InventoryCalculator.validateCalculations(mockCalculations);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'extreme_negative_inventory'
          })
        ])
      );
    });

    it('should detect calculation mismatches', () => {
      const mockCalculations: ProductCalculation[] = [
        {
          productId: '001',
          productName: 'Mismatch Product',
          openingInventory: 100,
          finalInventory: 130,
          totalProcurementAmount: new Decimal(500),
          totalSalesAmount: new Decimal(450),
          dailyData: [
            {
              day: 1,
              procurementQty: 50,
              procurementPrice: new Decimal(10),
              procurementAmount: new Decimal(999), // Wrong calculation
              salesQty: 30,
              salesPrice: new Decimal(15),
              salesAmount: new Decimal(450),
              inventoryLevel: 120
            }
          ]
        }
      ];

      const validation = InventoryCalculator.validateCalculations(mockCalculations);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'calculation_error',
            message: expect.stringContaining('calculation mismatch')
          })
        ])
      );
    });

    it('should detect inventory flow errors', () => {
      const mockCalculations: ProductCalculation[] = [
        {
          productId: '001',
          productName: 'Flow Error Product',
          openingInventory: 100,
          finalInventory: 120,
          totalProcurementAmount: new Decimal(500),
          totalSalesAmount: new Decimal(450),
          dailyData: [
            {
              day: 1,
              procurementQty: 50,
              procurementPrice: new Decimal(10),
              procurementAmount: new Decimal(500),
              salesQty: 30,
              salesPrice: new Decimal(15),
              salesAmount: new Decimal(450),
              inventoryLevel: 999 // Wrong inventory level
            }
          ]
        }
      ];

      const validation = InventoryCalculator.validateCalculations(mockCalculations);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'inventory_flow_error',
            message: expect.stringContaining('mismatch')
          })
        ])
      );
    });
  });

  describe('formatCalculationSummary', () => {
    it('should format summary as human-readable string', () => {
      const mockSummary = {
        productCount: 2,
        totalOpeningInventory: 300,
        totalFinalInventory: 350,
        totalProcurementValue: new Decimal(1500.75),
        totalSalesValue: new Decimal(2000.50),
        productsWithNegativeInventory: ['001', '002']
      };

      const formatted = InventoryCalculator.formatCalculationSummary(mockSummary);

      expect(formatted).toContain('Products processed: 2');
      expect(formatted).toContain('Total opening inventory: 300 units');
      expect(formatted).toContain('Total final inventory: 350 units');
      expect(formatted).toContain('Total procurement value: $1500.75');
      expect(formatted).toContain('Total sales value: $2000.50');
      expect(formatted).toContain('Products with negative inventory: 2');
    });
  });

  describe('private helper methods', () => {
    it('should calculate amounts correctly with null safety', () => {
      // Test via public interface since methods are private
      const mockRow = createMockValidatedRow('001', 'Test', 100, {
        proc1Qty: 10,
        proc1Price: 5.5,
        sales1Qty: null,
        sales1Price: 8.0
      });

      const result = InventoryCalculator.calculateSingleProduct(mockRow);

      expect(result.dailyData[0].procurementAmount?.toNumber()).toBe(55); // 10 * 5.5
      expect(result.dailyData[0].salesAmount).toBeNull(); // null qty
    });
  });
});