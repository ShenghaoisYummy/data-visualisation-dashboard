'use client';

import { useState, useMemo } from 'react';
import { ProductData } from './ProductChart';

interface ProductSelectorProps {
  products: ProductData[];
  selectedProductIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  maxSelections?: number;
  showSearch?: boolean;
  className?: string;
}

export default function ProductSelector({
  products,
  selectedProductIds,
  onSelectionChange,
  maxSelections = 5,
  showSearch = true,
  className = ''
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(
      product =>
        product.productId.toLowerCase().includes(term) ||
        product.productName.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleProductToggle = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      // Remove from selection
      onSelectionChange(selectedProductIds.filter(id => id !== productId));
    } else {
      // Add to selection (if under limit)
      if (selectedProductIds.length < maxSelections) {
        onSelectionChange([...selectedProductIds, productId]);
      }
    }
  };

  const handleSelectAll = () => {
    const visibleProductIds = filteredProducts.slice(0, maxSelections).map(p => p.id);
    onSelectionChange(visibleProductIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  if (products.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">No products available</p>
          <p className="text-gray-500 text-xs mt-1">Upload an Excel file to see products here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Selection</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              disabled={filteredProducts.length === 0}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleClearAll}
              disabled={selectedProductIds.length === 0}
              className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>
        </div>
        
        {showSearch && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products by ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        )}
        
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <span>
            {selectedProductIds.length} of {maxSelections} selected
          </span>
          {filteredProducts.length < products.length && (
            <span className="ml-2">
              • {filteredProducts.length} of {products.length} shown
            </span>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">No products match your search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((product) => {
              const isSelected = selectedProductIds.includes(product.id);
              const isDisabled = !isSelected && selectedProductIds.length >= maxSelections;
              
              return (
                <div
                  key={product.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 border-r-2 border-blue-500' 
                      : isDisabled
                        ? 'bg-gray-50 cursor-not-allowed opacity-50'
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !isDisabled && handleProductToggle(product.id)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.productId}
                          </p>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {product.productName}
                          </p>
                        </div>
                        
                        {product.summary && (
                          <div className="flex-shrink-0 ml-4">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Opening</p>
                              <p className="text-sm font-medium text-gray-900">
                                {product.openingInventory} units
                              </p>
                            </div>
                            {product.summary.hasNegativeInventory && (
                              <div className="flex items-center mt-1">
                                <svg className="w-3 h-3 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" 
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                                    clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-red-600 font-medium">Oversold</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}