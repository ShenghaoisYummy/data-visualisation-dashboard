import { Decimal } from '@prisma/client/runtime/library';
import type { ValidatedExcelRow } from './data-validator';

// Types for calculation results
export interface DailyCalculation {
  day: number;
  procurementQty: number | null;
  procurementPrice: Decimal | null;
  procurementAmount: Decimal | null;
  salesQty: number | null;
  salesPrice: Decimal | null;
  salesAmount: Decimal | null;
  inventoryLevel: number;
}

export interface ProductCalculation {
  productId: string;
  productName: string;
  openingInventory: number;
  dailyData: DailyCalculation[];
  finalInventory: number;
  totalProcurementAmount: Decimal | null;
  totalSalesAmount: Decimal | null;
}

export interface CalculationSummary {
  productCount: number;
  totalOpeningInventory: number;
  totalFinalInventory: number;
  totalProcurementValue: Decimal;
  totalSalesValue: Decimal;
  productsWithNegativeInventory: string[];
}

export class InventoryCalculator {
  /**
   * Calculate inventory levels and amounts for all products from validated Excel data
   */
  static calculateInventoryData(validatedRows: ValidatedExcelRow[]): ProductCalculation[] {
    return validatedRows.map(row => this.calculateSingleProduct(row));
  }
  
  /**
   * Calculate inventory levels and amounts for a single product
   */
  static calculateSingleProduct(row: ValidatedExcelRow): ProductCalculation {
    const dailyData: DailyCalculation[] = [];
    let currentInventory = row['Opening Inventory'];
    
    // Calculate data for each day
    for (let day = 1; day <= 3; day++) {
      const procQtyKey = `Procurement Qty (Day ${day})` as keyof ValidatedExcelRow;
      const procPriceKey = `Procurement Price (Day ${day})` as keyof ValidatedExcelRow;
      const salesQtyKey = `Sales Qty (Day ${day})` as keyof ValidatedExcelRow;
      const salesPriceKey = `Sales Price (Day ${day})` as keyof ValidatedExcelRow;
      
      const procurementQty = row[procQtyKey] as number | null;
      const procurementPrice = row[procPriceKey] as number | null;
      const salesQty = row[salesQtyKey] as number | null;
      const salesPrice = row[salesPriceKey] as number | null;
      
      // Calculate amounts with null safety
      const procurementAmount = this.calculateAmount(procurementQty, procurementPrice);
      const salesAmount = this.calculateAmount(salesQty, salesPrice);
      
      // Convert prices to Decimal for precision
      const procurementPriceDecimal = procurementPrice !== null ? new Decimal(procurementPrice) : null;
      const salesPriceDecimal = salesPrice !== null ? new Decimal(salesPrice) : null;
      
      // Calculate running inventory level
      const procurementQtyForCalc = procurementQty ?? 0;
      const salesQtyForCalc = salesQty ?? 0;
      currentInventory = currentInventory + procurementQtyForCalc - salesQtyForCalc;
      
      dailyData.push({
        day,
        procurementQty,
        procurementPrice: procurementPriceDecimal,
        procurementAmount,
        salesQty,
        salesPrice: salesPriceDecimal,
        salesAmount,
        inventoryLevel: currentInventory
      });
    }
    
    // Calculate totals
    const totalProcurementAmount = this.sumDecimalAmounts(
      dailyData.map(d => d.procurementAmount).filter(a => a !== null) as Decimal[]
    );
    
    const totalSalesAmount = this.sumDecimalAmounts(
      dailyData.map(d => d.salesAmount).filter(a => a !== null) as Decimal[]
    );
    
    return {
      productId: row.ID,
      productName: row['Product Name'],
      openingInventory: row['Opening Inventory'],
      dailyData,
      finalInventory: currentInventory,
      totalProcurementAmount,
      totalSalesAmount
    };
  }
  
  /**
   * Calculate amount with null-safe operations
   * Returns null if either quantity or price is null
   */
  private static calculateAmount(quantity: number | null, price: number | null): Decimal | null {
    if (quantity === null || price === null) {
      return null;
    }
    
    // Use Decimal for precise currency calculations
    return new Decimal(quantity).mul(new Decimal(price));
  }
  
  /**
   * Sum Decimal amounts safely
   */
  private static sumDecimalAmounts(amounts: Decimal[]): Decimal | null {
    if (amounts.length === 0) {
      return null;
    }
    
    return amounts.reduce((sum, amount) => sum.add(amount), new Decimal(0));
  }
  
  /**
   * Transform calculation results to database format for DailyData records
   */
  static transformToDatabase(calculations: ProductCalculation[], importBatchId?: string): DatabaseDailyData[] {
    const records: DatabaseDailyData[] = [];
    
    calculations.forEach(product => {
      product.dailyData.forEach((daily, index) => {
        records.push({
          // Note: productId will be set after Product is created in database
          productId: '', // Will be filled by caller after Product creation
          daySequence: daily.day,
          procurementQty: daily.procurementQty,
          procurementPrice: daily.procurementPrice,
          procurementAmount: daily.procurementAmount,
          salesQty: daily.salesQty,
          salesPrice: daily.salesPrice,
          salesAmount: daily.salesAmount,
          inventoryLevel: daily.inventoryLevel,
          importBatchId: importBatchId || null,
          sourceRow: index + 2, // +2 for header and 1-based indexing
          productRef: product.productId // Keep original Excel product ID for reference
        });
      });
    });
    
    return records;
  }
  
  /**
   * Generate calculation summary statistics
   */
  static generateSummary(calculations: ProductCalculation[]): CalculationSummary {
    const totalOpeningInventory = calculations.reduce((sum, p) => sum + p.openingInventory, 0);
    const totalFinalInventory = calculations.reduce((sum, p) => sum + p.finalInventory, 0);
    
    const allProcurementAmounts = calculations
      .map(p => p.totalProcurementAmount)
      .filter(a => a !== null) as Decimal[];
    
    const allSalesAmounts = calculations
      .map(p => p.totalSalesAmount)
      .filter(a => a !== null) as Decimal[];
    
    const totalProcurementValue = this.sumDecimalAmounts(allProcurementAmounts) ?? new Decimal(0);
    const totalSalesValue = this.sumDecimalAmounts(allSalesAmounts) ?? new Decimal(0);
    
    const productsWithNegativeInventory = calculations
      .filter(p => p.finalInventory < 0)
      .map(p => p.productId);
    
    return {
      productCount: calculations.length,
      totalOpeningInventory,
      totalFinalInventory,
      totalProcurementValue,
      totalSalesValue,
      productsWithNegativeInventory
    };
  }
  
  /**
   * Validate calculation results for business logic consistency
   */
  static validateCalculations(calculations: ProductCalculation[]): CalculationValidationResult {
    const errors: CalculationError[] = [];
    const warnings: CalculationWarning[] = [];
    
    calculations.forEach(product => {
      // Check for negative final inventory (allowed but should be flagged)
      if (product.finalInventory < 0) {
        warnings.push({
          productId: product.productId,
          message: `Final inventory is negative (${product.finalInventory}) - oversold scenario`,
          type: 'negative_inventory'
        });
      }
      
      // Check for extremely negative inventory (potential data error)
      if (product.finalInventory < -1000) {
        errors.push({
          productId: product.productId,
          message: `Extremely negative inventory (${product.finalInventory}) - possible data error`,
          type: 'extreme_negative_inventory'
        });
      }
      
      // Validate daily calculations
      product.dailyData.forEach(daily => {
        // Check for precision issues
        if (daily.procurementAmount !== null) {
          const recalculated = this.calculateAmount(daily.procurementQty, daily.procurementPrice?.toNumber() || null);
          if (recalculated && !daily.procurementAmount.equals(recalculated)) {
            errors.push({
              productId: product.productId,
              message: `Procurement amount calculation mismatch on Day ${daily.day}`,
              type: 'calculation_error'
            });
          }
        }
        
        if (daily.salesAmount !== null) {
          const recalculated = this.calculateAmount(daily.salesQty, daily.salesPrice?.toNumber() || null);
          if (recalculated && !daily.salesAmount.equals(recalculated)) {
            errors.push({
              productId: product.productId,
              message: `Sales amount calculation mismatch on Day ${daily.day}`,
              type: 'calculation_error'
            });
          }
        }
      });
      
      // Check inventory flow consistency
      let expectedInventory = product.openingInventory;
      product.dailyData.forEach(daily => {
        const procQty = daily.procurementQty ?? 0;
        const salesQty = daily.salesQty ?? 0;
        expectedInventory = expectedInventory + procQty - salesQty;
        
        if (expectedInventory !== daily.inventoryLevel) {
          errors.push({
            productId: product.productId,
            message: `Inventory level mismatch on Day ${daily.day}. Expected: ${expectedInventory}, Got: ${daily.inventoryLevel}`,
            type: 'inventory_flow_error'
          });
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Format calculation results for human readable display
   */
  static formatCalculationSummary(summary: CalculationSummary): string {
    let report = `Calculation Summary:\n`;
    report += `- Products processed: ${summary.productCount}\n`;
    report += `- Total opening inventory: ${summary.totalOpeningInventory} units\n`;
    report += `- Total final inventory: ${summary.totalFinalInventory} units\n`;
    report += `- Total procurement value: $${summary.totalProcurementValue.toFixed(2)}\n`;
    report += `- Total sales value: $${summary.totalSalesValue.toFixed(2)}\n`;
    
    if (summary.productsWithNegativeInventory.length > 0) {
      report += `- Products with negative inventory: ${summary.productsWithNegativeInventory.length}\n`;
      report += `  ${summary.productsWithNegativeInventory.slice(0, 5).join(', ')}${summary.productsWithNegativeInventory.length > 5 ? '...' : ''}\n`;
    }
    
    return report;
  }
}

// Supporting interfaces
export interface DatabaseDailyData {
  productId: string;
  daySequence: number;
  procurementQty: number | null;
  procurementPrice: Decimal | null;
  procurementAmount: Decimal | null;
  salesQty: number | null;
  salesPrice: Decimal | null;
  salesAmount: Decimal | null;
  inventoryLevel: number;
  importBatchId: string | null;
  sourceRow: number;
  productRef: string; // Original Excel product ID
}

export interface CalculationValidationResult {
  isValid: boolean;
  errors: CalculationError[];
  warnings: CalculationWarning[];
}

export interface CalculationError {
  productId: string;
  message: string;
  type: 'calculation_error' | 'inventory_flow_error' | 'extreme_negative_inventory';
}

export interface CalculationWarning {
  productId: string;
  message: string;
  type: 'negative_inventory' | 'data_quality';
}