import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ExcelParser } from '@/lib/excel-parser';
import { DataValidator } from '@/lib/data-validator';
import { InventoryCalculator } from '@/lib/inventory-calculator';
import { ImportBatchManager } from '@/lib/import-batch';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel' // .xls
];

export async function POST(request: NextRequest) {
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
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type', 
          details: `Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
          received: file.type
        },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'File too large', 
          details: `Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          received: `${Math.round(file.size / (1024 * 1024) * 100) / 100}MB`
        },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Validate Excel format
    const formatValidation = ExcelParser.validateFileFormat(buffer);
    if (!formatValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid Excel file',
          details: formatValidation.error
        },
        { status: 400 }
      );
    }
    
    // Parse Excel data
    let parsedData;
    try {
      parsedData = ExcelParser.parseExcelBuffer(buffer);
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to parse Excel file',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
        },
        { status: 400 }
      );
    }
    
    // If parsing found errors, return them
    if (parsedData.errors.length > 0 && parsedData.validRows === 0) {
      return NextResponse.json(
        {
          error: 'Excel file contains errors',
          details: 'No valid rows found in Excel file',
          parseErrors: parsedData.errors,
          summary: {
            totalRows: parsedData.totalRows,
            validRows: parsedData.validRows,
            errorCount: parsedData.errors.length
          }
        },
        { status: 400 }
      );
    }
    
    // Validate data with business rules
    const validationResult = DataValidator.validateExcelData(parsedData.rows);
    
    // Check if validation passed
    if (!DataValidator.isValidationSuccessful(validationResult)) {
      const criticalErrors = DataValidator.getCriticalErrors(validationResult);
      return NextResponse.json(
        {
          error: 'Data validation failed',
          details: `Found ${criticalErrors.length} critical errors`,
          validationErrors: criticalErrors,
          warnings: validationResult.warnings,
          summary: validationResult.summary
        },
        { status: 400 }
      );
    }
    
    // Calculate inventory data
    let calculations;
    try {
      calculations = InventoryCalculator.calculateInventoryData(validationResult.validRows);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Calculation failed',
          details: error instanceof Error ? error.message : 'Unknown calculation error'
        },
        { status: 500 }
      );
    }
    
    // Validate calculations
    const calculationValidation = InventoryCalculator.validateCalculations(calculations);
    if (!calculationValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Calculation validation failed',
          details: 'Mathematical calculations contain errors',
          calculationErrors: calculationValidation.errors,
          warnings: calculationValidation.warnings
        },
        { status: 500 }
      );
    }
    
    // Process import batch
    const importResult = await ImportBatchManager.processImport(
      userId,
      file.name,
      file.size,
      calculations,
      validationResult
    );
    
    if (!importResult.success) {
      return NextResponse.json(
        {
          error: 'Import processing failed',
          details: 'Failed to save data to database',
          importErrors: importResult.errors
        },
        { status: 500 }
      );
    }
    
    // Generate summary statistics
    const calculationSummary = InventoryCalculator.generateSummary(calculations);
    
    // Return success response
    return NextResponse.json({
      success: true,
      batchId: importResult.batchId,
      summary: {
        fileName: file.name,
        fileSize: file.size,
        parsing: {
          totalRows: parsedData.totalRows,
          validRows: parsedData.validRows,
          parseErrors: parsedData.errors.length
        },
        validation: {
          validRows: validationResult.validRows,
          invalidRows: validationResult.invalidRows,
          errors: validationResult.errors.length,
          warnings: validationResult.warnings.length,
          duplicateIds: validationResult.summary.duplicateIds
        },
        calculations: {
          productsProcessed: calculationSummary.productCount,
          totalProcurementValue: calculationSummary.totalProcurementValue.toNumber(),
          totalSalesValue: calculationSummary.totalSalesValue.toNumber(),
          productsWithNegativeInventory: calculationSummary.productsWithNegativeInventory.length
        },
        import: {
          productsCreated: importResult.summary.productsCreated,
          dailyDataCreated: importResult.summary.dailyDataCreated,
          duplicateProducts: importResult.summary.duplicateProducts,
          processingTimeMs: importResult.summary.processingTimeMs
        }
      },
      // Include warnings for user awareness
      warnings: validationResult.warnings.length > 0 ? validationResult.warnings : undefined,
      calculationWarnings: calculationValidation.warnings.length > 0 ? calculationValidation.warnings : undefined
    });
    
  } catch (error) {
    console.error('Upload API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown server error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for upload history
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeStats = searchParams.get('stats') === 'true';
    
    // Get import history
    const history = await ImportBatchManager.getImportHistory(userId, limit);
    
    let statistics = undefined;
    if (includeStats) {
      statistics = await ImportBatchManager.getImportStatistics(userId);
    }
    
    return NextResponse.json({
      history,
      statistics
    });
    
  } catch (error) {
    console.error('Upload history API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch upload history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}