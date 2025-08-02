// API Configuration
export const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:8000',
    timeout: 10000,
  },
  // Production
  production: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://valles-bot.ru/api',
    timeout: 15000,
  }
};

// Get current environment
export const getApiConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? API_CONFIG.development : API_CONFIG.production;
};

// API endpoints
export const API_ENDPOINTS = {
  // FAQ
  faq: {
    all: '/api/faq/',
    byId: (id: number) => `/api/faq/${id}`,
    byCategory: (category: string) => `/api/faq/category/${category}`,
    search: '/api/faq/search',
    popular: '/api/faq/popular',
    recent: '/api/faq/recent',
    byKeyword: (keyword: string) => `/api/faq/keyword/${keyword}`,
    stats: '/api/faq/stats',
  },
  // Tariffs
  tariffs: {
    all: '/api/tariffs/',
    byId: (id: string) => `/api/tariffs/${id}`,
    calculate: '/api/tariffs/calculate',
  },
  // Applications
  applications: {
    submit: '/api/applications/submit',
  },
  // Admin
  admin: {
    addFAQ: '/api/faq/admin/add',
    updateFAQ: (id: number) => `/api/faq/admin/${id}`,
    deleteFAQ: (id: number) => `/api/faq/admin/${id}`,
  }
}; 