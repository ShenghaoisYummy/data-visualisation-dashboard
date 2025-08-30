import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { GET } from '@/app/api/dashboard/products/route';
import { db } from '@/lib/database';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the database
jest.mock('@/lib/database', () => ({
  db: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockHeaders = headers as jest.MockedFunction<typeof headers>;

describe('Dashboard Products API', () => {
  const mockUserId = 'user-123';
  const mockHeadersList = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockResolvedValue(mockHeadersList as any);
    mockHeadersList.get.mockReturnValue(mockUserId);
  });

  const mockProductsData = [
    {
      id: 'product-1',
      productId: '0000001',
      productName: 'Test Product 1',
      openingInventory: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: mockUserId,
      dailyData: [
        {
          daySequence: 1,
          procurementQty: 50,
          procurementPrice: new Decimal('10.00'),
          salesQty: 30,
          salesPrice: new Decimal('15.00'),
          inventoryLevel: 120,
          procurementAmount: new Decimal('500.00'),
          salesAmount: new Decimal('450.00'),
        },
        {
          daySequence: 2,
          procurementQty: null,
          procurementPrice: null,
          salesQty: 25,
          salesPrice: new Decimal('15.00'),
          inventoryLevel: 95,
          procurementAmount: null,
          salesAmount: new Decimal('375.00'),
        },
      ],
    },
    {
      id: 'product-2',
      productId: '0000002',
      productName: 'Test Product 2',
      openingInventory: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: mockUserId,
      dailyData: [
        {
          daySequence: 1,
          procurementQty: 20,
          procurementPrice: new Decimal('5.00'),
          salesQty: 80,
          salesPrice: new Decimal('8.00'),
          inventoryLevel: -10,
          procurementAmount: new Decimal('100.00'),
          salesAmount: new Decimal('640.00'),
        },
      ],
    },
  ];

  describe('GET /api/dashboard/products', () => {
    test('should return products for authenticated user with default pagination', async () => {
      mockDb.product.findMany.mockResolvedValue(mockProductsData);
      mockDb.product.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(2);
      expect(data.pagination).toEqual({
        total: 2,
        limit: 50,
        offset: 0,
        hasNext: false,
        hasPrevious: false,
      });

      // Verify database query with user isolation
      expect(mockDb.product.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: {
          dailyData: {
            where: {},
            orderBy: { daySequence: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    test('should handle pagination parameters correctly', async () => {
      mockDb.product.findMany.mockResolvedValue([mockProductsData[0]]);
      mockDb.product.count.mockResolvedValue(10);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products?limit=1&offset=5');
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination).toEqual({
        total: 10,
        limit: 1,
        offset: 5,
        hasNext: true,
        hasPrevious: true,
      });

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
          skip: 5,
        })
      );
    });

    test('should handle search parameter correctly', async () => {
      mockDb.product.findMany.mockResolvedValue([mockProductsData[0]]);
      mockDb.product.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products?search=Test%20Product%201');
      const response = await GET(request);

      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            OR: [
              { productId: { contains: 'Test Product 1', mode: 'insensitive' } },
              { productName: { contains: 'Test Product 1', mode: 'insensitive' } }
            ]
          }
        })
      );
    });

    test('should transform products with chart data correctly', async () => {
      mockDb.product.findMany.mockResolvedValue([mockProductsData[0]]);
      mockDb.product.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      const product = data.products[0];
      expect(product).toMatchObject({
        id: 'product-1',
        productId: '0000001',
        productName: 'Test Product 1',
        openingInventory: 100,
      });

      expect(product.chartData).toHaveLength(3); // Should always have 3 days
      expect(product.chartData[0]).toMatchObject({
        day: 'Day 1',
        daySequence: 1,
        inventoryLevel: 120,
        procurementAmount: 500,
        salesAmount: 450,
      });

      expect(product.summary).toMatchObject({
        totalProcurementValue: 500,
        totalSalesValue: 825, // 450 + 375
        finalInventory: 95,
        hasNegativeInventory: false,
      });
    });

    test('should detect negative inventory correctly', async () => {
      mockDb.product.findMany.mockResolvedValue([mockProductsData[1]]);
      mockDb.product.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      const product = data.products[0];
      expect(product.summary.hasNegativeInventory).toBe(true);
      expect(product.summary.finalInventory).toBe(-10);
    });

    test('should return 401 when user is not authenticated', async () => {
      mockHeadersList.get.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    test('should handle database errors gracefully', async () => {
      mockDb.product.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch products');
      expect(data.details).toBe('Database connection failed');
    });

    test('should return empty results when user has no products', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    test('should handle products with no daily data', async () => {
      const productWithNoData = {
        ...mockProductsData[0],
        dailyData: [],
      };
      mockDb.product.findMany.mockResolvedValue([productWithNoData]);
      mockDb.product.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      const product = data.products[0];
      expect(product.chartData).toHaveLength(3);
      
      // All days should show opening inventory
      product.chartData.forEach(day => {
        expect(day.inventoryLevel).toBe(100);
        expect(day.procurementAmount).toBeNull();
        expect(day.salesAmount).toBeNull();
      });

      expect(product.summary).toMatchObject({
        totalProcurementValue: 0,
        totalSalesValue: 0,
        finalInventory: 100,
        hasNegativeInventory: false,
      });
    });

    test('should handle invalid pagination parameters', async () => {
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products?limit=invalid&offset=negative');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Should use default values for invalid parameters
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Default limit (invalid converted to 50)
          skip: 0,  // Default offset (invalid converted to 0)
        })
      );
    });
  });

  describe('User Data Isolation', () => {
    test('should only return products for the authenticated user', async () => {
      const otherUserId = 'other-user-456';
      const mixedProducts = [
        { ...mockProductsData[0], userId: mockUserId },
        { ...mockProductsData[1], userId: otherUserId },
      ];

      // Database should only return products for the authenticated user
      mockDb.product.findMany.mockResolvedValue([mixedProducts[0]]);
      mockDb.product.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/dashboard/products');
      const response = await GET(request);
      const data = await response.json();

      // Verify that the where clause includes user isolation
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
        })
      );

      expect(data.products).toHaveLength(1);
      expect(data.products[0].id).toBe('product-1');
    });
  });
});