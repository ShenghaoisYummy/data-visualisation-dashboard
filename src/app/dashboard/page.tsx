'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
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
          {/* Welcome Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to the Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              This is Phase 1 of the Data Visualization Dashboard. The Excel import and charting features will be available in Phase 2.
            </p>
            
            {/* Phase 1 Status */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Phase 1 Complete ✓
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Staff-only registration with invitation codes</li>
                      <li>JWT-based authentication with user status management</li>
                      <li>Protected routes and middleware</li>
                      <li>Admin interface for invitation code management</li>
                      <li>Database schema with audit trails</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Coming in Phase 2
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Excel Import</h4>
                <p className="text-sm text-gray-600">
                  Upload and process Excel files with 990+ products and 3-day data
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Data Visualization</h4>
                <p className="text-sm text-gray-600">
                  Interactive line charts showing inventory, procurement, and sales trends
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Multi-Product Comparison</h4>
                <p className="text-sm text-gray-600">
                  Compare trends across multiple products simultaneously
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="flex space-x-4">
              <Link href="/admin">
                <Button variant="primary">
                  Manage Invitation Codes
                </Button>
              </Link>
              <Button variant="outline" disabled>
                Upload Excel File (Phase 2)
              </Button>
              <Button variant="outline" disabled>
                View Charts (Phase 2)
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}