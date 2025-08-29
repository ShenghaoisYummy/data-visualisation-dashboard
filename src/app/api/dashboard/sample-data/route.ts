import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createSampleProducts } from '@/lib/sample-data';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from headers (set by middleware)
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('Creating sample data for user:', userId);
    
    // Create sample products
    const result = await createSampleProducts(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Sample data API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create sample data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}