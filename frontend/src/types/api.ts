// API Types based on FastAPI models

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface FAQData {
  faq: FAQItem[];
  categories: Record<string, string>;
}

export interface FAQResponse {
  success: boolean;
  data: FAQData;
}

export interface FAQCategories {
  categories: Record<string, string>;
}

export interface Tariff {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  recommended: boolean;
}

export interface TariffDiscounts {
  quarterly: number;
  yearly: number;
}

export interface TariffsData {
  tariffs: Tariff[];
  discounts: TariffDiscounts;
  trial_period: number;
}

export interface TariffsResponse {
  success: boolean;
  data: TariffsData;
}

export interface ApplicationCreate {
  name: string;
  email: string;
  phone: string;
  selectedTariff: string;
  message?: string;
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
  application_id?: string;
}

export interface FAQCreate {
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  priority: number;
}

export interface FAQUpdate {
  question?: string;
  answer?: string;
  keywords?: string[];
  category?: string;
  priority?: number;
}

export interface FAQStats {
  total_questions: number;
  categories_count: number;
  average_priority: number;
  most_popular_category: string;
} 