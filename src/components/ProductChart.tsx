'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export interface ChartDataPoint {
  day: string;
  daySequence: number;
  inventoryLevel: number;
  procurementAmount: number | null;
  salesAmount: number | null;
  procurementQty: number | null;
  procurementPrice: number | null;
  salesQty: number | null;
  salesPrice: number | null;
  isOpening?: boolean;
}

export interface ProductData {
  id: string;
  productId: string;
  productName: string;
  openingInventory: number;
  chartData: ChartDataPoint[];
  summary?: {
    totalProcurementValue: number;
    totalSalesValue: number;
    finalInventory: number;
    hasNegativeInventory: boolean;
  };
}

interface ProductChartProps {
  products: ProductData[];
  selectedProductIds: string[];
  showInventory?: boolean;
  showProcurement?: boolean;
  showSales?: boolean;
  height?: number;
  className?: string;
}

// Color palette for multiple products
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#6b7280', // gray-500
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        
        {payload.map((entry: any, index: number) => (
          <div key={index} className="mb-1">
            <p className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}
              {entry.dataKey === 'inventoryLevel' && ' units'}
              {(entry.dataKey === 'procurementAmount' || entry.dataKey === 'salesAmount') && ' $'}
            </p>
          </div>
        ))}
        
        {data && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {data.procurementQty !== null && (
                <>Procurement: {data.procurementQty} units @ ${data.procurementPrice?.toFixed(2) || '0'}<br/></>
              )}
              {data.salesQty !== null && (
                <>Sales: {data.salesQty} units @ ${data.salesPrice?.toFixed(2) || '0'}</>
              )}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default function ProductChart({
  products,
  selectedProductIds,
  showInventory = true,
  showProcurement = true,
  showSales = true,
  height = 400,
  className = ''
}: ProductChartProps) {
  // Filter products based on selection
  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
  
  if (selectedProducts.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">Select products to view their trends</p>
        </div>
      </div>
    );
  }

  // Merge chart data from all selected products
  const mergedData: any[] = [];
  const dayLabels = selectedProducts[0]?.chartData.map(d => d.day) || [];
  
  dayLabels.forEach((day, dayIndex) => {
    const dataPoint: any = { day };
    
    selectedProducts.forEach((product, productIndex) => {
      const productData = product.chartData[dayIndex];
      const colorIndex = productIndex % CHART_COLORS.length;
      
      if (productData) {
        // Create unique keys for each product
        const productKey = selectedProducts.length === 1 ? '' : `_${product.productId}`;
        
        if (showInventory) {
          dataPoint[`inventoryLevel${productKey}`] = productData.inventoryLevel;
        }
        if (showProcurement && productData.procurementAmount !== null) {
          dataPoint[`procurementAmount${productKey}`] = productData.procurementAmount;
        }
        if (showSales && productData.salesAmount !== null) {
          dataPoint[`salesAmount${productKey}`] = productData.salesAmount;
        }
        
        // Store additional data for tooltip
        if (selectedProducts.length === 1) {
          dataPoint.procurementQty = productData.procurementQty;
          dataPoint.procurementPrice = productData.procurementPrice;
          dataPoint.salesQty = productData.salesQty;
          dataPoint.salesPrice = productData.salesPrice;
        }
      }
    });
    
    mergedData.push(dataPoint);
  });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {selectedProducts.map((product, index) => {
            const colorIndex = index % CHART_COLORS.length;
            const color = CHART_COLORS[colorIndex];
            const productKey = selectedProducts.length === 1 ? '' : `_${product.productId}`;
            const productLabel = selectedProducts.length === 1 ? '' : ` (${product.productId})`;
            
            return (
              <React.Fragment key={product.id}>
                {showInventory && (
                  <Line
                    type="monotone"
                    dataKey={`inventoryLevel${productKey}`}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                    name={`Inventory${productLabel}`}
                  />
                )}
                {showProcurement && (
                  <Line
                    type="monotone"
                    dataKey={`procurementAmount${productKey}`}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: color, strokeWidth: 2, r: 3 }}
                    name={`Procurement Amount${productLabel}`}
                  />
                )}
                {showSales && (
                  <Line
                    type="monotone"
                    dataKey={`salesAmount${productKey}`}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="10 5"
                    dot={{ fill: color, strokeWidth: 2, r: 3 }}
                    name={`Sales Amount${productLabel}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Chart Legend/Summary */}
      {selectedProducts.length === 1 && selectedProducts[0].summary && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Final Inventory</p>
            <p className="text-lg font-semibold text-blue-700">
              {selectedProducts[0].summary.finalInventory} units
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-900">Total Procurement</p>
            <p className="text-lg font-semibold text-green-700">
              ${selectedProducts[0].summary.totalProcurementValue.toFixed(2)}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-orange-900">Total Sales</p>
            <p className="text-lg font-semibold text-orange-700">
              ${selectedProducts[0].summary.totalSalesValue.toFixed(2)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${selectedProducts[0].summary.hasNegativeInventory 
            ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${selectedProducts[0].summary.hasNegativeInventory 
              ? 'text-red-900' : 'text-gray-900'}`}>
              Inventory Status
            </p>
            <p className={`text-lg font-semibold ${selectedProducts[0].summary.hasNegativeInventory 
              ? 'text-red-700' : 'text-gray-700'}`}>
              {selectedProducts[0].summary.hasNegativeInventory ? 'Oversold' : 'Normal'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Import React for Fragment usage
import React from 'react';