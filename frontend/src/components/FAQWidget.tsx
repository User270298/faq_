'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import FAQChat from './FAQChat';
import ApplicationForm from './ApplicationForm';

interface FAQWidgetProps {
  autoOpenDelay?: number;
  autoHideDelay?: number;
}

export default function FAQWidget({
  // autoOpenDelay = 5000, // Убираем неиспользуемые параметры
  // autoHideDelay = 30000
}: FAQWidgetProps) {
  const [isOpen] = useState(true); // Всегда открыт
  const [showApplication, setShowApplication] = useState(false);
  // const [lastActivity, setLastActivity] = useState(Date.now()); // Убираем неиспользуемую переменную

  const handleActivity = () => {
    // setLastActivity(Date.now()); // Убираем неиспользуемую переменную
  };

  const handleClose = () => {
    // Не закрываем, просто сбрасываем состояние
    setShowApplication(false);
  };

  // const handleShowApplication = () => { // Убираем неиспользуемую функцию
  //   setShowApplication(true);
  //   handleActivity();
  // };

  // Если не открыт, не показываем ничего
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-2 relative z-10">
            <h3 className="font-semibold text-lg">FAQ Помощник</h3>
          </div>

          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors duration-200"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showApplication ? (
            <ApplicationForm 
              onClose={() => setShowApplication(false)}
              onBack={() => setShowApplication(false)}
              onActivity={handleActivity}
            />
          ) : (
            <FAQChat 
              onActivity={handleActivity}
            />
          )}
        </div>
      </div>
    </div>
  );
} 