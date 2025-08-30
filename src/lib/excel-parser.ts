import * as XLSX from 'xlsx';

// Expected Excel structure based on requirements
export interface ExcelRow {
  ID: string;
  'Product Name': string;
  'Opening Inventory': number;
  'Procurement Qty (Day 1)': number | null;
  'Procurement Price (Day 1)': number | null;
  'Sales Qty (Day 1)': number | null;
  'Sales Price (Day 1)': number | null;
  'Procurement Qty (Day 2)': number | null;
  'Procurement Price (Day 2)': number | null;
  'Sales Qty (Day 2)': number | null;
  'Sales Price (Day 2)': number | null;
  'Procurement Qty (Day 3)': number | null;
  'Procurement Price (Day 3)': number | null;
  'Sales Qty (Day 3)': number | null;
  'Sales Price (Day 3)': number | null;
}

export interface ParsedExcelData {
  rows: ExcelRow[];
  totalRows: number;
  validRows: number;
  errors: ExcelParseError[];
}

export interface ExcelParseError {
  row: number;
  field: string;
  value: unknown;
  message: string;
}

const REQUIRED_COLUMNS = [
  'ID',
  'Product Name',
  'Opening Inventory',
  'Procurement Qty (Day 1)',
  'Procurement Price (Day 1)',
  'Sales Qty (Day 1)',
  'Sales Price (Day 1)',
  'Procurement Qty (Day 2)',
  'Procurement Price (Day 2)',
  'Sales Qty (Day 2)',
  'Sales Price (Day 2)',
  'Procurement Qty (Day 3)',
  'Procurement Price (Day 3)',
  'Sales Qty (Day 3)',
  'Sales Price (Day 3)'
];

export class ExcelParser {
  /**
   * Parse Excel file buffer and return structured data
   */
  static parseExcelBuffer(buffer: Buffer): ParsedExcelData {
    try {
      // Read Excel file from buffer
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Get first worksheet
      const worksheetName = workbook.SheetNames[0];
      if (!worksheetName) {
        throw new Error('Excel file contains no worksheets');
      }
      
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: null // Use null for empty cells instead of empty string
      });
      
      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }
      
      return this.processJsonData(jsonData as any[][]);
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Process JSON data from Excel and validate structure
   */
  private static processJsonData(jsonData: any[][]): ParsedExcelData {
    const errors: ExcelParseError[] = [];
    const validRows: ExcelRow[] = [];
    
    // Validate headers (first row)
    const headers = jsonData[0] as string[];
    const headerErrors = this.validateHeaders(headers);
    if (headerErrors.length > 0) {
      errors.push(...headerErrors);
      return {
        rows: [],
        totalRows: jsonData.length - 1,
        validRows: 0,
        errors
      };
    }
    
    // Process data rows (skip header)
    const dataRows = jsonData.slice(1);
    
    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because we skip header and Excel is 1-indexed
      const rowErrors: ExcelParseError[] = [];
      
      try {
        const parsedRow = this.parseRow(row, headers, rowNumber, rowErrors);
        if (rowErrors.length === 0) {
          validRows.push(parsedRow);
        }
      } catch (error) {
        rowErrors.push({
          row: rowNumber,
          field: 'general',
          value: row,
          message: error instanceof Error ? error.message : 'Unknown parsing error'
        });
      }
      
      errors.push(...rowErrors);
    });
    
    return {
      rows: validRows,
      totalRows: dataRows.length,
      validRows: validRows.length,
      errors
    };
  }
  
  /**
   * Validate Excel headers match expected structure
   */
  private static validateHeaders(headers: string[]): ExcelParseError[] {
    const errors: ExcelParseError[] = [];
    
    // Check all required columns are present
    REQUIRED_COLUMNS.forEach((requiredColumn, index) => {
      if (!headers.includes(requiredColumn)) {
        errors.push({
          row: 1,
          field: `column_${index}`,
          value: headers[index] || 'missing',
          message: `Missing required column: "${requiredColumn}"`
        });
      }
    });
    
    // Check for unexpected extra columns
    headers.forEach((header, index) => {
      if (header && !REQUIRED_COLUMNS.includes(header)) {
        errors.push({
          row: 1,
          field: `column_${index}`,
          value: header,
          message: `Unexpected column: "${header}"`
        });
      }
    });
    
    return errors;
  }
  
  /**
   * Parse individual row with validation
   */
  private static parseRow(
    row: any[], 
    headers: string[], 
    rowNumber: number, 
    errors: ExcelParseError[]
  ): ExcelRow {
    const rowData: any = {};
    
    // Map row values to column headers
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    
    // Validate and convert each field
    const parsedRow: Partial<ExcelRow> = {};
    
    // Required string fields
    parsedRow.ID = this.parseStringField(rowData['ID'], 'ID', rowNumber, errors, true);
    parsedRow['Product Name'] = this.parseStringField(rowData['Product Name'], 'Product Name', rowNumber, errors, true);
    
    // Required numeric field
    parsedRow['Opening Inventory'] = this.parseNumericField(rowData['Opening Inventory'], 'Opening Inventory', rowNumber, errors, true) as number;
    
    // Optional numeric fields for each day
    for (let day = 1; day <= 3; day++) {
      (parsedRow as any)[`Procurement Qty (Day ${day})`] = 
        this.parseNumericField(rowData[`Procurement Qty (Day ${day})`], `Procurement Qty (Day ${day})`, rowNumber, errors, false);
      
      (parsedRow as any)[`Procurement Price (Day ${day})`] = 
        this.parseNumericField(rowData[`Procurement Price (Day ${day})`], `Procurement Price (Day ${day})`, rowNumber, errors, false);
      
      (parsedRow as any)[`Sales Qty (Day ${day})`] = 
        this.parseNumericField(rowData[`Sales Qty (Day ${day})`], `Sales Qty (Day ${day})`, rowNumber, errors, false);
      
      (parsedRow as any)[`Sales Price (Day ${day})`] = 
        this.parseNumericField(rowData[`Sales Price (Day ${day})`], `Sales Price (Day ${day})`, rowNumber, errors, false);
    }
    
    return parsedRow as ExcelRow;
  }
  
  /**
   * Parse and validate string fields
   */
  private static parseStringField(
    value: any, 
    fieldName: string, 
    rowNumber: number, 
    errors: ExcelParseError[], 
    required: boolean
  ): string {
    if (value === null || value === undefined || value === '') {
      if (required) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value,
          message: `${fieldName} is required but is empty`
        });
        return '';
      }
      return '';
    }
    
    const stringValue = String(value).trim();
    
    // Validate string length
    if (stringValue.length === 0 && required) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        message: `${fieldName} cannot be empty`
      });
      return '';
    }
    
    if (stringValue.length > 500) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value: stringValue.substring(0, 50) + '...',
        message: `${fieldName} is too long (max 500 characters)`
      });
      return stringValue.substring(0, 500);
    }
    
    return stringValue;
  }
  
  /**
   * Parse and validate numeric fields with null safety
   */
  private static parseNumericField(
    value: any, 
    fieldName: string, 
    rowNumber: number, 
    errors: ExcelParseError[], 
    required: boolean
  ): number | null {
    // Handle null/undefined/empty values
    if (value === null || value === undefined || value === '') {
      if (required) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value,
          message: `${fieldName} is required but is empty`
        });
        return 0;
      }
      return null; // Null is valid for optional fields
    }
    
    // Try to convert to number
    const numericValue = Number(value);
    
    if (isNaN(numericValue)) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        message: `${fieldName} must be a valid number, got "${value}"`
      });
      return required ? 0 : null;
    }
    
    // Business rule validation: no negative values for quantities and prices
    if (numericValue < 0) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value: numericValue,
        message: `${fieldName} cannot be negative, got ${numericValue}`
      });
      return required ? 0 : null;
    }
    
    // Check for reasonable ranges
    if (numericValue > 999999) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value: numericValue,
        message: `${fieldName} seems unusually large: ${numericValue}`
      });
    }
    
    return numericValue;
  }
  
  /**
   * Validate Excel file format before processing
   */
  static validateFileFormat(buffer: Buffer): { isValid: boolean; error?: string } {
    try {
      // Check if it's a valid Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (workbook.SheetNames.length === 0) {
        return { isValid: false, error: 'Excel file contains no worksheets' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Invalid Excel file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}