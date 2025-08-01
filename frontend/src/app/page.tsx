'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, Bot, User, FileText, Sparkles, MessageCircle, X, Mail, Phone } from 'lucide-react';
import { searchFAQ } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopularQuestions, setShowPopularQuestions] = useState(false);
  const [showApplicationSuggestion, setShowApplicationSuggestion] = useState(false);
  const [hasShownApplicationSuggestion, setHasShownApplicationSuggestion] = useState(false); // Флаг для показа только один раз
  const [isFullChatOpen, setIsFullChatOpen] = useState(false);
  // const [questionCount, setQuestionCount] = useState(0); // Убираем неиспользуемую переменную
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    selectedTariff: 'standard', // По умолчанию выбран стандартный тариф
    message: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Популярные вопросы из FAQ (5 вопросов)
  const popularQuestions = [
    "Какие тарифы у вас есть?",
    "Сколько стоит стандартный тариф?",
    "Есть ли бесплатный период?",
    "Как происходит установка и настройка?",
    "Какая техническая поддержка предоставляется?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Приветственное сообщение
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'bot',
      content: 'Привет! Я ваш умный помощник. Задайте любой вопрос или выберите из популярных тем ниже. Я постараюсь найти для вас самый подходящий ответ! ✨',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    // Показываем часто задаваемые вопросы сразу при открытии
    setShowPopularQuestions(true);
  }, []);

  // Показываем часто задаваемые вопросы снова после ответа
  useEffect(() => {
    if (messages.length > 1 && !showPopularQuestions) {
      const timer = setTimeout(() => {
        setShowPopularQuestions(true);
      }, 10000); // Изменили время до 15 секунд
      return () => clearTimeout(timer);
    }
  }, [messages, showPopularQuestions]);

  // Предлагаем заявку через 3 сообщения пользователя (только один раз)
  useEffect(() => {
    const userMessages = messages.filter(msg => msg.type === 'user');
    if (userMessages.length >= 3 && !showApplicationSuggestion && !hasShownApplicationSuggestion) {
      console.log('🟢 Показываем предложение заявки (3 сообщения)');
      setShowApplicationSuggestion(true);
      setHasShownApplicationSuggestion(true); // Отмечаем, что уже показали
    }
  }, [messages, showApplicationSuggestion, hasShownApplicationSuggestion]);

  // Предлагаем заявку через 20 секунд после первого вопроса (если еще не показывали)
  useEffect(() => {
    const userMessages = messages.filter(msg => msg.type === 'user');
    if (userMessages.length === 1 && !hasShownApplicationSuggestion) {
      const timer = setTimeout(() => {
        if (!hasShownApplicationSuggestion) {
          console.log('🟢 Показываем предложение заявки (20 секунд)');
          setShowApplicationSuggestion(true);
          setHasShownApplicationSuggestion(true);
        }
      }, 20000); // 20 секунд
      return () => clearTimeout(timer);
    }
  }, [messages, hasShownApplicationSuggestion]);

  // Отслеживаем состояние модального окна
  useEffect(() => {
    console.log('🟡 showApplicationModal:', showApplicationModal);
  }, [showApplicationModal]);

  // Отслеживаем состояние предложения заявки
  useEffect(() => {
    console.log('🟠 showApplicationSuggestion:', showApplicationSuggestion);
    console.log('🟡 showApplicationModal:', showApplicationModal);
    console.log('🔴 hasShownApplicationSuggestion:', hasShownApplicationSuggestion);
    console.log('🔍 Должен ли показываться блок:', showApplicationSuggestion && !showApplicationModal);
  }, [showApplicationSuggestion, showApplicationModal, hasShownApplicationSuggestion]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    // setQuestionCount(prev => prev + 1); // Убираем неиспользуемую переменную
    setShowPopularQuestions(false);

    try {
      const response = await searchFAQ(inputValue);
      
      if (response.success && response.data?.faq && response.data.faq.length > 0) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.data.faq[0].answer,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: 'Извините, я не нашел подходящего ответа на ваш вопрос. Попробуйте переформулировать или выберите один из популярных вопросов ниже.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error: unknown) {
      console.error('Ошибка при поиске FAQ:', error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Произошла ошибка при поиске ответа. Попробуйте еще раз.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = async (question: string) => {
    // НЕ вставляем вопрос в поле ввода
    setShowPopularQuestions(false);
    // setQuestionCount(prev => prev + 1); // Убираем неиспользуемую переменную
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await searchFAQ(question);
      
      if (response.success && response.data?.faq && response.data.faq.length > 0) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.data.faq[0].answer,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: 'Извините, я не нашел подходящего ответа на этот вопрос.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error: unknown) {
      console.error('Ошибка при поиске FAQ (quick question):', error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Произошла ошибка при поиске ответа.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }

    setIsLoading(false);
  };

  const handleApplicationSuggestion = () => {
    console.log('🔵 Открываем модальное окно заявки');
    // Принудительно скрываем предложение и открываем модальное окно
    setShowApplicationSuggestion(false);
    setTimeout(() => {
      setShowApplicationModal(true);
    }, 100); // Небольшая задержка для гарантии обновления состояния
    console.log('🔴 Скрываем предложение заявки');
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('📤 Отправляем заявку:', applicationForm);
      // Отправляем данные на бэкенд
                      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationForm),
      });

      console.log('📥 Ответ сервера:', response.status);

      if (response.ok) {
        console.log('✅ Заявка успешно отправлена');
        setIsSubmitted(true);
        setTimeout(() => {
          setShowApplicationModal(false);
          setShowApplicationSuggestion(false); // Скрываем предложение после успешной отправки
          setIsSubmitted(false);
          setApplicationForm({ name: '', email: '', phone: '', selectedTariff: 'standard', message: '' });
          
          // Добавляем сообщение об успешной отправке
          const botMessage: Message = {
            id: Date.now().toString(),
            type: 'bot',
            content: 'Спасибо! Мы с вами свяжемся в ближайшее время! 📞',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        }, 2000);
      } else {
        console.error('❌ Ошибка сервера:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Текст ошибки:', errorText);
      }
    } catch (error: unknown) {
      console.error('❌ Ошибка отправки заявки:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setApplicationForm({
      ...applicationForm,
      [e.target.name]: e.target.value
    });
  };

  const handleInputClick = () => {
    if (!isFullChatOpen) {
      setIsFullChatOpen(true);
    }
  };

  // Если полный чат не открыт, показываем только форму ввода
  if (!isFullChatOpen) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          
          {/* Main title */}
          <div className="text-center mb-8">
            <div className="relative">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse relative z-10">
                Чат бот под ключ
              </h1>
              {/* Glow effect behind title */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-2xl animate-pulse"></div>
            </div>
            <h2 className="text-xl md:text-2xl text-gray-300 font-light animate-fade-in">
              для вашего бизнеса
            </h2>
            {/* Floating particles */}
            <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-60 delay-500"></div>
            <div className="absolute bottom-10 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce opacity-60 delay-1000"></div>
          </div>

          {/* Central image with enhanced styling */}
          <div className="mb-8 relative group">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
              
              {/* Main image container */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl group-hover:border-white/40 transition-all duration-500">
                <Image
                  src="/i.jpeg"
                  alt="AI Chat Bot"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  priority
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 group-hover:to-black/10 transition-all duration-500"></div>
                
                {/* Floating elements around image */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400 rounded-full animate-bounce opacity-80"></div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-purple-400 rounded-full animate-bounce opacity-80 delay-300"></div>
                <div className="absolute top-1/2 -right-6 w-4 h-4 bg-pink-400 rounded-full animate-bounce opacity-80 delay-500"></div>
              </div>
              
              {/* Rotating ring effect */}
              <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-4 border-2 border-purple-400/20 rounded-full animate-spin-slow-reverse"></div>
            </div>
          </div>

          {/* Simple chat input form */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-4">
                {/* User icon */}
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                
                {/* Input field */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onClick={handleInputClick}
                    placeholder="Что ищете?"
                    className="w-full bg-white/25 backdrop-blur-sm text-white placeholder-gray-200 border border-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 cursor-pointer text-base font-medium drop-shadow-sm"
                    disabled={isLoading}
                  />
                </div>
                
                {/* Send button */}
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                >
                  <Send size={20} className="text-white" />
                </button>
              </div>
            </div>
                  </div>
      </div>


    </main>
  );
}

  // Полный чат
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Full chat interface */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* Main title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            Чат бот под ключ
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-300 font-light">
            для вашего бизнеса
          </h2>
        </div>

        {/* Central image with enhanced styling */}
        <div className="mb-8 relative group">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            {/* Glow effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
            
            {/* Main image container */}
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl group-hover:border-white/40 transition-all duration-500">
              <Image
                src="/i.jpeg"
                alt="AI Chat Bot"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                priority
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 group-hover:to-black/10 transition-all duration-500"></div>
              
              {/* Floating elements around image */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400 rounded-full animate-bounce opacity-80"></div>
              <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-purple-400 rounded-full animate-bounce opacity-80 delay-300"></div>
              <div className="absolute top-1/2 -right-6 w-4 h-4 bg-pink-400 rounded-full animate-bounce opacity-80 delay-500"></div>
            </div>
            
            {/* Rotating ring effect */}
            <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-4 border-2 border-purple-400/20 rounded-full animate-spin-slow-reverse"></div>
          </div>
        </div>

        {/* Full chat interface with messages */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 h-[500px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="font-semibold text-lg">FAQ Помощник</h3>
              <button
                onClick={() => setIsFullChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-400 to-purple-400' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-700'
                    }`}>
                      {message.type === 'user' ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/10 backdrop-blur-sm text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300'
                    }`}>
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown 
                          components={{
                            strong: ({children}) => <strong className="font-bold text-white drop-shadow-sm">{children}</strong>,
                            em: ({children}) => <em className="italic text-white drop-shadow-sm">{children}</em>,
                            code: ({children}) => <code className="bg-white/30 text-white px-2 py-1 rounded text-sm font-mono drop-shadow-sm">{children}</code>,
                            p: ({children}) => <p className="text-white leading-relaxed drop-shadow-sm text-base">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside text-white space-y-2 ml-4">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside text-white space-y-2 ml-4">{children}</ol>,
                            li: ({children}) => <li className="text-white drop-shadow-sm">{children}</li>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-white/90 bg-white/5 rounded-r-lg py-2 drop-shadow-sm">{children}</blockquote>
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center animate-pulse">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl px-4 py-3 shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                        <span className="text-white/70 text-sm ml-2">Ищу ответ...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Popular questions - компактные внизу */}
            {showPopularQuestions && (
              <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                  <p className="text-white/90 text-sm font-medium">Часто задаваемые вопросы:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-md hover:shadow-blue-500/20 group"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'slideInFromLeft 0.3s ease-out forwards'
                      }}
                    >
                      <span className="group-hover:text-blue-300 transition-colors duration-300">{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Application suggestion - через 3 сообщения или 20 секунд */}
            {showApplicationSuggestion && !showApplicationModal && (
              <div className="p-4 border-t border-white/10">
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-green-400/30 relative">
                  {/* Кнопка свернуть */}
                  <button
                    onClick={() => setShowApplicationSuggestion(false)}
                    className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
                    aria-label="Свернуть"
                  >
                    <X size={16} />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-green-400" />
                    <p className="text-white font-semibold">Готовы оставить заявку?</p>
                  </div>
                  <p className="text-white/80 text-sm mb-3">
                    Наш специалист свяжется с вами и поможет подобрать оптимальное решение для вашего бизнеса.
                  </p>
                  <button
                    onClick={handleApplicationSuggestion}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Оставить заявку
                  </button>
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                {/* User icon */}
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                
                {/* Input field */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Что ищете?"
                    className="w-full bg-white/25 backdrop-blur-sm text-white placeholder-gray-200 border border-white/40 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 text-base font-medium drop-shadow-sm"
                    disabled={isLoading}
                  />
                </div>
                
                {/* Send button */}
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                >
                  <Send size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal - перемещено в конец для правильного отображения */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => {
              setShowApplicationModal(false);
              setShowApplicationSuggestion(false);
            }}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 w-full max-w-md p-6 z-[10000]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Оставить заявку</h2>
              <button
                onClick={() => {
                  setShowApplicationModal(false);
                  setShowApplicationSuggestion(false);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <User size={16} className="inline mr-2" />
                    Имя *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={applicationForm.name}
                    onChange={handleApplicationChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                    placeholder="Ваше имя"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={applicationForm.email}
                    onChange={handleApplicationChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={applicationForm.phone}
                    onChange={handleApplicationChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                {/* Tariff Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <FileText size={16} className="inline mr-2" />
                    Выберите тариф *
                  </label>
                  <select
                    name="selectedTariff"
                    value={applicationForm.selectedTariff}
                    onChange={handleApplicationChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                  >
                    <option value="mini">Мини - 2000 ₽/мес</option>
                    <option value="standard">Стандарт - 5000 ₽/мес</option>
                    <option value="premium">Премиум - 10000 ₽/мес</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <MessageCircle size={16} className="inline mr-2" />
                    Дополнительная информация
                  </label>
                  <textarea
                    name="message"
                    value={applicationForm.message}
                    onChange={handleApplicationChange}
                    rows={3}
                    className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 resize-none"
                    placeholder="Расскажите о вашем проекте или оставьте комментарий..."
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Отправить заявку
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Заявка отправлена!</h3>
                <p className="text-white/80">Мы с вами свяжемся в ближайшее время</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
