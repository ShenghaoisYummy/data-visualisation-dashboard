'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import ProductChart, { ProductData } from '@/components/ProductChart';
import ProductSelector from '@/components/ProductSelector';
import ConfirmationDialog from '@/components/ConfirmationDialog';
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

interface ImportBatch {
  id: string;
  fileName: string;
  uploadDate: string;
  completedDate: string;
  productsCount: number;
  totalRows: number;
  processingTime: number;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Chart functionality state
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Import batch selection
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [batchesLoading, setBatchesLoading] = useState(true);
  
  // Chart display options
  const [showInventory, setShowInventory] = useState(true);
  const [showProcurement, setShowProcurement] = useState(true);
  const [showSales, setShowSales] = useState(true);
  
  // Delete functionality state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');

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

  const fetchImportBatches = async () => {
    try {
      setBatchesLoading(true);
      
      const response = await fetch('/api/dashboard/import-batches');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setImportBatches(data.batches);
      
      // Auto-select the most recent batch
      if (data.batches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(data.batches[0].id);
      }
      
    } catch (err) {
      console.error('Failed to fetch import batches:', err);
    } finally {
      setBatchesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (selectedBatchId) {
        params.set('batchId', selectedBatchId);
      }
      
      const response = await fetch(`/api/dashboard/products?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setProducts(data.products);
      
      // Auto-select first product if available and no products currently selected
      if (data.products.length > 0 && selectedProductIds.length === 0) {
        setSelectedProductIds([data.products[0].id]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setDeletingBatchId(batchId);
    setDeleteError('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBatchId) return;
    
    try {
      const response = await fetch(`/api/dashboard/import-batches/${deletingBatchId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      await response.json();
      
      // Remove the deleted batch from the list
      setImportBatches(prev => prev.filter(batch => batch.id !== deletingBatchId));
      
      // Handle batch selection after deletion
      if (selectedBatchId === deletingBatchId) {
        // Select the most recent remaining batch, or clear selection
        const remainingBatches = importBatches.filter(batch => batch.id !== deletingBatchId);
        if (remainingBatches.length > 0) {
          setSelectedBatchId(remainingBatches[0].id);
        } else {
          setSelectedBatchId('');
          setProducts([]);
        }
      }
      
      // Close dialog and reset state
      setShowDeleteConfirm(false);
      setDeletingBatchId(null);
      
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingBatchId(null);
    setDeleteError('');
  };

  useEffect(() => {
    fetchImportBatches();
  }, [router]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchProducts();
    } else if (!batchesLoading && importBatches.length === 0) {
      // No batches available, stop loading
      setLoading(false);
      setProducts([]);
    }
  }, [selectedBatchId, batchesLoading, importBatches.length]);

  // Initial fetch when batches are loaded and batch is auto-selected
  useEffect(() => {
    if (importBatches.length > 0 && selectedBatchId && products.length === 0) {
      fetchProducts();
    }
  }, [importBatches, selectedBatchId]);

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
            <div className="flex items-center px-3 py-2 rounded-lg bg-[var(--color-blue-ink)]/20 text-[var(--color-milk)] font-medium">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </div>
            <Link 
              href="/upload"
              className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-[var(--color-midnight)] hover:text-[var(--color-milk)] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Excel
            </Link>
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
              <span className="text-gray-500">Welcome</span>
              <span className="text-[var(--color-blue-ink)] font-medium">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
        <div className="space-y-6">
          {/* Stats Cards Row - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-[var(--color-night)] mt-2">990+</p>
                  <p className="text-sm text-[var(--color-eucalyptus)] mt-1">+4.56% ↑</p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-eucalyptus)]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-eucalyptus)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-[var(--color-night)] mt-2">¥22,370</p>
                  <p className="text-sm text-[var(--color-eucalyptus)] mt-1">+6.45% ↑</p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-blue-ink)]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-blue-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-[var(--color-night)] mt-2">¥10,604</p>
                  <p className="text-sm text-[var(--color-cherry)] mt-1">-0.8% ↓</p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-cherry)]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-cherry)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Procurement</p>
                  <p className="text-2xl font-bold text-[var(--color-night)] mt-2">¥50,839</p>
                  <p className="text-sm text-[var(--color-eucalyptus)] mt-1">+6.65% ↑</p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-midnight)]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-midnight)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section - Always Visible */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-night)]">
                    Product Analytics
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Analyze inventory, procurement, and sales trends across your products
                  </p>
                </div>
              </div>

              {/* Batch Selector */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-[var(--color-night)] mb-3">Upload Date Selection</h3>
                {batchesLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-blue-ink)] mr-2"></div>
                    <span className="text-sm text-gray-600">Loading upload history...</span>
                  </div>
                ) : importBatches.length === 0 ? (
                  <div className="text-sm text-gray-600">
                    No import batches found. Upload an Excel file to start analyzing data.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Upload Batch
                      </label>
                      {selectedBatchId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBatch(selectedBatchId)}
                          className="px-2 py-1 text-xs"
                          title="Delete selected batch and all its data"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </Button>
                      )}
                    </div>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-blue-ink)] focus:border-[var(--color-blue-ink)] sm:text-sm"
                    >
                      {importBatches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.fileName} - {new Date(batch.uploadDate).toLocaleDateString()} {new Date(batch.uploadDate).toLocaleTimeString()} ({batch.productsCount} products)
                        </option>
                      ))}
                    </select>
                    {selectedBatchId && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const batch = importBatches.find(b => b.id === selectedBatchId);
                          return batch ? (
                            <>
                              Uploaded: {new Date(batch.uploadDate).toLocaleString()} • 
                              Products: {batch.productsCount}/{batch.totalRows} • 
                              Processing time: {batch.processingTime}ms
                            </>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-blue-ink)] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                  </div>
                </div>
              ) : error ? (
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
                          onClick={fetchProducts}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[var(--color-night)] mb-2">No Products Available</h3>
                  <p className="text-gray-600 mb-4">
                    Upload an Excel file with your product data to start analyzing trends.
                  </p>
                  <Link href="/upload">
                    <Button variant="primary">
                      Upload Excel File
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-[var(--color-night)] mb-4">Chart Options</h3>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={showInventory}
                            onChange={(e) => setShowInventory(e.target.checked)}
                            className="rounded border-gray-300 text-[var(--color-blue-ink)] focus:ring-[var(--color-blue-ink)]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Inventory Levels</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={showProcurement}
                            onChange={(e) => setShowProcurement(e.target.checked)}
                            className="rounded border-gray-300 text-[var(--color-blue-ink)] focus:ring-[var(--color-blue-ink)]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Procurement Amount</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={showSales}
                            onChange={(e) => setShowSales(e.target.checked)}
                            className="rounded border-gray-300 text-[var(--color-blue-ink)] focus:ring-[var(--color-blue-ink)]"
                          />
                          <span className="ml-2 text-sm text-gray-700">Sales Amount</span>
                        </label>
                      </div>
                    </div>

                    {/* Main Chart */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-[var(--color-night)]">Product Trends</h3>
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
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-[var(--color-night)] mb-4">Selected Products Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {products
                            .filter(p => selectedProductIds.includes(p.id))
                            .map(product => (
                              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-[var(--color-night)] text-sm">{product.productId}</h4>
                                <p className="text-xs text-gray-600 mb-2 truncate">{product.productName}</p>
                                
                                {product.summary && (
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Final Inventory:</span>
                                      <span className={product.summary.hasNegativeInventory ? 'text-[var(--color-cherry)] font-medium' : 'text-[var(--color-night)]'}>
                                        {product.summary.finalInventory} units
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Procurement:</span>
                                      <span className="text-[var(--color-eucalyptus)]">${product.summary.totalProcurementValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Sales:</span>
                                      <span className="text-[var(--color-blue-ink)]">${product.summary.totalSalesValue.toFixed(2)}</span>
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
            </div>
          </div>

        </div>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Upload Batch"
        message="Are you sure you want to delete this upload batch?"
        details={(() => {
          const batch = importBatches.find(b => b.id === deletingBatchId);
          return batch
            ? `This will permanently delete "${batch.fileName}" and all ${batch.productsCount} products with their daily data. This action cannot be undone.`
            : '';
        })()}
        confirmText="Delete Batch"
        cancelText="Cancel"
        variant="destructive"
        loading={false}
      />

      {/* Delete Error Display */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-40">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Delete Failed</p>
              <p className="text-sm text-red-700 mt-1">{deleteError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setDeleteError('')}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}