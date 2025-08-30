'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import FileUpload, { type UploadResult } from '@/components/FileUpload';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

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
      console.log('Upload successful:', result);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[var(--color-night)] text-[var(--color-milk)] flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[var(--color-blue-ink)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </div>

        {/* Quick Access Menu */}
        <div className="px-6 mb-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Quick Access</h2>
          <nav className="space-y-2">
            <Link 
              href="/dashboard"
              className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-[var(--color-midnight)] hover:text-[var(--color-milk)] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </Link>
            <div className="flex items-center px-3 py-2 rounded-lg bg-[var(--color-blue-ink)]/20 text-[var(--color-milk)] font-medium">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Excel
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-[var(--color-midnight)] hover:text-[var(--color-milk)] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Charts
            </button>
          </nav>
        </div>

        {/* Service Menu */}
        <div className="px-6 mb-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Service</h2>
          <nav className="space-y-2">
            <Link 
              href="/admin"
              className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-[var(--color-midnight)] hover:text-[var(--color-milk)] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Panel
            </Link>
          </nav>
        </div>

        {/* Account Section */}
        <div className="px-6 mt-auto mb-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Account</h2>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-[var(--color-cherry)] hover:text-[var(--color-milk)] transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-[var(--background)]">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Excel Data</span>
              <span className="text-[var(--color-blue-ink)] font-medium">Upload</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Upload Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--color-night)] mb-2">Excel Data Import</h1>
              <p className="text-gray-600">
                Upload your Excel file with inventory, procurement, and sales data for analysis. 
                The system supports files with 990+ products across multiple days of data.
              </p>
            </div>

            {/* Upload Instructions */}
            <div className="bg-[var(--color-blue-ink)]/5 border border-[var(--color-blue-ink)]/20 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-night)] mb-3">File Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">File Format</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Excel files (.xlsx, .xls)</li>
                    <li>• UTF-8 encoding recommended</li>
                    <li>• Maximum file size: 50MB</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Data Structure</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Product ID and Name columns</li>
                    <li>• Opening Inventory column</li>
                    <li>• Daily data for 3 days (Qty, Price)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
              <FileUpload 
                onUploadComplete={handleUploadComplete}
                onUploadStart={() => setUploadResult(null)}
              />

              {/* Upload Result */}
              {uploadResult?.success && (
                <div className="mt-6 bg-[var(--color-eucalyptus)]/10 border border-[var(--color-eucalyptus)]/20 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-[var(--color-eucalyptus)]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[var(--color-eucalyptus)]">
                        Import Successful ✓
                      </h3>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Products created: {uploadResult.summary?.import?.productsCreated || 0}</p>
                        <p>Processing time: {uploadResult.summary?.import?.processingTimeMs || 0}ms</p>
                        <p>Batch ID: {uploadResult.batchId}</p>
                      </div>
                      <div className="mt-4">
                        <Link href="/dashboard">
                          <Button variant="primary" size="sm">
                            View Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {uploadResult && !uploadResult.success && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Upload Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{uploadResult.error || 'An error occurred during upload.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[var(--color-night)] mb-3">Need Help?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Common Issues</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Check column headers match expected format</li>
                    <li>• Ensure numeric data is properly formatted</li>
                    <li>• Remove any merged cells or formatting</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Sample Data</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Download a sample Excel template to see the expected format.
                  </p>
                  <Button variant="outline" size="sm">
                    Download Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}