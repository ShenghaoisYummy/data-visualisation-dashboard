'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import FileUpload, { type UploadResult } from '@/components/FileUpload';
import Link from 'next/link';

export default function DashboardPage() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    if (result.success) {
      // Could refresh product list or show success message
      console.log('Upload successful:', result);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Data Visualization Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Excel Upload Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Excel Data Import
                </h2>
                <p className="text-gray-600 mt-1">
                  Upload your Excel file with inventory, procurement, and sales data (990+ products supported)
                </p>
              </div>
              {!showUpload && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowUpload(true)}
                >
                  Upload Excel File
                </Button>
              )}
            </div>

            {showUpload && (
              <div className="space-y-4">
                <FileUpload 
                  onUploadComplete={handleUploadComplete}
                  onUploadStart={() => setUploadResult(null)}
                />
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowUpload(false)}
                  >
                    Hide Upload
                  </Button>
                </div>
              </div>
            )}

            {uploadResult?.success && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Import Successful ✓
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Products created: {uploadResult.summary?.import?.productsCreated || 0}</p>
                      <p>Processing time: {uploadResult.summary?.import?.processingTimeMs || 0}ms</p>
                      <p>Batch ID: {uploadResult.batchId}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Project Status
            </h3>
            <div className="space-y-4">
              {/* Phase 1 Status */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      Phase 1: Authentication System ✓
                    </h4>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Staff-only registration with invitation codes</li>
                        <li>JWT-based authentication with user status management</li>
                        <li>Protected routes and middleware</li>
                        <li>Admin interface for invitation code management</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2 Status */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      Phase 2: Excel Import System ✓
                    </h4>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Excel parsing with SheetJS library</li>
                        <li>Null-safe data validation and business rules</li>
                        <li>Inventory calculations with Decimal precision</li>
                        <li>Database import batch operations</li>
                        <li>Comprehensive error handling and reporting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming in Phase 3 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Coming in Phase 3
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📊 Data Visualization</h4>
                <p className="text-sm text-gray-600">
                  Interactive line charts showing inventory, procurement, and sales trends over 3 days
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🔍 Multi-Product Comparison</h4>
                <p className="text-sm text-gray-600">
                  Compare trends across multiple products simultaneously with Recharts
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin">
                <Button variant="primary">
                  Manage Invitation Codes
                </Button>
              </Link>
              <Button 
                variant="primary"
                onClick={() => setShowUpload(true)}
              >
                Upload Excel File
              </Button>
              <Button variant="outline" disabled>
                View Charts (Phase 3)
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}