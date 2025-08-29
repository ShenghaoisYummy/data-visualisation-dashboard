'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductChart, { ProductData } from '@/components/ProductChart';
import ProductSelector from '@/components/ProductSelector';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ApiResponse {
  products: ProductData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export default function ChartsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Chart display options
  const [showInventory, setShowInventory] = useState(true);
  const [showProcurement, setShowProcurement] = useState(true);
  const [showSales, setShowSales] = useState(true);

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/dashboard/products?limit=50');
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        setProducts(data.products);
        
        // Auto-select first product if available
        if (data.products.length > 0 && selectedProductIds.length === 0) {
          setSelectedProductIds([data.products[0].id]);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  if (loading) {
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
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Loading State */}
        <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
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
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/admin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Error State */}
        <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load products
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Product Analytics</h2>
          <p className="mt-2 text-gray-600">
            Analyze inventory, procurement, and sales trends across your products
          </p>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-600 mb-4">
              Upload an Excel file with your product data to start analyzing trends.
            </p>
            <Link href="/dashboard">
              <Button variant="primary">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Product Selection Panel */}
            <div className="lg:col-span-1">
              <ProductSelector
                products={products}
                selectedProductIds={selectedProductIds}
                onSelectionChange={setSelectedProductIds}
                maxSelections={5}
                className="sticky top-8"
              />
            </div>

            {/* Chart Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Chart Controls */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Chart Options</h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showInventory}
                      onChange={(e) => setShowInventory(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inventory Levels</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showProcurement}
                      onChange={(e) => setShowProcurement(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Procurement Amount</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showSales}
                      onChange={(e) => setShowSales(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sales Amount</span>
                  </label>
                </div>
              </div>

              {/* Main Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Product Trends</h3>
                  <p className="text-sm text-gray-600">
                    {selectedProductIds.length === 0 
                      ? 'Select products to view their trends'
                      : `Showing ${selectedProductIds.length} product${selectedProductIds.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                
                <ProductChart
                  products={products}
                  selectedProductIds={selectedProductIds}
                  showInventory={showInventory}
                  showProcurement={showProcurement}
                  showSales={showSales}
                  height={500}
                />
              </div>

              {/* Product Summary Cards */}
              {selectedProductIds.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Products Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products
                      .filter(p => selectedProductIds.includes(p.id))
                      .map(product => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 text-sm">{product.productId}</h4>
                          <p className="text-xs text-gray-600 mb-2 truncate">{product.productName}</p>
                          
                          {product.summary && (
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Final Inventory:</span>
                                <span className={product.summary.hasNegativeInventory ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                  {product.summary.finalInventory} units
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Procurement:</span>
                                <span className="text-green-600">${product.summary.totalProcurementValue.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Sales:</span>
                                <span className="text-blue-600">${product.summary.totalSalesValue.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}