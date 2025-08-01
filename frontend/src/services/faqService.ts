import { FAQItem, FAQData, FAQCategories, FAQStats } from '@/types/api';
import faqData from '@/data/faq.json';

export class FAQService {
  private data: {
    faq: FAQItem[];
    categories: Record<string, string>;
    metadata: {
      version: string;
      last_updated: string;
      total_questions: number;
      categories_count: number;
    };
  };

  constructor() {
    this.data = faqData as {
      faq: FAQItem[];
      categories: Record<string, string>;
      metadata: {
        version: string;
        last_updated: string;
        total_questions: number;
        categories_count: number;
      };
    };
  }

  getAllFAQ(): FAQData {
    return {
      faq: this.data.faq,
      categories: this.data.categories
    };
  }

  getCategories(): FAQCategories {
    return {
      categories: this.data.categories
    };
  }

  getFAQByCategory(category: string): FAQItem[] {
    return this.data.faq.filter((item: FAQItem) => item.category === category);
  }

  searchFAQ(query: string): FAQItem[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    return this.data.faq.filter((item: FAQItem) => {
      // Поиск по ключевым словам
      const keywordMatch = item.keywords.some(keyword => 
        keyword.toLowerCase().includes(normalizedQuery)
      );
      
      // Поиск по вопросу
      const questionMatch = item.question.toLowerCase().includes(normalizedQuery);
      
      // Поиск по ответу
      const answerMatch = item.answer.toLowerCase().includes(normalizedQuery);
      
      return keywordMatch || questionMatch || answerMatch;
    });
  }

  getFAQById(id: number): FAQItem | null {
    return this.data.faq.find((item: FAQItem) => item.id === id) || null;
  }

  getPopularQuestions(limit: number = 5): FAQItem[] {
    return this.data.faq
      .sort((a: FAQItem, b: FAQItem) => a.priority - b.priority)
      .slice(0, limit);
  }

  getRecentQuestions(limit: number = 5): FAQItem[] {
    return this.data.faq
      .sort((a: FAQItem, b: FAQItem) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit);
  }

  getQuestionsByKeyword(keyword: string): FAQItem[] {
    const normalizedKeyword = keyword.toLowerCase();
    return this.data.faq.filter((item: FAQItem) => 
      item.keywords.some(k => k.toLowerCase().includes(normalizedKeyword))
    );
  }

  getFAQStats(): FAQStats {
    const totalQuestions = this.data.faq.length;
    const categoriesCount = Object.keys(this.data.categories).length;
    
    const priorities = this.data.faq.map((item: FAQItem) => item.priority);
    const averagePriority = priorities.reduce((a: number, b: number) => a + b, 0) / priorities.length;
    
    // Находим самую популярную категорию
    const categoryCounts: Record<string, number> = {};
    this.data.faq.forEach((item: FAQItem) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    
    const mostPopularCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      total_questions: totalQuestions,
      categories_count: categoriesCount,
      average_priority: Math.round(averagePriority * 100) / 100,
      most_popular_category: mostPopularCategory
    };
  }

  addFAQItem(item: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>): FAQItem {
    const newId = Math.max(...this.data.faq.map((item: FAQItem) => item.id)) + 1;
    const now = new Date().toISOString().split('T')[0];
    
    const newItem: FAQItem = {
      ...item,
      id: newId,
      created_at: now,
      updated_at: now
    };
    
    this.data.faq.push(newItem);
    return newItem;
  }

  updateFAQItem(id: number, updateData: Partial<FAQItem>): FAQItem | null {
    const index = this.data.faq.findIndex((item: FAQItem) => item.id === id);
    if (index === -1) return null;
    
    const now = new Date().toISOString().split('T')[0];
    this.data.faq[index] = {
      ...this.data.faq[index],
      ...updateData,
      updated_at: now
    };
    
    return this.data.faq[index];
  }

  deleteFAQItem(id: number): boolean {
    const index = this.data.faq.findIndex((item: FAQItem) => item.id === id);
    if (index === -1) return false;
    
    this.data.faq.splice(index, 1);
    return true;
  }
} 