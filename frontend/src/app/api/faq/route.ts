import { NextRequest, NextResponse } from 'next/server';
import { FAQService } from '@/services/faqService';

const faqService = new FAQService();

export async function GET(_request: NextRequest) {
  try {
    const data = faqService.getAllFAQ();
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('FAQ API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 