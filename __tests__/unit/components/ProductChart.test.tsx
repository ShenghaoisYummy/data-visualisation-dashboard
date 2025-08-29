import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductChart, { ProductData, ChartDataPoint } from '@/components/ProductChart';

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name, stroke }: any) => (
    <div data-testid="line" data-key={dataKey} data-name={name} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey, stroke, fontSize, tickLine, axisLine, ...props }: any) => (
    <div data-testid="x-axis" data-key={dataKey} data-stroke={stroke} {...props} />
  ),
  YAxis: ({ stroke, fontSize, tickLine, axisLine, tickFormatter, ...props }: any) => (
    <div data-testid="y-axis" data-stroke={stroke} data-font-size={fontSize} {...props} />
  ),
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip" data-content={content} />,
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="responsive-container" style={{ width, height: `${height}px` }}>
      {children}
    </div>
  ),
  Legend: () => <div data-testid="legend" />
}));

describe('ProductChart', () => {
  const mockChartData: ChartDataPoint[] = [
    {
      day: 'Day 1',
      daySequence: 1,
      inventoryLevel: 120,
      procurementAmount: 500.0,
      salesAmount: 450.0,
      procurementQty: 50,
      procurementPrice: 10.0,
      salesQty: 30,
      salesPrice: 15.0,
    },
    {
      day: 'Day 2',
      daySequence: 2,
      inventoryLevel: 95,
      procurementAmount: null,
      salesAmount: 375.0,
      procurementQty: null,
      procurementPrice: null,
      salesQty: 25,
      salesPrice: 15.0,
    },
    {
      day: 'Day 3',
      daySequence: 3,
      inventoryLevel: 135,
      procurementAmount: 400.0,
      salesAmount: 525.0,
      procurementQty: 40,
      procurementPrice: 10.0,
      salesQty: 35,
      salesPrice: 15.0,
    },
  ];

  const mockProducts: ProductData[] = [
    {
      id: 'product-1',
      productId: '0000001',
      productName: 'Premium Green Tea 500g',
      openingInventory: 100,
      chartData: mockChartData,
      summary: {
        totalProcurementValue: 900.0,
        totalSalesValue: 1350.0,
        finalInventory: 135,
        hasNegativeInventory: false,
      },
    },
    {
      id: 'product-2',
      productId: '0000002',
      productName: 'Organic Rice 2kg',
      openingInventory: 200,
      chartData: [
        {
          day: 'Day 1',
          daySequence: 1,
          inventoryLevel: 170,
          procurementAmount: 300.0,
          salesAmount: 600.0,
          procurementQty: 30,
          procurementPrice: 10.0,
          salesQty: 60,
          salesPrice: 10.0,
        },
        {
          day: 'Day 2',
          daySequence: 2,
          inventoryLevel: 140,
          procurementAmount: null,
          salesAmount: 300.0,
          procurementQty: null,
          procurementPrice: null,
          salesQty: 30,
          salesPrice: 10.0,
        },
        {
          day: 'Day 3',
          daySequence: 3,
          inventoryLevel: 90,
          procurementAmount: 200.0,
          salesAmount: 500.0,
          procurementQty: 20,
          procurementPrice: 10.0,
          salesQty: 50,
          salesPrice: 10.0,
        },
      ],
      summary: {
        totalProcurementValue: 500.0,
        totalSalesValue: 1400.0,
        finalInventory: 90,
        hasNegativeInventory: false,
      },
    },
    {
      id: 'product-3',
      productId: '0000003',
      productName: 'Oversold Product',
      openingInventory: 50,
      chartData: [
        {
          day: 'Day 1',
          daySequence: 1,
          inventoryLevel: -10,
          procurementAmount: 100.0,
          salesAmount: 800.0,
          procurementQty: 20,
          procurementPrice: 5.0,
          salesQty: 80,
          salesPrice: 10.0,
        },
      ],
      summary: {
        totalProcurementValue: 100.0,
        totalSalesValue: 800.0,
        finalInventory: -10,
        hasNegativeInventory: true,
      },
    },
  ];

  describe('Basic Rendering', () => {
    test('should render empty state when no products selected', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[]} />);

      expect(screen.getByText('Select products to view their trends')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    test('should render chart when products are selected', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.queryByText('Select products to view their trends')).not.toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(
        <ProductChart
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('should apply custom height', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} height={600} />);

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ height: '600px' });
    });

    test('should render with default height', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ height: '400px' });
    });
  });

  describe('Single Product Charts', () => {
    test('should render chart for single product with all data types', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      // Should render all three line types by default
      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(3);

      // Check for inventory line
      const inventoryLine = lines.find(line => line.getAttribute('data-key') === 'inventoryLevel');
      expect(inventoryLine).toHaveAttribute('data-name', 'Inventory');
    });

    test('should render only inventory line when other data types disabled', () => {
      render(
        <ProductChart
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          showProcurement={false}
          showSales={false}
        />
      );

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toHaveAttribute('data-key', 'inventoryLevel');
    });

    test('should render only procurement line when only procurement enabled', () => {
      render(
        <ProductChart
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          showInventory={false}
          showSales={false}
        />
      );

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toHaveAttribute('data-key', 'procurementAmount');
    });

    test('should render summary cards for single product', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      expect(screen.getByText('Final Inventory')).toBeInTheDocument();
      expect(screen.getByText('135 units')).toBeInTheDocument();
      expect(screen.getByText('Total Procurement')).toBeInTheDocument();
      expect(screen.getByText('$900.00')).toBeInTheDocument();
      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('$1350.00')).toBeInTheDocument();
      expect(screen.getByText('Inventory Status')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    test('should show oversold status for product with negative inventory', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[2].id]} />);

      expect(screen.getByText('Inventory Status')).toBeInTheDocument();
      expect(screen.getByText('Oversold')).toBeInTheDocument();
      expect(screen.getByText('-10 units')).toBeInTheDocument();
    });

    test('should not render summary cards for product without summary', () => {
      const productWithoutSummary: ProductData = {
        ...mockProducts[0],
        summary: undefined,
      };

      render(<ProductChart products={[productWithoutSummary]} selectedProductIds={[productWithoutSummary.id]} />);

      expect(screen.queryByText('Final Inventory')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Procurement')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Product Charts', () => {
    test('should render chart for multiple products with product-specific keys', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id, mockProducts[1].id]} />);

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(6); // 3 lines × 2 products

      // Check for product-specific keys
      expect(
        lines.some((line) => line.getAttribute('data-key') === 'inventoryLevel_0000001')
      ).toBe(true);
      expect(
        lines.some((line) => line.getAttribute('data-key') === 'inventoryLevel_0000002')
      ).toBe(true);
    });

    test('should render lines with product labels for multiple products', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id, mockProducts[1].id]} />);

      const lines = screen.getAllByTestId('line');
      const inventoryLine = lines.find(line => line.getAttribute('data-key') === 'inventoryLevel_0000001');
      expect(inventoryLine).toHaveAttribute('data-name', 'Inventory (0000001)');
    });

    test('should not render summary cards for multiple products', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id, mockProducts[1].id]} />);

      expect(screen.queryByText('Final Inventory')).not.toBeInTheDocument();
      expect(screen.queryByText('Total Procurement')).not.toBeInTheDocument();
    });

    test('should handle maximum number of products with color cycling', () => {
      const manyProductIds = mockProducts.map(p => p.id);
      render(<ProductChart products={mockProducts} selectedProductIds={manyProductIds} />);

      const lines = screen.getAllByTestId('line');
      expect(lines.length).toBe(9); // 3 lines × 3 products

      // Check that colors are assigned (first product should get the first color)
      const firstInventoryLine = lines.find(line => 
        line.getAttribute('data-key') === 'inventoryLevel_0000001'
      );
      expect(firstInventoryLine).toHaveAttribute('data-stroke', '#3b82f6');
    });
  });

  describe('Chart Data Transformation', () => {
    test('should transform single product data correctly', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      const chart = screen.getByTestId('line-chart');
      const chartDataString = chart.getAttribute('data-chart-data');
      const chartData = JSON.parse(chartDataString || '[]');

      expect(chartData).toHaveLength(3);
      expect(chartData[0]).toMatchObject({
        day: 'Day 1',
        inventoryLevel: 120,
        procurementAmount: 500.0,
        salesAmount: 450.0,
        procurementQty: 50,
        procurementPrice: 10.0,
        salesQty: 30,
        salesPrice: 15.0,
      });

      // Day 2 should have null procurement data
      expect(chartData[1]).toMatchObject({
        day: 'Day 2',
        inventoryLevel: 95,
        salesAmount: 375.0,
        procurementQty: null,
        procurementPrice: null,
        salesQty: 25,
        salesPrice: 15.0,
      });
      expect(chartData[1]).not.toHaveProperty('procurementAmount');
    });

    test('should transform multiple product data correctly', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id, mockProducts[1].id]} />);

      const chart = screen.getByTestId('line-chart');
      const chartDataString = chart.getAttribute('data-chart-data');
      const chartData = JSON.parse(chartDataString || '[]');

      expect(chartData).toHaveLength(3);
      expect(chartData[0]).toMatchObject({
        day: 'Day 1',
        inventoryLevel_0000001: 120,
        inventoryLevel_0000002: 170,
        procurementAmount_0000001: 500.0,
        procurementAmount_0000002: 300.0,
        salesAmount_0000001: 450.0,
        salesAmount_0000002: 600.0,
      });

      // Should not include single-product tooltip data
      expect(chartData[0]).not.toHaveProperty('procurementQty');
      expect(chartData[0]).not.toHaveProperty('salesQty');
    });

    test('should handle products with missing chart data', () => {
      const productWithEmptyData: ProductData = {
        id: 'empty-product',
        productId: '9999999',
        productName: 'Empty Product',
        openingInventory: 50,
        chartData: [],
      };

      render(<ProductChart products={[productWithEmptyData]} selectedProductIds={[productWithEmptyData.id]} />);

      const chart = screen.getByTestId('line-chart');
      const chartDataString = chart.getAttribute('data-chart-data');
      const chartData = JSON.parse(chartDataString || '[]');

      expect(chartData).toHaveLength(0);
    });

    test('should filter out null procurement and sales amounts', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      const chart = screen.getByTestId('line-chart');
      const chartDataString = chart.getAttribute('data-chart-data');
      const chartData = JSON.parse(chartDataString || '[]');

      // Day 2 has null procurement amount, should not be included in data
      expect(chartData[1]).toHaveProperty('salesAmount', 375.0);
      expect(chartData[1]).not.toHaveProperty('procurementAmount');
    });
  });

  describe('Chart Configuration', () => {
    test('should render chart axes correctly', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      expect(screen.getByTestId('x-axis')).toHaveAttribute('data-key', 'day');
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    test('should render chart grid and tooltip', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    test('should handle responsive container sizing', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id]} />);

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveStyle({ width: '100%' });
    });
  });

  describe('Data Filtering and Selection', () => {
    test('should filter products based on selectedProductIds', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[1].id]} />);

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(3);

      // Should render Rice product data, not Tea
      expect(screen.getByText('90 units')).toBeInTheDocument(); // Rice final inventory
      expect(screen.queryByText('135 units')).not.toBeInTheDocument(); // Tea final inventory
    });

    test('should handle non-existent product IDs gracefully', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={['non-existent-id']} />);

      expect(screen.getByText('Select products to view their trends')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    test('should handle empty products array', () => {
      render(<ProductChart products={[]} selectedProductIds={['any-id']} />);

      expect(screen.getByText('Select products to view their trends')).toBeInTheDocument();
    });

    test('should handle products array with only some selected', () => {
      render(<ProductChart products={mockProducts} selectedProductIds={[mockProducts[0].id, mockProducts[2].id]} />);

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(6); // 3 lines × 2 products

      // Should not render summary cards for multiple products
      expect(screen.queryByText('Final Inventory')).not.toBeInTheDocument();
    });
  });

  describe('Chart Display Options', () => {
    test('should respect showInventory=false', () => {
      render(
        <ProductChart
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          showInventory={false}
        />
      );

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(2); // Only procurement and sales lines
      expect(lines.some(line => line.getAttribute('data-key') === 'inventoryLevel')).toBe(false);
    });

    test('should respect showProcurement=false', () => {
      render(
        <ProductChart
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          showProcurement={false}
        />
      );

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(2); // Only inventory and sales lines
      expect(lines.some(line => line.getAttribute('data-key') === 'procurementAmount')).toBe(false);
    });

    test('should respect showSales=false', () => {
      render(
        <ProductChart
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          showSales={false}
        />
      );

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(2); // Only inventory and procurement lines
      expect(lines.some(line => line.getAttribute('data-key') === 'salesAmount')).toBe(false);
    });

    test('should render no lines when all display options are false', () => {
      render(
        <ProductChart
          products={mockProducts}
          selectedProductIds={[mockProducts[0].id]}
          showInventory={false}
          showProcurement={false}
          showSales={false}
        />
      );

      const lines = screen.queryAllByTestId('line');
      expect(lines).toHaveLength(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle products with inconsistent chart data lengths', () => {
      const inconsistentProduct: ProductData = {
        id: 'inconsistent',
        productId: '8888888',
        productName: 'Inconsistent Product',
        openingInventory: 100,
        chartData: [
          {
            day: 'Day 1',
            daySequence: 1,
            inventoryLevel: 100,
            procurementAmount: 200.0,
            salesAmount: 150.0,
            procurementQty: 20,
            procurementPrice: 10.0,
            salesQty: 15,
            salesPrice: 10.0,
          },
          // Missing Day 2 and Day 3
        ],
      };

      render(
        <ProductChart
          products={[inconsistentProduct]}
          selectedProductIds={[inconsistentProduct.id]}
        />
      );

      const chart = screen.getByTestId('line-chart');
      const chartDataString = chart.getAttribute('data-chart-data');
      const chartData = JSON.parse(chartDataString || '[]');

      expect(chartData).toHaveLength(1); // Only Day 1
    });

    test('should handle very large numbers in chart data', () => {
      const largeNumberProduct: ProductData = {
        id: 'large-numbers',
        productId: '7777777',
        productName: 'Large Numbers Product',
        openingInventory: 1000000,
        chartData: [
          {
            day: 'Day 1',
            daySequence: 1,
            inventoryLevel: 1500000,
            procurementAmount: 10000000.0,
            salesAmount: 9000000.0,
            procurementQty: 500000,
            procurementPrice: 20.0,
            salesQty: 450000,
            salesPrice: 20.0,
          },
        ],
        summary: {
          totalProcurementValue: 10000000.0,
          totalSalesValue: 9000000.0,
          finalInventory: 1500000,
          hasNegativeInventory: false,
        },
      };

      render(
        <ProductChart
          products={[largeNumberProduct]}
          selectedProductIds={[largeNumberProduct.id]}
        />
      );

      // Should render without crashing and display formatted numbers
      expect(screen.getByText('1500000 units')).toBeInTheDocument();
      expect(screen.getByText('$10000000.00')).toBeInTheDocument();
    });
  });
});