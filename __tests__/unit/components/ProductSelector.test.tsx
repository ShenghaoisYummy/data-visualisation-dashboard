import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductSelector from '@/components/ProductSelector';
import { ProductData } from '@/components/ProductChart';

describe('ProductSelector', () => {
  const mockOnSelectionChange = jest.fn();

  const mockProducts: ProductData[] = [
    {
      id: 'product-1',
      productId: '0000001',
      productName: 'Premium Green Tea 500g',
      openingInventory: 100,
      chartData: [],
      summary: {
        totalProcurementValue: 1000,
        totalSalesValue: 800,
        finalInventory: 120,
        hasNegativeInventory: false,
      },
    },
    {
      id: 'product-2',
      productId: '0000002',
      productName: 'Organic Rice 2kg',
      openingInventory: 200,
      chartData: [],
      summary: {
        totalProcurementValue: 800,
        totalSalesValue: 600,
        finalInventory: 150,
        hasNegativeInventory: false,
      },
    },
    {
      id: 'product-3',
      productId: '0000003',
      productName: 'Fresh Soy Sauce 1L',
      openingInventory: 75,
      chartData: [],
      summary: {
        totalProcurementValue: 500,
        totalSalesValue: 700,
        finalInventory: -10,
        hasNegativeInventory: true,
      },
    },
    {
      id: 'product-4',
      productId: '0000004',
      productName: 'Frozen Dumplings 500g',
      openingInventory: 50,
      chartData: [],
      summary: {
        totalProcurementValue: 300,
        totalSalesValue: 400,
        finalInventory: 25,
        hasNegativeInventory: false,
      },
    },
    {
      id: 'product-5',
      productId: '0000005',
      productName: 'Instant Ramen Pack (24pc)',
      openingInventory: 120,
      chartData: [],
      summary: {
        totalProcurementValue: 600,
        totalSalesValue: 720,
        finalInventory: 80,
        hasNegativeInventory: false,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render product selector with products', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('Product Selection')).toBeInTheDocument();
      expect(screen.getByText('0 of 5 selected')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search products by ID or name...')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();

      // Check if all products are rendered
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.productId)).toBeInTheDocument();
        expect(screen.getByText(product.productName)).toBeInTheDocument();
      });
    });

    test('should render empty state when no products provided', () => {
      render(
        <ProductSelector
          products={[]}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('No products available')).toBeInTheDocument();
      expect(screen.getByText('Upload an Excel file to see products here')).toBeInTheDocument();
    });

    test('should render without search when showSearch is false', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
          showSearch={false}
        />
      );

      expect(screen.queryByPlaceholderText('Search products by ID or name...')).not.toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Product Selection Logic', () => {
    test('should select product when clicked', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const firstProduct = screen.getByText(mockProducts[0].productName);
      fireEvent.click(firstProduct.closest('.cursor-pointer')!);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([mockProducts[0].id]);
    });

    test('should deselect product when already selected', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id, mockProducts[1].id]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const firstProduct = screen.getByText(mockProducts[0].productName);
      fireEvent.click(firstProduct.closest('.cursor-pointer')!);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([mockProducts[1].id]);
    });

    test('should respect maxSelections limit', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={['product-1', 'product-2']}
          onSelectionChange={mockOnSelectionChange}
          maxSelections={2}
        />
      );

      expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();

      // Try to select a third product - should not work
      const thirdProduct = screen.getByText(mockProducts[2].productName);
      const productDiv = thirdProduct.closest('.cursor-pointer')!;
      
      // Should be disabled
      expect(productDiv).toHaveClass('cursor-not-allowed');
      expect(productDiv).toHaveClass('opacity-50');

      fireEvent.click(productDiv);
      expect(mockOnSelectionChange).not.toHaveBeenCalled();
    });

    test('should show selected products with proper styling', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const selectedProduct = screen.getByText(mockProducts[0].productName).closest('.cursor-pointer')!;
      expect(selectedProduct).toHaveClass('bg-blue-50');
      expect(selectedProduct).toHaveClass('border-blue-500');

      // Check that the checkbox is checked
      const checkbox = selectedProduct.querySelector('.bg-blue-500');
      expect(checkbox).toBeInTheDocument();
    });

    test('should display negative inventory warning', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Product with negative inventory should show "Oversold" warning
      expect(screen.getByText('Oversold')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('should filter products by product ID', async () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      fireEvent.change(searchInput, { target: { value: '0000001' } });

      await waitFor(() => {
        expect(screen.getByText('Premium Green Tea 500g')).toBeInTheDocument();
        expect(screen.queryByText('Organic Rice 2kg')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/1.*of.*5.*shown/)).toBeInTheDocument();
    });

    test('should filter products by product name (case insensitive)', async () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      fireEvent.change(searchInput, { target: { value: 'rice' } });

      await waitFor(() => {
        expect(screen.getByText('Organic Rice 2kg')).toBeInTheDocument();
        expect(screen.queryByText('Premium Green Tea 500g')).not.toBeInTheDocument();
      });
    });

    test('should show no results message when search has no matches', async () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No products match your search')).toBeInTheDocument();
      });
    });

    test('should clear search and show all products when input is empty', async () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      
      // First filter
      fireEvent.change(searchInput, { target: { value: 'rice' } });
      await waitFor(() => {
        expect(screen.getByText(/1.*of.*5.*shown/)).toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.queryByText(/of.*5.*shown/)).not.toBeInTheDocument();
        expect(screen.getByText(/0.*of.*5.*selected/)).toBeInTheDocument();
      });
    });
  });

  describe('Select All and Clear All', () => {
    test('should select all visible products up to maxSelections limit', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
          maxSelections={3}
        />
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([
        mockProducts[0].id,
        mockProducts[1].id,
        mockProducts[2].id,
      ]);
    });

    test('should select all filtered products when search is active', async () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
          maxSelections={3}
        />
      );

      // Filter products first
      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      fireEvent.change(searchInput, { target: { value: 'rice' } });

      await waitFor(() => {
        expect(screen.getByText(/1.*of.*5.*shown/)).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([mockProducts[1].id]); // Only rice product
    });

    test('should clear all selected products', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id, mockProducts[1].id]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    test('should disable Select All when no filtered products', async () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        const selectAllButton = screen.getByText('Select All');
        expect(selectAllButton).toBeDisabled();
      });
    });

    test('should disable Clear All when no products selected', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const clearAllButton = screen.getByText('Clear All');
      expect(clearAllButton).toBeDisabled();
    });
  });

  describe('Product Information Display', () => {
    test('should display opening inventory for each product', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      mockProducts.forEach((product) => {
        expect(screen.getByText(`${product.openingInventory} units`)).toBeInTheDocument();
      });
    });

    test('should display oversold indicator for products with negative inventory', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Only product-3 has negative inventory
      expect(screen.getAllByText('Oversold')).toHaveLength(1);
    });

    test('should handle products without summary data', () => {
      const productsWithoutSummary: ProductData[] = [
        {
          id: 'product-no-summary',
          productId: '9999999',
          productName: 'Product Without Summary',
          openingInventory: 50,
          chartData: [],
        },
      ];

      render(
        <ProductSelector
          products={productsWithoutSummary}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('Product Without Summary')).toBeInTheDocument();
      expect(screen.queryByText('Oversold')).not.toBeInTheDocument();
      expect(screen.queryByText('50 units')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle maxSelections of 0', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
          maxSelections={0}
        />
      );

      expect(screen.getByText('0 of 0 selected')).toBeInTheDocument();

      // All products should be disabled
      mockProducts.forEach((product) => {
        const productDiv = screen.getByText(product.productName).closest('.cursor-pointer')!;
        expect(productDiv).toHaveClass('cursor-not-allowed');
      });
    });

    test('should handle very large maxSelections', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
          maxSelections={1000}
        />
      );

      expect(screen.getByText('0 of 1000 selected')).toBeInTheDocument();

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      // Should select all available products
      expect(mockOnSelectionChange).toHaveBeenCalledWith([
        'product-1',
        'product-2',
        'product-3',
        'product-4',
        'product-5',
      ]);
    });

    test('should handle selectedProductIds that don\'t exist in products array', () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={['non-existent-1', 'non-existent-2', mockProducts[0].id]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Should still show the count including non-existent IDs
      expect(screen.getByText('3 of 5 selected')).toBeInTheDocument();

      // Only the existing product should be visually selected
      const existingProduct = screen.getByText(mockProducts[0].productName).closest('.cursor-pointer')!;
      expect(existingProduct).toHaveClass('bg-blue-50');
    });
  });

  describe('Accessibility and UX', () => {
    test('should maintain focus and keyboard navigation', () => {
      render(
        <ProductSelector
          products={mockProducts.slice(0, 2)}
          selectedProductIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      
      // Focus should work on search input
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });

    test('should show proper selection count with filtered results', async () => {
      render(
        <ProductSelector
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id, mockProducts[1].id]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Initial state
      expect(screen.getByText('2 of 5 selected')).toBeInTheDocument();

      // Filter results
      const searchInput = screen.getByPlaceholderText('Search products by ID or name...');
      fireEvent.change(searchInput, { target: { value: 'tea' } });

      await waitFor(() => {
        // Should show both selection count and filtered count
        expect(screen.getByText(/2.*of.*5.*selected/)).toBeInTheDocument();
        expect(screen.getByText(/1.*of.*5.*shown/)).toBeInTheDocument();
      });
    });
  });
});