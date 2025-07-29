'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import FAQChat from './FAQChat';
import ApplicationForm from './ApplicationForm';

interface FAQWidgetProps {
  autoOpenDelay?: number;
  autoHideDelay?: number;
}

export default function FAQWidget({
  autoOpenDelay = 5000,
  autoHideDelay = 30000
}: FAQWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Автоматическое открытие через delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, autoOpenDelay);

    return () => clearTimeout(timer);
  }, [autoOpenDelay]);

  // Автоматическое скрытие при неактивности (отключено для сохранения состояния)
  // useEffect(() => {
  //   if (!isOpen) return;

  //   const checkInactivity = () => {
  //     const now = Date.now();
  //     if (now - lastActivity > autoHideDelay) {
  //       setIsOpen(false);
  //       setShowApplication(false);
  //     }
  //   };

  //   const interval = setInterval(checkInactivity, 1000);
  //   return () => clearInterval(interval);
  // }, [isOpen, lastActivity, autoHideDelay]);

  const handleActivity = () => {
    setLastActivity(Date.now());
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowApplication(false);
  };

  const handleShowApplication = () => {
    setShowApplication(true);
    handleActivity();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsOpen(true);
            handleActivity();
          }}
          className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Открыть FAQ"
        >
          <MessageCircle size={24} className="relative z-10" />

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Задать вопрос
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-[500px] h-[700px] flex flex-col overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center relative overflow-hidden">
          {/* Background pattern */}
          {/* <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-8 h-8 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white rounded-full"></div>
          </div> */}

          <div className="flex items-center gap-2 relative z-10">
            <h3 className="font-semibold text-lg">FAQ Помощник</h3>
          </div>

          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-all duration-300 hover:scale-110 relative z-10 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!showApplication ? (
            <FAQChat
              onActivity={handleActivity}
            />
          ) : (
            <ApplicationForm
              onClose={() => {
                setShowApplication(false);
                handleActivity();
              }}
              onBack={() => {
                setShowApplication(false);
                handleActivity();
              }}
              onActivity={handleActivity}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
} 