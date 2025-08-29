'use client';

import { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';

export interface UploadResult {
  success: boolean;
  batchId?: string;
  summary?: any;
  error?: string;
  warnings?: any[];
  calculationWarnings?: any[];
}

export interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface UploadProgress {
  stage: 'uploading' | 'parsing' | 'validating' | 'calculating' | 'saving' | 'completed' | 'failed';
  message: string;
  progress: number;
}

export default function FileUpload({
  onUploadComplete,
  onUploadStart,
  disabled = false,
  className
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isUploading = uploadProgress !== null && uploadProgress.stage !== 'completed' && uploadProgress.stage !== 'failed';
  
  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled || isUploading) return;
    
    // Reset previous results
    setUploadResult(null);
    setUploadProgress({
      stage: 'uploading',
      message: 'Uploading file...',
      progress: 0
    });
    
    onUploadStart?.();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      setUploadProgress({
        stage: response.ok ? 'completed' : 'failed',
        message: response.ok ? 'Upload completed successfully!' : 'Upload failed',
        progress: response.ok ? 100 : 0
      });
      
      const uploadResult: UploadResult = {
        success: response.ok,
        batchId: result.batchId,
        summary: result.summary,
        error: result.error,
        warnings: result.warnings,
        calculationWarnings: result.calculationWarnings
      };
      
      setUploadResult(uploadResult);
      onUploadComplete?.(uploadResult);
      
    } catch (error) {
      const failedResult: UploadResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setUploadProgress({
        stage: 'failed',
        message: 'Upload failed',
        progress: 0
      });
      
      setUploadResult(failedResult);
      onUploadComplete?.(failedResult);
    }
  }, [disabled, isUploading, onUploadComplete, onUploadStart]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    );
    
    if (excelFile) {
      handleFileSelect(excelFile);
    }
  }, [handleFileSelect]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);
  
  const resetUpload = useCallback(() => {
    setUploadProgress(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  return (
    <div className={clsx('w-full max-w-2xl mx-auto', className)}>
      {/* File Drop Zone */}
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          {
            'border-[var(--color-blue-ink)] bg-[var(--color-blue-ink)]/5': isDragOver && !disabled,
            'border-gray-300 hover:border-[var(--color-blue-ink)]': !isDragOver && !disabled && !isUploading,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled || isUploading,
            'border-[var(--color-eucalyptus)] bg-[var(--color-eucalyptus)]/5': uploadResult?.success,
            'border-[var(--color-cherry)] bg-[var(--color-cherry)]/5': uploadResult && !uploadResult.success
          }
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-blue-ink)] mx-auto"></div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {uploadProgress?.message}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[var(--color-blue-ink)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress?.progress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : uploadResult ? (
          <div className="space-y-4">
            {uploadResult.success ? (
              <>
                <div className="text-[var(--color-eucalyptus)]">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Upload Successful!</h3>
                  {uploadResult.summary && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Products created: {uploadResult.summary.import?.productsCreated || 0}</p>
                      <p>Processing time: {uploadResult.summary.import?.processingTimeMs || 0}ms</p>
                      {uploadResult.summary.calculations && (
                        <p>Total value: ${(uploadResult.summary.calculations.totalSalesValue || 0).toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-[var(--color-cherry)]">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Upload Failed</h3>
                  <p className="mt-1 text-sm text-[var(--color-cherry)]">{uploadResult.error}</p>
                </div>
              </>
            )}
            
            <button
              onClick={resetUpload}
              className="text-[var(--color-blue-ink)] hover:text-[var(--color-blue-ink)]/80 text-sm font-medium"
            >
              Upload Another File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-medium text-gray-700">
                Drop your Excel file here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse files
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports .xlsx and .xls files up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Warnings Display */}
      {uploadResult?.warnings && uploadResult.warnings.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Warnings ({uploadResult.warnings.length})
          </h4>
          <div className="space-y-1">
            {uploadResult.warnings.slice(0, 5).map((warning, index) => (
              <p key={index} className="text-xs text-yellow-700">
                Row {warning.row}: {warning.message}
              </p>
            ))}
            {uploadResult.warnings.length > 5 && (
              <p className="text-xs text-yellow-600 italic">
                ...and {uploadResult.warnings.length - 5} more warnings
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Calculation Warnings Display */}
      {uploadResult?.calculationWarnings && uploadResult.calculationWarnings.length > 0 && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            Calculation Warnings ({uploadResult.calculationWarnings.length})
          </h4>
          <div className="space-y-1">
            {uploadResult.calculationWarnings.slice(0, 3).map((warning, index) => (
              <p key={index} className="text-xs text-orange-700">
                Product {warning.productId}: {warning.message}
              </p>
            ))}
            {uploadResult.calculationWarnings.length > 3 && (
              <p className="text-xs text-orange-600 italic">
                ...and {uploadResult.calculationWarnings.length - 3} more calculation warnings
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* File Format Help */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Expected Excel Format</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Required columns: ID, Product Name, Opening Inventory</p>
          <p>• Daily data columns: Procurement Qty/Price (Day 1-3), Sales Qty/Price (Day 1-3)</p>
          <p>• Empty cells are treated as null values (not zero)</p>
          <p>• Negative quantities and prices are not allowed</p>
          <p>• Duplicate Product IDs will be skipped</p>
        </div>
      </div>
    </div>
  );
}