import { NextRequest, NextResponse } from 'next/server';
import { FAQService } from '@/services/faqService';

const faqService = new FAQService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const popularQuestions = faqService.getPopularQuestions(limit);
    
    return NextResponse.json(popularQuestions);
  } catch (error) {
    console.error('FAQ Popular API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 