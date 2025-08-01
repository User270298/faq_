import { NextRequest, NextResponse } from 'next/server';
import { TariffsService } from '@/services/tariffsService';

const tariffsService = new TariffsService();

export async function GET(_request: NextRequest) {
  try {
    const data = tariffsService.getAllTariffs();
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Tariffs API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 