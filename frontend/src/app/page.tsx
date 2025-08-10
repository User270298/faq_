'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Send, Bot, User, FileText, Sparkles, MessageCircle, X, Mail, Phone } from 'lucide-react';
import { searchFAQ, aiSearchFAQ, AISearchResponse } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { TariffsService } from '@/services/tariffsService';
import type { Tariff as TariffItem } from '@/types/api';
import { FAQService } from '@/services/faqService';

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
  // Состояния диалога (пошаговая логика)
  const [currentStep, setCurrentStep] = useState<'welcome' | 'faq' | 'tariff_list' | 'tariff_selected'>('welcome');
  const [stepHistory, setStepHistory] = useState<Array<'welcome' | 'faq' | 'tariff_list' | 'tariff_selected'>>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [selectedTariffId, setSelectedTariffId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Простая NLP-нормализация и расширение запроса с синонимами
  const RUSSIAN_STOPWORDS = new Set([
    'и','в','во','не','что','он','на','я','с','со','как','а','то','все','она','так','его','но','да','ты','к','у','же','вы','за','бы','по','только','ее','мне','было','вот','от','меня','еще','нет','о','из','ему','теперь','когда','даже','ну','вдруг','ли','если','уже','или','ни','быть','был','него','до','вас','нибудь','опять','уж','вам','ведь','там','потом','себя','ничего','ей','может','они','тут','где','есть','надо','ней','для','мы','тебя','их','чем','была','сам','чтоб','без','будто','чего','раз','тоже','себе','под','будет','ж','тогда','кто','этот','того','потому','этого','какой','совсем','ним','здесь','этом','один','почти','мой','тем','чтобы','нее','сейчас','были','куда','зачем','всех','никогда','можно','при','наконец','два','об','другой','хоть','после','над','больше','тот','через','эти','нас','про','всего','них','какая','много','разве','три','эту','моя','впрочем','хорошо','свою','этой','перед','иногда','лучше','чуть','том','нельзя','такой','им','более','всегда','конечно','всю','между'
  ]);

  const SYNONYMS: Record<string, string[]> = {
    'тариф': ['план','стоимость','цена','подписка','пакет'],
    'поддержка': ['саппорт','помощь','техподдержка'],
    'оплата': ['платеж','стоимость','цена','способ оплаты','оплатить'],
    'установка': ['настройка','интеграция','внедрение'],
    'бесплатный': ['free','пробный','trial','триал'],
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const expandWithSynonyms = (text: string): string => {
    const tokens = normalizeText(text).split(' ').filter(Boolean);
    const expanded: string[] = [];
    for (const token of tokens) {
      if (RUSSIAN_STOPWORDS.has(token)) continue;
      expanded.push(token);
      if (SYNONYMS[token]) {
        expanded.push(...SYNONYMS[token]);
      }
    }
    return Array.from(new Set(expanded)).join(' ');
  };

  const faqServiceRef = useRef<FAQService | null>(null);
  if (faqServiceRef.current === null) {
    faqServiceRef.current = new FAQService();
  }

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
    // Приветственное сообщение с выбором режима
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'bot',
      content: '**Добро пожаловать!**\n\nВыберите режим: **FAQ** или **Подбор тарифа**. Также вы можете просто задать вопрос внизу или выбрать из популярных тем.',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    // Показываем часто задаваемые вопросы сразу при открытии
    setShowPopularQuestions(true);
    setCurrentStep('welcome');

    // Загружаем тарифы из локального источника
    const service = new TariffsService();
    const data = service.getAllTariffs();
    setTariffs(data.tariffs);
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
      // 1) ИИ-поиск
      const aiResponse: AISearchResponse = await aiSearchFAQ(inputValue);
      if (aiResponse.success && aiResponse.matches && aiResponse.matches.length > 0) {
        const best = aiResponse.matches[0];
        let botContent = `**Ближайший вопрос:** ${best.question}\n\n${best.answer}`;
        if (aiResponse.matches.length > 1) {
          botContent += `\n\n🔍 **Похожие вопросы:**`;
          for (let i = 1; i < Math.min(3, aiResponse.matches.length); i++) {
            const m = aiResponse.matches[i];
            botContent += `\n• ${m.question} (${m.relevance_score}%)`;
          }
        }
        const botMessage: Message = { id: (Date.now() + 1).toString(), type: 'bot', content: botContent, timestamp: new Date() };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // 2) Поиск по ключевым словам на бэкенде
        const fallback = await searchFAQ(inputValue);
        if (fallback.success && fallback.data?.faq && fallback.data.faq.length > 0) {
          const top = fallback.data.faq[0];
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: `**Ближайший вопрос:** ${top.question}\n\n${top.answer}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          // 3) Локальный поиск с NLP-расширением
          const expanded = expandWithSynonyms(inputValue);
          const local = faqServiceRef.current?.searchFAQ(expanded) || [];
          if (local.length > 0) {
            const top = local[0];
            const botMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'bot',
              content: `**Ближайший вопрос:** ${top.question}\n\n${top.answer}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
          } else {
            let noResultsContent = aiResponse.message || 'Извините, я не нашел подходящего ответа на ваш вопрос.';
            const popular = faqServiceRef.current?.getPopularQuestions(3) || [];
            if (popular.length > 0) {
              noResultsContent += '\n\n🔥 **Популярные вопросы:**';
              popular.forEach(p => { noResultsContent += `\n• ${p.question}`; });
            }
            const botMessage: Message = { id: (Date.now() + 1).toString(), type: 'bot', content: noResultsContent, timestamp: new Date() };
            setMessages(prev => [...prev, botMessage]);
          }
        }
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
      const aiResponse: AISearchResponse = await aiSearchFAQ(question);
      if (aiResponse.success && aiResponse.matches && aiResponse.matches.length > 0) {
        const best = aiResponse.matches[0];
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `**Ближайший вопрос:** ${best.question}\n\n${best.answer}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const fallbackResponse = await searchFAQ(question);
        if (fallbackResponse.success && fallbackResponse.data?.faq && fallbackResponse.data.faq.length > 0) {
          const top = fallbackResponse.data.faq[0];
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: `**Ближайший вопрос:** ${top.question}\n\n${top.answer}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          const expanded = expandWithSynonyms(question);
          const local = faqServiceRef.current?.searchFAQ(expanded) || [];
          if (local.length > 0) {
            const top = local[0];
            const botMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'bot',
              content: `**Ближайший вопрос:** ${top.question}\n\n${top.answer}`,
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
        }
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

  // Навигация по шагам
  const goToStep = (next: 'welcome' | 'faq' | 'tariff_list' | 'tariff_selected') => {
    setStepHistory((prev) => [...prev, currentStep]);
    setCurrentStep(next);
  };

  const goBack = () => {
    setStepHistory((prev) => {
      if (prev.length === 0) {
        setCurrentStep('welcome');
        return prev;
      }
      const copy = [...prev];
      const last = copy.pop() as 'welcome' | 'faq' | 'tariff_list' | 'tariff_selected';
      setCurrentStep(last);
      return copy;
    });
  };

  const openTariffSelection = () => {
    goToStep('tariff_list');
    setShowPopularQuestions(false);
  };

  const selectTariff = (tariffId: string) => {
    setSelectedTariffId(tariffId);
    setApplicationForm((prev) => ({ ...prev, selectedTariff: tariffId }));
    goToStep('tariff_selected');
  };

  const openApplicationWithTariff = (tariffId?: string) => {
    if (tariffId) {
      setApplicationForm((prev) => ({ ...prev, selectedTariff: tariffId }));
      setSelectedTariffId(tariffId);
    }
    setShowApplicationSuggestion(false);
    setShowApplicationModal(true);
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

  // Настраиваем размеры контейнера и панели по шагам
  const isWelcomeStep = currentStep === 'welcome';
  const isFaqStep = currentStep === 'faq';
  const isTariffStep = currentStep === 'tariff_list' || currentStep === 'tariff_selected';
  const containerMaxWidthClass = isWelcomeStep ? 'max-w-xl' : isFaqStep ? 'max-w-4xl' : 'max-w-3xl';
  const panelHeightPx = isWelcomeStep ? 280 : isFaqStep ? 560 : 420;

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
            <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full "></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full "></div>
            <div className="absolute bottom-10 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full "></div>
          </div>

          {/* Central image with enhanced styling */}
          <div className="mb-8 relative group">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
              
              {/* Main image container */}
              <div className="relative w-full h-full rounded-full overflow-hidden ">
                <Image
                  src="/humanoid-robot.jpg"
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
                src="/humanoid-robot.jpg"
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

        {/* Full chat interface with adaptive size */}
        <div className={`w-full ${containerMaxWidthClass} mx-auto transition-all duration-500 ease-in-out`}>
          <div
            className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden transition-all duration-500 ease-in-out"
            style={{ height: `${panelHeightPx}px` }}
          >
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

            {/* Шаги диалога (выбор режима/тарифов) */}
            <div className="p-4 border-b border-white/10">
              {currentStep === 'welcome' && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4 items-stretch">
                  <div className="text-white/90 text-sm text-center">Выберите режим диалога:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        goToStep('faq');
                        setIsFullChatOpen(true);
                        setShowPopularQuestions(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      FAQ
                    </button>
                    <button
                      onClick={() => {
                        setIsFullChatOpen(true);
                        openTariffSelection();
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      Подбор тарифа
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'tariff_list' && (
                <div className="space-y-3 animate-[fade-in_0.25s_ease-out_forwards]">
                  <div className="flex items-center justify-between">
                    <p className="text-white/90 font-medium">Краткое описание тарифов</p>
                    <button onClick={goBack} className="text-white/70 hover:text-white text-sm">← Назад</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tariffs.map((t) => (
                      <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/90 transition-transform duration-300 hover:scale-[1.01]">
                        <div className="flex items-baseline justify-between mb-2">
                          <h4 className="text-base font-semibold">{t.name}</h4>
                          <span className="text-sm text-white/80">{t.price.toLocaleString('ru-RU')} ₽/мес</span>
                        </div>
                        <p className="text-white/70 text-sm mb-3">{t.description}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => selectTariff(t.id)}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300"
                          >
                            Выбрать
                          </button>
                          <button
                            onClick={() => openApplicationWithTariff(t.id)}
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-white/20 transition-all duration-300"
                          >
                            Оставить заявку
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'faq' && (
                <div className="flex items-center justify-between">
                  <p className="text-white/90 font-medium">Режим: FAQ</p>
                  <button onClick={goBack} className="text-white/70 hover:text-white text-sm">← Назад</button>
                </div>
              )}

              {currentStep === 'tariff_selected' && selectedTariffId && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Вы выбрали тариф</p>
                    <button onClick={goBack} className="text-white/70 hover:text-white text-sm">← Назад</button>
                  </div>
                  {(() => {
                    const t = tariffs.find((x) => x.id === selectedTariffId);
                    if (!t) return null;
                    return (
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <h4 className="text-base font-semibold">{t.name}</h4>
                          <span className="text-sm text-white/80">{t.price.toLocaleString('ru-RU')} ₽/мес</span>
                        </div>
                        <p className="text-white/80 text-sm mb-3">{t.description}</p>
                        <ul className="list-disc list-inside text-white/80 text-sm space-y-1 mb-4">
                          {t.features.slice(0, 3).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openApplicationWithTariff(t.id)}
                            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                          >
                            Оставить заявку
                          </button>
                          <button
                            onClick={() => setCurrentStep('tariff_list')}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium border border-white/20 transition-all duration-300"
                          >
                            Выбрать другой
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Messages area: показываем только в режиме FAQ */}
            {currentStep === 'faq' && (
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
            )}

            {/* Popular questions - компактные внизу (только в режиме FAQ) */}
            {currentStep === 'faq' && showPopularQuestions && (
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

            {/* Application suggestion - только в режиме FAQ */}
            {currentStep === 'faq' && showApplicationSuggestion && !showApplicationModal && (
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

            {/* Input area: только в режиме FAQ */}
            {currentStep === 'faq' && (
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
            )}
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
