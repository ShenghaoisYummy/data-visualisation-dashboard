import { ExcelParser, ExcelRow } from '@/lib/excel-parser';
import * as XLSX from 'xlsx';

// Mock XLSX for consistent testing
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

const mockXLSX = XLSX as jest.Mocked<typeof XLSX>;

describe('ExcelParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseExcelBuffer', () => {
    const validExcelData = [
      // Header row
      [
        'ID', 'Product Name', 'Opening Inventory',
        'Procurement Qty (Day 1)', 'Procurement Price (Day 1)',
        'Sales Qty (Day 1)', 'Sales Price (Day 1)',
        'Procurement Qty (Day 2)', 'Procurement Price (Day 2)',
        'Sales Qty (Day 2)', 'Sales Price (Day 2)',
        'Procurement Qty (Day 3)', 'Procurement Price (Day 3)',
        'Sales Qty (Day 3)', 'Sales Price (Day 3)'
      ],
      // Valid data row
      [
        '0000001', 'Test Product', 100,
        50, 10.5,
        30, 15.0,
        25, 11.0,
        20, 16.0,
        15, 12.0,
        10, 17.0
      ]
    ];

    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {}
      }
    };

    it('should parse valid Excel data correctly', () => {
      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(validExcelData);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.rows[0]).toEqual({
        ID: '0000001',
        'Product Name': 'Test Product',
        'Opening Inventory': 100,
        'Procurement Qty (Day 1)': 50,
        'Procurement Price (Day 1)': 10.5,
        'Sales Qty (Day 1)': 30,
        'Sales Price (Day 1)': 15.0,
        'Procurement Qty (Day 2)': 25,
        'Procurement Price (Day 2)': 11.0,
        'Sales Qty (Day 2)': 20,
        'Sales Price (Day 2)': 16.0,
        'Procurement Qty (Day 3)': 15,
        'Procurement Price (Day 3)': 12.0,
        'Sales Qty (Day 3)': 10,
        'Sales Price (Day 3)': 17.0
      });
    });

    it('should handle missing/null values gracefully', () => {
      const dataWithNulls = [
        validExcelData[0], // Header
        [
          '0000002', 'Product with nulls', 50,
          null, 10.5,  // Null qty but has price
          30, null,    // Has qty but null price
          null, null,  // Both null
          20, 16.0,
          null, null,  // Both null
          10, 17.0
        ]
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(dataWithNulls);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      expect(result.validRows).toBe(1);
      expect(result.rows[0]['Procurement Qty (Day 1)']).toBeNull();
      expect(result.rows[0]['Sales Price (Day 1)']).toBeNull();
      expect(result.rows[0]['Procurement Qty (Day 2)']).toBeNull();
      expect(result.rows[0]['Procurement Price (Day 2)']).toBeNull();
    });

    it('should validate Excel structure and reject invalid headers', () => {
      const invalidHeaders = [
        ['Wrong', 'Headers', 'Here'], // Invalid headers
        ['0000001', 'Test Product', 100]
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(invalidHeaders);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      expect(result.validRows).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Missing required column');
    });

    it('should handle invalid data types', () => {
      const invalidDataTypes = [
        validExcelData[0], // Header
        [
          '0000003', 'Invalid Product', 'not a number', // Invalid opening inventory
          'fifty', 10.5,  // Invalid procurement qty
          30, 'fifteen',  // Invalid sales price
          25, 11.0,
          20, 16.0,
          15, 12.0,
          10, 17.0
        ]
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(invalidDataTypes);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'Opening Inventory',
            message: expect.stringContaining('must be a valid number')
          }),
          expect.objectContaining({
            field: 'Procurement Qty (Day 1)',
            message: expect.stringContaining('must be a valid number')
          })
        ])
      );
    });

    it('should validate business rules - negative values not allowed', () => {
      const negativeValues = [
        validExcelData[0], // Header
        [
          '0000004', 'Negative Product', -10, // Negative opening inventory
          -5, 10.5,  // Negative procurement qty
          30, -15.0, // Negative sales price
          25, 11.0,
          20, 16.0,
          15, 12.0,
          10, 17.0
        ]
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(negativeValues);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('cannot be negative')
          })
        ])
      );
    });

    it('should handle empty Excel file', () => {
      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue([]);

      const buffer = Buffer.from('mock excel data');
      
      expect(() => ExcelParser.parseExcelBuffer(buffer)).toThrow('Excel file is empty');
    });

    it('should handle Excel file with no worksheets', () => {
      mockXLSX.read.mockReturnValue({ SheetNames: [], Sheets: {} });

      const buffer = Buffer.from('mock excel data');
      
      expect(() => ExcelParser.parseExcelBuffer(buffer)).toThrow('Excel file contains no worksheets');
    });

    it('should handle string length validation', () => {
      const longStrings = [
        validExcelData[0], // Header
        [
          'a'.repeat(60), // Too long product ID (max 50)
          'b'.repeat(600), // Too long product name (max 500)
          100,
          50, 10.5, 30, 15.0, 25, 11.0, 20, 16.0, 15, 12.0, 10, 17.0
        ]
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(longStrings);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'Product Name',
            message: expect.stringContaining('too long')
          })
        ])
      );
    });

    it('should handle unusually large numbers with warnings', () => {
      const largeNumbers = [
        validExcelData[0], // Header
        [
          '0000005', 'Large Product', 1000000, // Very large opening inventory
          50000, 10000,  // Very large quantities/prices
          30, 15.0,
          25, 11.0,
          20, 16.0,
          15, 12.0,
          10, 17.0
        ]
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(largeNumbers);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      // Large numbers generate warnings/errors
      expect(result.totalRows).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => 
        error.message.includes('unusually large')
      )).toBe(true);
    });

    it('should handle special characters in product names', () => {
      const specialChars = [
        validExcelData[0], // Header
        [
          '0000006', 'Café au Lait & Tea 测试', 100,
          50, 10.5, 30, 15.0, 25, 11.0, 20, 16.0, 15, 12.0, 10, 17.0
        ]
      ];

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_json.mockReturnValue(specialChars);

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.parseExcelBuffer(buffer);

      expect(result.validRows).toBe(1);
      expect(result.rows[0]['Product Name']).toBe('Café au Lait & Tea 测试');
    });
  });

  describe('validateFileFormat', () => {
    it('should validate Excel file format successfully', () => {
      mockXLSX.read.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      });

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.validateFileFormat(buffer);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files with no worksheets', () => {
      mockXLSX.read.mockReturnValue({
        SheetNames: [],
        Sheets: {}
      });

      const buffer = Buffer.from('mock excel data');
      const result = ExcelParser.validateFileFormat(buffer);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Excel file contains no worksheets');
    });

    it('should handle corrupted Excel files', () => {
      mockXLSX.read.mockImplementation(() => {
        throw new Error('Invalid file format');
      });

      const buffer = Buffer.from('corrupted data');
      const result = ExcelParser.validateFileFormat(buffer);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Excel file');
    });
  });

  describe('parseStringField', () => {
    it('should handle required string fields', () => {
      // Access private method via any type for testing
      const parser = ExcelParser as any;
      const errors: any[] = [];

      const result = parser.parseStringField('Test Value', 'Test Field', 2, errors, true);
      expect(result).toBe('Test Value');
      expect(errors).toHaveLength(0);
    });

    it('should handle empty required string fields', () => {
      const parser = ExcelParser as any;
      const errors: any[] = [];

      const result = parser.parseStringField('', 'Test Field', 2, errors, true);
      expect(result).toBe('');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('required but is empty');
    });
  });

  describe('parseNumericField', () => {
    it('should parse valid numbers correctly', () => {
      const parser = ExcelParser as any;
      const errors: any[] = [];

      const result = parser.parseNumericField(123.45, 'Test Field', 2, errors, false);
      expect(result).toBe(123.45);
      expect(errors).toHaveLength(0);
    });

    it('should handle null values for optional fields', () => {
      const parser = ExcelParser as any;
      const errors: any[] = [];

      const result = parser.parseNumericField(null, 'Test Field', 2, errors, false);
      expect(result).toBeNull();
      expect(errors).toHaveLength(0);
    });

    it('should handle null values for required fields', () => {
      const parser = ExcelParser as any;
      const errors: any[] = [];

      const result = parser.parseNumericField(null, 'Test Field', 2, errors, true);
      expect(result).toBe(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('is required');
    });
  });
});