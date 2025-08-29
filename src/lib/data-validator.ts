import { z } from 'zod';
import type { ExcelRow, ExcelParseError } from './excel-parser';

// Validation schemas for Excel data
const ProductIdSchema = z.string()
  .min(1, 'Product ID cannot be empty')
  .max(50, 'Product ID too long (max 50 characters)')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Product ID can only contain letters, numbers, hyphens, and underscores');

const ProductNameSchema = z.string()
  .min(1, 'Product Name cannot be empty')
  .max(500, 'Product Name too long (max 500 characters)');

const InventorySchema = z.number()
  .int('Inventory must be a whole number')
  .min(0, 'Inventory cannot be negative');

const QuantitySchema = z.number()
  .int('Quantity must be a whole number')
  .min(0, 'Quantity cannot be negative')
  .nullable();

const PriceSchema = z.number()
  .min(0, 'Price cannot be negative')
  .max(99999.9999, 'Price too high (max 99999.9999)')
  .nullable();

export const ExcelRowSchema = z.object({
  ID: ProductIdSchema,
  'Product Name': ProductNameSchema,
  'Opening Inventory': InventorySchema,
  'Procurement Qty (Day 1)': QuantitySchema,
  'Procurement Price (Day 1)': PriceSchema,
  'Sales Qty (Day 1)': QuantitySchema,
  'Sales Price (Day 1)': PriceSchema,
  'Procurement Qty (Day 2)': QuantitySchema,
  'Procurement Price (Day 2)': PriceSchema,
  'Sales Qty (Day 2)': QuantitySchema,
  'Sales Price (Day 2)': PriceSchema,
  'Procurement Qty (Day 3)': QuantitySchema,
  'Procurement Price (Day 3)': PriceSchema,
  'Sales Qty (Day 3)': QuantitySchema,
  'Sales Price (Day 3)': PriceSchema,
});

export type ValidatedExcelRow = z.infer<typeof ExcelRowSchema>;

export interface ValidationResult {
  validRows: ValidatedExcelRow[];
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  row: number;
  field?: string;
  message: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorCount: number;
  warningCount: number;
  duplicateIds: string[];
  emptyDataDays: number;
}

export class DataValidator {
  /**
   * Validate parsed Excel data with comprehensive business rule checking
   */
  static validateExcelData(rows: ExcelRow[]): ValidationResult {
    const validRows: ValidatedExcelRow[] = [];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Track product IDs for duplicate detection
    const productIds = new Set<string>();
    const duplicateIds = new Set<string>();
    
    let emptyDataDays = 0;
    
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header and 1-based indexing
      
      try {
        // Basic schema validation
        const validatedRow = ExcelRowSchema.parse(row);
        
        // Check for duplicate product IDs
        if (productIds.has(validatedRow.ID)) {
          duplicateIds.add(validatedRow.ID);
          errors.push({
            row: rowNumber,
            field: 'ID',
            value: validatedRow.ID,
            message: `Duplicate Product ID: ${validatedRow.ID}`,
            severity: 'error'
          });
        } else {
          productIds.add(validatedRow.ID);
        }
        
        // Business rule validation
        const businessRuleErrors = this.validateBusinessRules(validatedRow, rowNumber);
        errors.push(...businessRuleErrors);
        
        // Data quality warnings
        const dataWarnings = this.checkDataQuality(validatedRow, rowNumber);
        warnings.push(...dataWarnings);
        
        // Count empty data days
        if (this.hasEmptyDataForAllDays(validatedRow)) {
          emptyDataDays++;
          warnings.push({
            row: rowNumber,
            message: `Product ${validatedRow.ID} has no procurement or sales data for any day`
          });
        }
        
        // Only add to valid rows if no critical errors
        const criticalErrors = businessRuleErrors.filter(e => e.severity === 'error');
        if (criticalErrors.length === 0) {
          validRows.push(validatedRow);
        }
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Convert Zod errors to our format
          error.issues.forEach(zodError => {
            errors.push({
              row: rowNumber,
              field: zodError.path.join('.'),
              value: zodError.input,
              message: zodError.message,
              severity: 'error'
            });
          });
        } else {
          errors.push({
            row: rowNumber,
            field: 'general',
            value: row,
            message: `Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error'
          });
        }
      }
    });
    
    return {
      validRows,
      invalidRows: rows.length - validRows.length,
      errors,
      warnings,
      summary: {
        totalRows: rows.length,
        validRows: validRows.length,
        invalidRows: rows.length - validRows.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        duplicateIds: Array.from(duplicateIds),
        emptyDataDays
      }
    };
  }
  
  /**
   * Validate business rules for a single row
   */
  private static validateBusinessRules(row: ValidatedExcelRow, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (let day = 1; day <= 3; day++) {
      const procQtyKey = `Procurement Qty (Day ${day})` as keyof ValidatedExcelRow;
      const procPriceKey = `Procurement Price (Day ${day})` as keyof ValidatedExcelRow;
      const salesQtyKey = `Sales Qty (Day ${day})` as keyof ValidatedExcelRow;
      const salesPriceKey = `Sales Price (Day ${day})` as keyof ValidatedExcelRow;
      
      const procQty = row[procQtyKey] as number | null;
      const procPrice = row[procPriceKey] as number | null;
      const salesQty = row[salesQtyKey] as number | null;
      const salesPrice = row[salesPriceKey] as number | null;
      
      // Rule: If quantity is provided, price should also be provided (and vice versa)
      if (procQty !== null && procPrice === null) {
        errors.push({
          row: rowNumber,
          field: procPriceKey,
          value: procPrice,
          message: `Procurement price missing for Day ${day} when quantity is provided`,
          severity: 'warning'
        });
      }
      
      if (procPrice !== null && procQty === null) {
        errors.push({
          row: rowNumber,
          field: procQtyKey,
          value: procQty,
          message: `Procurement quantity missing for Day ${day} when price is provided`,
          severity: 'warning'
        });
      }
      
      if (salesQty !== null && salesPrice === null) {
        errors.push({
          row: rowNumber,
          field: salesPriceKey,
          value: salesPrice,
          message: `Sales price missing for Day ${day} when quantity is provided`,
          severity: 'warning'
        });
      }
      
      if (salesPrice !== null && salesQty === null) {
        errors.push({
          row: rowNumber,
          field: salesQtyKey,
          value: salesQty,
          message: `Sales quantity missing for Day ${day} when price is provided`,
          severity: 'warning'
        });
      }
      
      // Rule: Check for unusually high prices that might be data entry errors
      if (procPrice !== null && procPrice > 1000) {
        errors.push({
          row: rowNumber,
          field: procPriceKey,
          value: procPrice,
          message: `Unusually high procurement price for Day ${day}: ${procPrice}`,
          severity: 'warning'
        });
      }
      
      if (salesPrice !== null && salesPrice > 1000) {
        errors.push({
          row: rowNumber,
          field: salesPriceKey,
          value: salesPrice,
          message: `Unusually high sales price for Day ${day}: ${salesPrice}`,
          severity: 'warning'
        });
      }
      
      // Rule: Check for unusually high quantities
      if (procQty !== null && procQty > 10000) {
        errors.push({
          row: rowNumber,
          field: procQtyKey,
          value: procQty,
          message: `Unusually high procurement quantity for Day ${day}: ${procQty}`,
          severity: 'warning'
        });
      }
      
      if (salesQty !== null && salesQty > 10000) {
        errors.push({
          row: rowNumber,
          field: salesQtyKey,
          value: salesQty,
          message: `Unusually high sales quantity for Day ${day}: ${salesQty}`,
          severity: 'warning'
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Check data quality and generate warnings
   */
  private static checkDataQuality(row: ValidatedExcelRow, rowNumber: number): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Check if product name looks suspicious
    if (row['Product Name'].length < 3) {
      warnings.push({
        row: rowNumber,
        field: 'Product Name',
        message: `Very short product name: "${row['Product Name']}"`
      });
    }
    
    // Check for potential encoding issues (special characters)
    const hasSpecialChars = /[^\x00-\x7F]/.test(row['Product Name']);
    if (hasSpecialChars) {
      warnings.push({
        row: rowNumber,
        field: 'Product Name',
        message: `Product name contains special characters, ensure encoding is correct: "${row['Product Name']}"`
      });
    }
    
    // Check for opening inventory of 0 (might be intentional but worth flagging)
    if (row['Opening Inventory'] === 0) {
      warnings.push({
        row: rowNumber,
        field: 'Opening Inventory',
        message: 'Opening inventory is zero - please verify this is correct'
      });
    }
    
    // Check if all procurement and sales data is missing
    let hasAnyData = false;
    for (let day = 1; day <= 3; day++) {
      const procQty = row[`Procurement Qty (Day ${day})` as keyof ValidatedExcelRow];
      const salesQty = row[`Sales Qty (Day ${day})` as keyof ValidatedExcelRow];
      if (procQty !== null || salesQty !== null) {
        hasAnyData = true;
        break;
      }
    }
    
    if (!hasAnyData) {
      warnings.push({
        row: rowNumber,
        message: `Product ${row.ID} has no procurement or sales data for any day`
      });
    }
    
    return warnings;
  }
  
  /**
   * Check if a row has empty data for all days
   */
  private static hasEmptyDataForAllDays(row: ValidatedExcelRow): boolean {
    for (let day = 1; day <= 3; day++) {
      const procQty = row[`Procurement Qty (Day ${day})` as keyof ValidatedExcelRow];
      const procPrice = row[`Procurement Price (Day ${day})` as keyof ValidatedExcelRow];
      const salesQty = row[`Sales Qty (Day ${day})` as keyof ValidatedExcelRow];
      const salesPrice = row[`Sales Price (Day ${day})` as keyof ValidatedExcelRow];
      
      if (procQty !== null || procPrice !== null || salesQty !== null || salesPrice !== null) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Generate human-readable validation summary
   */
  static generateValidationSummary(result: ValidationResult): string {
    const { summary } = result;
    
    let report = `Validation Summary:\n`;
    report += `- Total rows processed: ${summary.totalRows}\n`;
    report += `- Valid rows: ${summary.validRows}\n`;
    report += `- Invalid rows: ${summary.invalidRows}\n`;
    report += `- Errors: ${summary.errorCount}\n`;
    report += `- Warnings: ${summary.warningCount}\n`;
    
    if (summary.duplicateIds.length > 0) {
      report += `- Duplicate Product IDs found: ${summary.duplicateIds.join(', ')}\n`;
    }
    
    if (summary.emptyDataDays > 0) {
      report += `- Products with no data for any day: ${summary.emptyDataDays}\n`;
    }
    
    return report;
  }
  
  /**
   * Filter validation results to show only critical errors
   */
  static getCriticalErrors(result: ValidationResult): ValidationError[] {
    return result.errors.filter(error => error.severity === 'error');
  }
  
  /**
   * Check if validation passed (no critical errors)
   */
  static isValidationSuccessful(result: ValidationResult): boolean {
    const criticalErrors = this.getCriticalErrors(result);
    return criticalErrors.length === 0 && result.validRows.length > 0;
  }
}