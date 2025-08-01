import { NextRequest, NextResponse } from 'next/server';
import { FAQService } from '@/services/faqService';

const faqService = new FAQService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Search query cannot be empty' },
        { status: 400 }
      );
    }

    const results = faqService.searchFAQ(query);
    const categories = faqService.getCategories();

    return NextResponse.json({
      success: true,
      data: {
        faq: results,
        categories: categories.categories
      }
    });
  } catch (error) {
    console.error('FAQ Search API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 