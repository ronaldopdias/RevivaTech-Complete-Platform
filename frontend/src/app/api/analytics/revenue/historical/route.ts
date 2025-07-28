/**
 * Historical Revenue API
 * Provides historical revenue data for forecasting
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock historical revenue data (last 30 days)
const mockHistoricalRevenue = [
  1200, 1350, 1100, 1500, 1750, 1650, 1400, 1600, 1850, 1700,
  1550, 1800, 1950, 1700, 1600, 1750, 1900, 2100, 1950, 1800,
  2000, 2200, 2050, 1900, 2100, 2300, 2150, 2000, 2200, 2400
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const format = searchParams.get('format') || 'array';

  try {
    let data = mockHistoricalRevenue.slice(-days);

    if (format === 'detailed') {
      data = data.map((revenue, index) => ({
        date: new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue,
        orders: Math.floor(revenue / 150), // Mock orders
        averageOrderValue: revenue / Math.floor(revenue / 150)
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Historical revenue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}