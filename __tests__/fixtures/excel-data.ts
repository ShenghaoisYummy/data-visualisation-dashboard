// Valid Excel data structure
export const validExcelData = [
  {
    'ID': '0000001',
    'Product Name': 'Product A',
    'Opening Inventory': 100,
    'Procurement Qty (Day 1)': 50,
    'Procurement Price (Day 1)': 10.5,
    'Sales Qty (Day 1)': 30,
    'Sales Price (Day 1)': 15.0,
    'Procurement Qty (Day 2)': 25,
    'Procurement Price (Day 2)': 11.0,
    'Sales Qty (Day 2)': 40,
    'Sales Price (Day 2)': 15.5,
    'Procurement Qty (Day 3)': 20,
    'Procurement Price (Day 3)': 11.5,
    'Sales Qty (Day 3)': 35,
    'Sales Price (Day 3)': 16.0
  },
  {
    'ID': '0000002',
    'Product Name': 'Product B',
    'Opening Inventory': 50,
    'Procurement Qty (Day 1)': 30,
    'Procurement Price (Day 1)': 8.0,
    'Sales Qty (Day 1)': 25,
    'Sales Price (Day 1)': 12.0,
    'Procurement Qty (Day 2)': 40,
    'Procurement Price (Day 2)': 8.5,
    'Sales Qty (Day 2)': 35,
    'Sales Price (Day 2)': 12.5,
    'Procurement Qty (Day 3)': 15,
    'Procurement Price (Day 3)': 9.0,
    'Sales Qty (Day 3)': 20,
    'Sales Price (Day 3)': 13.0
  }
];

// Edge case Excel data with null/empty values
export const edgeCaseExcelData = [
  {
    'ID': '0000003',
    'Product Name': 'Product C - Null Procurement Day 1',
    'Opening Inventory': 75,
    'Procurement Qty (Day 1)': null, // Null procurement quantity
    'Procurement Price (Day 1)': 12.0,
    'Sales Qty (Day 1)': 20,
    'Sales Price (Day 1)': 18.0,
    'Procurement Qty (Day 2)': 30,
    'Procurement Price (Day 2)': 12.5,
    'Sales Qty (Day 2)': 25,
    'Sales Price (Day 2)': 18.5,
    'Procurement Qty (Day 3)': 20,
    'Procurement Price (Day 3)': 13.0,
    'Sales Qty (Day 3)': 30,
    'Sales Price (Day 3)': 19.0
  },
  {
    'ID': '0000004',
    'Product Name': 'Product D - Null Sales Day 2',
    'Opening Inventory': 25,
    'Procurement Qty (Day 1)': 50,
    'Procurement Price (Day 1)': 5.5,
    'Sales Qty (Day 1)': 15,
    'Sales Price (Day 1)': 8.0,
    'Procurement Qty (Day 2)': 25,
    'Procurement Price (Day 2)': 6.0,
    'Sales Qty (Day 2)': null, // Null sales quantity
    'Sales Price (Day 2)': 8.5,
    'Procurement Qty (Day 3)': 10,
    'Procurement Price (Day 3)': 6.5,
    'Sales Qty (Day 3)': 40,
    'Sales Price (Day 3)': 9.0
  },
  {
    'ID': '0000005',
    'Product Name': 'CAFÉ AU LAIT 测试', // Special characters and unicode
    'Opening Inventory': 100,
    'Procurement Qty (Day 1)': 20,
    'Procurement Price (Day 1)': 25.99,
    'Sales Qty (Day 1)': 15,
    'Sales Price (Day 1)': 35.0,
    'Procurement Qty (Day 2)': 15,
    'Procurement Price (Day 2)': 26.5,
    'Sales Qty (Day 2)': 18,
    'Sales Price (Day 2)': 36.0,
    'Procurement Qty (Day 3)': null,
    'Procurement Price (Day 3)': null,
    'Sales Qty (Day 3)': 12,
    'Sales Price (Day 3)': 37.0
  },
  {
    'ID': '0000006',
    'Product Name': 'High Value Item',
    'Opening Inventory': 999999, // Large number
    'Procurement Qty (Day 1)': 5000,
    'Procurement Price (Day 1)': 1234.5678, // High precision decimal
    'Sales Qty (Day 1)': 3000,
    'Sales Price (Day 1)': 1850.25,
    'Procurement Qty (Day 2)': 2000,
    'Procurement Price (Day 2)': 1245.99,
    'Sales Qty (Day 2)': 4500,
    'Sales Price (Day 2)': 1875.0,
    'Procurement Qty (Day 3)': 1000,
    'Procurement Price (Day 3)': 1250.0,
    'Sales Qty (Day 3)': 2500,
    'Sales Price (Day 3)': 1900.0
  },
  {
    'ID': '0000007',
    'Product Name': 'Zero Stock Item',
    'Opening Inventory': 0, // Zero starting inventory
    'Procurement Qty (Day 1)': 100,
    'Procurement Price (Day 1)': 10.0,
    'Sales Qty (Day 1)': 150, // Oversold scenario
    'Sales Price (Day 1)': 15.0,
    'Procurement Qty (Day 2)': 200,
    'Procurement Price (Day 2)': 10.5,
    'Sales Qty (Day 2)': 100,
    'Sales Price (Day 2)': 15.5,
    'Procurement Qty (Day 3)': 50,
    'Procurement Price (Day 3)': 11.0,
    'Sales Qty (Day 3)': 75,
    'Sales Price (Day 3)': 16.0
  }
];

// Invalid Excel data that should trigger validation errors
export const invalidExcelData = [
  {
    'ID': '', // Missing product ID
    'Product Name': 'Invalid Product 1',
    'Opening Inventory': 100,
    'Procurement Qty (Day 1)': 50,
    'Procurement Price (Day 1)': 10.0,
    'Sales Qty (Day 1)': 30,
    'Sales Price (Day 1)': 15.0
  },
  {
    'ID': '0000008',
    'Product Name': '', // Missing product name
    'Opening Inventory': 50,
    'Procurement Qty (Day 1)': 25,
    'Procurement Price (Day 1)': 8.0,
    'Sales Qty (Day 1)': 20,
    'Sales Price (Day 1)': 12.0
  },
  {
    'ID': '0000009',
    'Product Name': 'Negative Inventory Product',
    'Opening Inventory': -50, // Negative opening inventory (should be rejected)
    'Procurement Qty (Day 1)': 25,
    'Procurement Price (Day 1)': 8.0,
    'Sales Qty (Day 1)': 20,
    'Sales Price (Day 1)': 12.0
  },
  {
    'ID': '0000010',
    'Product Name': 'Negative Price Product',
    'Opening Inventory': 50,
    'Procurement Qty (Day 1)': 25,
    'Procurement Price (Day 1)': -8.0, // Negative price (should be rejected)
    'Sales Qty (Day 1)': 20,
    'Sales Price (Day 1)': 12.0
  },
  {
    'ID': '0000011',
    'Product Name': 'Negative Quantity Product',
    'Opening Inventory': 50,
    'Procurement Qty (Day 1)': -25, // Negative quantity (should be rejected)
    'Procurement Price (Day 1)': 8.0,
    'Sales Qty (Day 1)': 20,
    'Sales Price (Day 1)': 12.0
  }
];

// Expected calculated results for validExcelData[0] (Product A)
export const expectedCalculatedResults = [
  {
    daySequence: 1,
    inventoryLevel: 120, // 100 + 50 - 30
    procurementAmount: 525.0, // 50 * 10.5
    salesAmount: 450.0 // 30 * 15.0
  },
  {
    daySequence: 2,
    inventoryLevel: 105, // 120 + 25 - 40
    procurementAmount: 275.0, // 25 * 11.0
    salesAmount: 620.0 // 40 * 15.5
  },
  {
    daySequence: 3,
    inventoryLevel: 90, // 105 + 20 - 35
    procurementAmount: 230.0, // 20 * 11.5
    salesAmount: 560.0 // 35 * 16.0
  }
];

// Expected results with null handling for edgeCaseExcelData[0] (Product C)
export const expectedNullHandlingResults = [
  {
    daySequence: 1,
    inventoryLevel: 55, // 75 + 0 - 20 (null procurement treated as 0)
    procurementAmount: null, // null because qty is null
    salesAmount: 360.0 // 20 * 18.0
  },
  {
    daySequence: 2,
    inventoryLevel: 60, // 55 + 30 - 25
    procurementAmount: 375.0, // 30 * 12.5
    salesAmount: 462.5 // 25 * 18.5
  },
  {
    daySequence: 3,
    inventoryLevel: 50, // 60 + 20 - 30
    procurementAmount: 260.0, // 20 * 13.0
    salesAmount: 570.0 // 30 * 19.0
  }
];

// Test file metadata
export const testFileMetadata = {
  fileName: 'test_inventory_data.xlsx',
  fileSize: 15360, // bytes
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

// Invalid file types for testing
export const invalidFileTypes = [
  {
    fileName: 'test_data.txt',
    mimeType: 'text/plain',
    expectedError: 'Invalid file type'
  },
  {
    fileName: 'test_data.pdf',
    mimeType: 'application/pdf',
    expectedError: 'Invalid file type'
  },
  {
    fileName: 'test_data.csv',
    mimeType: 'text/csv',
    expectedError: 'Invalid file type'
  }
];