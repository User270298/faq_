'use client';

import { useState } from 'react';
import { X, Send, User, Mail, Phone } from 'lucide-react';

interface ApplicationFormProps {
  onClose: () => void;
  onBack?: () => void;
  onActivity?: () => void;
  onSuccess?: () => void;
}

export default function ApplicationForm({ onClose, onBack, onActivity, onSuccess }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onActivity?.();
    
    // Здесь будет отправка данных на сервер
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    onActivity?.();
  };

  return (
         <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white !bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'white' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={() => {
                  onBack();
                  onActivity?.();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-800">Подать заявку</h2>
          </div>
          <button
            onClick={() => {
              onClose();
              onActivity?.();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              Имя *
            </label>
                                                   <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => onActivity?.()}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white !bg-white"
                style={{ 
                  backgroundColor: 'white',
                  color: 'black',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  borderColor: '#d1d5db'
                }}
                placeholder="Ваше имя"
              />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email *
            </label>
                                                   <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => onActivity?.()}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white !bg-white"
                style={{ 
                  backgroundColor: 'white',
                  color: 'black',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  borderColor: '#d1d5db'
                }}
                placeholder="your@email.com"
              />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-2" />
              Телефон *
            </label>
                                                   <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => onActivity?.()}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 bg-white !bg-white"
                style={{ 
                  backgroundColor: 'white',
                  color: 'black',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  borderColor: '#d1d5db'
                }}
                placeholder="+7 (999) 123-45-67"
              />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => onActivity?.()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Отправка...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Send size={16} className="mr-2" />
                Отправить заявку
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 