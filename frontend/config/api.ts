// API Configuration
export const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:8000',
    timeout: 10000,
  },
  // Production - используем VPS сервер с SSL сертификатом
  production: {
    baseURL: 'https://217.199.252.234.nip.io', // VPS сервер с SSL
    timeout: 15000,
  }
};

// Get current environment
export const getApiConfig = () => {
  // Для продакшена используем VPS сервер
  return API_CONFIG.production;
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