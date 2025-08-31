import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductChart from '@/components/ProductChart';

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => <div data-testid="line-chart" {...props}>{children}</div>,
  Line: ({ dataKey, stroke, ...props }: any) => <div data-testid={`line-${dataKey}`} data-stroke={stroke} {...props} />,
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children, ...props }: any) => <div data-testid="responsive-container" {...props}>{children}</div>,
}));

const mockChartData = [
  {
    day: 1,
    date: '2024-01-01',
    inventory: 100,
    procurementAmount: 50,
    salesAmount: 30,
  },
  {
    day: 2,
    date: '2024-01-02', 
    inventory: 120,
    procurementAmount: 60,
    salesAmount: 40,
  },
  {
    day: 3,
    date: '2024-01-03',
    inventory: 140,
    procurementAmount: 70,
    salesAmount: 50,
  },
];

const mockMultiProductData = {
  'Product A': mockChartData,
  'Product B': mockChartData.map(d => ({
    ...d,
    inventory: d.inventory * 0.8,
    procurementAmount: d.procurementAmount * 1.2,
    salesAmount: d.salesAmount * 0.9,
  })),
};

describe('ProductChart Component Integration Tests', () => {
  it('should render single product chart correctly', async () => {
    render(
      <ProductChart
        data={mockChartData}
        productName="Test Product"
        isMultiProduct={false}
      />
    );

    // Check chart container
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();

    // Check chart components
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();

    // Check data lines
    expect(screen.getByTestId('line-inventory')).toBeInTheDocument();
    expect(screen.getByTestId('line-procurementAmount')).toBeInTheDocument();
    expect(screen.getByTestId('line-salesAmount')).toBeInTheDocument();

    // Check title
    expect(screen.getByText('Test Product - Trend Analysis')).toBeInTheDocument();
  });

  it('should render multi-product comparison chart', async () => {
    render(
      <ProductChart
        data={mockMultiProductData}
        isMultiProduct={true}
        selectedProducts={['Product A', 'Product B']}
      />
    );

    // Check multi-product title
    expect(screen.getByText('Multi-Product Comparison')).toBeInTheDocument();

    // Should render chart components
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Check that multiple products are represented
    // (This would depend on how your ProductChart component handles multi-product data)
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', async () => {
    render(
      <ProductChart
        data={[]}
        productName="Empty Product"
        isMultiProduct={false}
      />
    );

    // Should show no data message or empty chart
    expect(screen.getByText(/no data available/i) || screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should display correct metrics in chart', async () => {
    render(
      <ProductChart
        data={mockChartData}
        productName="Test Product"
        isMultiProduct={false}
      />
    );

    // Check that chart lines have correct colors/properties
    const inventoryLine = screen.getByTestId('line-inventory');
    const procurementLine = screen.getByTestId('line-procurementAmount');
    const salesLine = screen.getByTestId('line-salesAmount');

    expect(inventoryLine).toHaveAttribute('data-stroke');
    expect(procurementLine).toHaveAttribute('data-stroke');
    expect(salesLine).toHaveAttribute('data-stroke');
  });

  it('should be responsive to container size', async () => {
    render(
      <ProductChart
        data={mockChartData}
        productName="Test Product"
        isMultiProduct={false}
      />
    );

    const responsiveContainer = screen.getByTestId('responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
    
    // ResponsiveContainer should handle sizing automatically
    expect(responsiveContainer).toHaveAttribute('width');
    expect(responsiveContainer).toHaveAttribute('height');
  });

  it('should handle data with null values', async () => {
    const dataWithNulls = [
      {
        day: 1,
        date: '2024-01-01',
        inventory: 100,
        procurementAmount: null,
        salesAmount: 30,
      },
      {
        day: 2,
        date: '2024-01-02',
        inventory: null,
        procurementAmount: 60,
        salesAmount: null,
      },
    ];

    render(
      <ProductChart
        data={dataWithNulls}
        productName="Product with Nulls"
        isMultiProduct={false}
      />
    );

    // Chart should render without crashing
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText('Product with Nulls - Trend Analysis')).toBeInTheDocument();
  });
});