import { Decimal } from '@prisma/client/runtime/library';

export interface RawDailyData {
  daySequence: number;
  procurementQty: number | null;
  procurementPrice: Decimal | null;
  salesQty: number | null;
  salesPrice: Decimal | null;
  inventoryLevel: number | null;
  procurementAmount: Decimal | null;
  salesAmount: Decimal | null;
}

export interface RawProduct {
  id: string;
  productId: string;
  productName: string;
  openingInventory: number;
  dailyData: RawDailyData[];
}

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
}

export interface ProductWithChartData {
  id: string;
  productId: string;
  productName: string;
  openingInventory: number;
  chartData: ChartDataPoint[];
  summary: {
    totalProcurementValue: number;
    totalSalesValue: number;
    finalInventory: number;
    hasNegativeInventory: boolean;
  };
}

export class ChartDataTransformer {
  /**
   * Transform raw product data from database to chart-ready format
   */
  static transformProductsForChart(rawProducts: RawProduct[]): ProductWithChartData[] {
    return rawProducts.map(product => this.transformSingleProduct(product));
  }

  /**
   * Transform a single product with its daily data to chart format
   */
  static transformSingleProduct(product: RawProduct): ProductWithChartData {
    const chartData: ChartDataPoint[] = [];
    let currentInventory = product.openingInventory;

    // Create chart data for each day (1-3)
    for (let day = 1; day <= 3; day++) {
      const dayData = product.dailyData.find(d => d.daySequence === day);

      if (day > 1) {
        // Calculate inventory level for days 2 and 3
        const previousDay = chartData[day - 2];
        if (previousDay && dayData) {
          currentInventory = previousDay.inventoryLevel + 
            (dayData.procurementQty || 0) - 
            (dayData.salesQty || 0);
        } else if (dayData) {
          currentInventory = currentInventory + 
            (dayData.procurementQty || 0) - 
            (dayData.salesQty || 0);
        }
      } else if (dayData) {
        // Day 1: opening inventory + procurement - sales
        currentInventory = currentInventory + 
          (dayData.procurementQty || 0) - 
          (dayData.salesQty || 0);
      }

      chartData.push({
        day: `Day ${day}`,
        daySequence: day,
        inventoryLevel: dayData?.inventoryLevel || currentInventory,
        procurementAmount: dayData?.procurementAmount?.toNumber() || null,
        salesAmount: dayData?.salesAmount?.toNumber() || null,
        procurementQty: dayData?.procurementQty || null,
        procurementPrice: dayData?.procurementPrice?.toNumber() || null,
        salesQty: dayData?.salesQty || null,
        salesPrice: dayData?.salesPrice?.toNumber() || null
      });
    }

    // Calculate summary statistics
    const summary = this.calculateProductSummary(chartData);

    return {
      id: product.id,
      productId: product.productId,
      productName: product.productName,
      openingInventory: product.openingInventory,
      chartData,
      summary
    };
  }

  /**
   * Calculate summary statistics for a product
   */
  static calculateProductSummary(chartData: ChartDataPoint[]) {
    const totalProcurementValue = chartData.reduce((sum, d) => sum + (d.procurementAmount || 0), 0);
    const totalSalesValue = chartData.reduce((sum, d) => sum + (d.salesAmount || 0), 0);
    const finalInventory = chartData.length > 0 ? chartData[chartData.length - 1].inventoryLevel : 0;
    const hasNegativeInventory = chartData.some(d => d.inventoryLevel < 0);

    return {
      totalProcurementValue,
      totalSalesValue,
      finalInventory,
      hasNegativeInventory
    };
  }

  /**
   * Merge chart data from multiple products for comparison view
   */
  static mergeMultipleProductData(
    products: ProductWithChartData[], 
    selectedProductIds: string[]
  ): any[] {
    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
    
    if (selectedProducts.length === 0) {
      return [];
    }

    const mergedData: any[] = [];
    const dayLabels = selectedProducts[0]?.chartData.map(d => d.day) || [];

    dayLabels.forEach((day, dayIndex) => {
      const dataPoint: any = { day };

      selectedProducts.forEach((product, productIndex) => {
        const productData = product.chartData[dayIndex];
        
        if (productData) {
          // Create unique keys for each product
          const productKey = selectedProducts.length === 1 ? '' : `_${product.productId}`;
          
          dataPoint[`inventoryLevel${productKey}`] = productData.inventoryLevel;
          
          if (productData.procurementAmount !== null) {
            dataPoint[`procurementAmount${productKey}`] = productData.procurementAmount;
          }
          
          if (productData.salesAmount !== null) {
            dataPoint[`salesAmount${productKey}`] = productData.salesAmount;
          }

          // Store additional data for tooltip (single product only)
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

    return mergedData;
  }

  /**
   * Calculate inventory level for a specific day with null-safe arithmetic
   */
  static calculateInventoryLevel(
    previousInventory: number,
    procurementQty: number | null,
    salesQty: number | null
  ): number {
    const procurement = procurementQty || 0;
    const sales = salesQty || 0;
    return previousInventory + procurement - sales;
  }

  /**
   * Calculate monetary amount with Decimal precision
   */
  static calculateAmount(qty: number | null, price: Decimal | null): number | null {
    if (qty === null || price === null) {
      return null;
    }
    return qty * price.toNumber();
  }
}