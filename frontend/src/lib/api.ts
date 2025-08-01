import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''; // Используем относительные пути для API routes

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Типы для API
export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FAQResponse {
  success: boolean;
  data?: {
    faq: FAQItem[];
    categories: Record<string, string>;
    metadata?: {
      version: string;
      last_updated: string;
      total_questions: number;
      categories_count: number;
    };
  };
  message?: string;
}

export interface Tariff {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  description: string;
  discounts?: {
    annual: number;
    biennial: number;
  };
}

export interface TariffsResponse {
  success: boolean;
  data?: {
    tariffs: Tariff[];
    metadata?: {
      version: string;
      last_updated: string;
      total_tariffs: number;
    };
  };
  message?: string;
}

export interface ApplicationData {
  name: string;
  email: string;
  phone: string;
}

// FAQ API функции
export const getAllFAQ = async (): Promise<FAQResponse> => {
  const response = await api.get('/api/faq/');
  return response.data;
};

export const getFAQByCategory = async (category: string): Promise<FAQResponse> => {
  const response = await api.get(`/api/faq/category/${category}`);
  return response.data;
};

export const searchFAQ = async (query: string): Promise<FAQResponse> => {
  const response = await api.get('/api/faq/search', {
    params: { q: query }
  });
  return response.data;
};

export const getFAQById = async (id: number): Promise<FAQResponse> => {
  const response = await api.get(`/api/faq/${id}`);
  return response.data;
};

export const getPopularFAQ = async (limit: number = 5): Promise<FAQResponse> => {
  const response = await api.get('/api/faq/popular', {
    params: { limit }
  });
  return response.data;
};

export const getRecentFAQ = async (limit: number = 5): Promise<FAQResponse> => {
  const response = await api.get('/api/faq/recent', {
    params: { limit }
  });
  return response.data;
};

export const getFAQByKeyword = async (keyword: string): Promise<FAQResponse> => {
  const response = await api.get(`/api/faq/keyword/${keyword}`);
  return response.data;
};

export const getFAQStats = async (): Promise<Record<string, unknown>> => {
  const response = await api.get('/api/faq/stats');
  return response.data;
};

// Tariffs API функции
export const getTariffs = async (): Promise<TariffsResponse> => {
  const response = await api.get('/api/tariffs/');
  return response.data;
};

export const getTariffById = async (id: string): Promise<TariffsResponse> => {
  const response = await api.get(`/api/tariffs/${id}`);
  return response.data;
};

export const calculatePrice = async (tariffId: string, period: string, quantity: number = 1): Promise<Record<string, unknown>> => {
  const response = await api.get('/api/tariffs/calculate', {
    params: { tariff_id: tariffId, period, quantity }
  });
  return response.data;
};

// Application submission
export const submitApplication = async (data: ApplicationData): Promise<Record<string, unknown>> => {
  const response = await api.post('/api/applications/submit', data);
  return response.data;
};

// Admin API функции (для управления FAQ)
export const addFAQItem = async (faqData: {
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  priority?: number;
}): Promise<FAQItem> => {
  const response = await api.post('/api/faq/admin/add', faqData);
  return response.data;
};

export const updateFAQItem = async (id: number, updateData: {
  question?: string;
  answer?: string;
  keywords?: string[];
  category?: string;
  priority?: number;
}): Promise<FAQItem> => {
  const response = await api.put(`/api/faq/admin/${id}`, updateData);
  return response.data;
};

export const deleteFAQItem = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/api/faq/admin/${id}`);
  return response.data;
};

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Сервер ответил с ошибкой
      const { status, data } = error.response;
      
      switch (status) {
        case 404:
          throw new Error('Данные не найдены');
        case 500:
          throw new Error('Внутренняя ошибка сервера');
        default:
          throw new Error(data?.detail || data?.message || 'Произошла ошибка');
      }
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      throw new Error('Не удалось подключиться к серверу');
    } else {
      // Ошибка при настройке запроса
      throw new Error('Ошибка при отправке запроса');
    }
  }
);

export default api; 