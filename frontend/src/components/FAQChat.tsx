'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { searchFAQ } from '@/lib/api';
import ApplicationForm from './ApplicationForm';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface FAQChatProps {
  onActivity: () => void;
}

export default function FAQChat({ onActivity }: FAQChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopularQuestions, setShowPopularQuestions] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showApplicationSuggestion, setShowApplicationSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Функции для работы с localStorage
  const saveMessagesToStorage = (messages: Message[]) => {
    try {
      localStorage.setItem('faq-chat-messages', JSON.stringify(messages));
      localStorage.setItem('faq-chat-question-count', questionCount.toString());
    } catch (error: unknown) {
      console.error('Ошибка сохранения в localStorage:', error);
    }
  };

  const loadMessagesFromStorage = (): Message[] => {
    try {
      const savedMessages = localStorage.getItem('faq-chat-messages');
      const savedQuestionCount = localStorage.getItem('faq-chat-question-count');
      
      if (savedQuestionCount) {
        setQuestionCount(parseInt(savedQuestionCount));
      }
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Преобразуем строки дат обратно в объекты Date
        return parsedMessages.map((msg: unknown) => {
          const message = msg as { id: string; type: string; content: string; timestamp: string };
          return {
            ...message,
            timestamp: new Date(message.timestamp)
          };
        });
      }
    } catch (error: unknown) {
      console.error('Ошибка загрузки из localStorage:', error);
    }
    return [];
  };



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Загружаем сохраненные сообщения или создаем приветственное
    const savedMessages = loadMessagesFromStorage();
    
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      // Приветственное сообщение только если нет сохраненных сообщений
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: 'Привет! Я ваш умный помощник. Задайте любой вопрос или выберите из популярных тем ниже. Я постараюсь найти для вас самый подходящий ответ! ✨',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
    
    // Показываем популярные вопросы сразу
    setShowPopularQuestions(true);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    onActivity();
    
    // Увеличиваем счетчик вопросов
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    try {
      let botContent = '';
      
      // Проверяем, является ли сообщение приветствием
      if (isGreeting(inputValue.trim())) {
        botContent = getGreetingResponse();
      } else {
        // Если не приветствие, ищем в FAQ
        const response = await searchFAQ(inputValue.trim());
        
        if (response.data && response.data.faq && response.data.faq.length > 0) {
          const bestMatch = response.data.faq[0];
          botContent = `**${bestMatch.question}**\n\n${bestMatch.answer}`;
        } else {
          botContent = 'К сожалению, я не нашел точного ответа на ваш вопрос. Попробуйте переформулировать или выберите тему из списка ниже. Возможно, ваш вопрос касается одной из популярных тем?';
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botContent,
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      
      // Сохраняем сообщения в localStorage
      saveMessagesToStorage(finalMessages);
      
      // Показываем предложение оставить заявку после 3 вопросов
      if (newQuestionCount >= 3) {
        addApplicationSuggestion();
      }
      
      // Скрываем популярные вопросы после ответа и показываем через 10 секунд
      setShowPopularQuestions(false);
      setTimeout(() => {
        setShowPopularQuestions(true);
      }, 12000);
    } catch (error: unknown) {
      console.error('Ошибка при поиске FAQ:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Извините, произошла ошибка при поиске ответа. Попробуйте позже или выберите вопрос из списка ниже.',
        timestamp: new Date()
      };
      const newMessages = [...messages, userMessage, errorMessage];
      setMessages(newMessages);
      saveMessagesToStorage(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Функция для определения приветствий
  const isGreeting = (text: string): boolean => {
    const greetings = [
      'привет', 'здравствуйте', 'здравствуй', 'добрый день', 'добрый вечер', 
      'доброе утро', 'добрый вечер', 'hi', 'hello', 'hey', 'доброго времени суток'
    ];
    const normalizedText = text.toLowerCase().trim();
    return greetings.some(greeting => normalizedText.includes(greeting));
  };

  // Функция для получения ответа на приветствие
  const getGreetingResponse = (): string => {
    return 'Здравствуйте! Это бот-помощник. Чем я могу вам помочь? Задайте любой вопрос или выберите из популярных тем ниже.';
  };

  // Функция для определения вопроса о заявке
  const isApplicationQuestion = (text: string): boolean => {
    const applicationKeywords = [
      'подать заявку', 'заявка', 'заполнить заявку', 'оставить заявку', 
      'заявку', 'заявки', 'подача заявки', 'форма заявки'
    ];
    const normalizedText = text.toLowerCase().trim();
    return applicationKeywords.some(keyword => normalizedText.includes(keyword));
  };

  // Функция для обработки клика по кнопке заявки
  const handleApplicationClick = () => {
    setShowApplicationForm(true);
  };

  // Функция для обработки успешной отправки заявки
  const handleApplicationSuccess = () => {
    const successMessage: Message = {
      id: (Date.now() + 3).toString(),
      type: 'bot',
      content: '✅ **Заявка успешно отправлена!**\n\nСпасибо за вашу заявку! Мы свяжемся с вами в течение 2 часов для обсуждения деталей и ответов на ваши вопросы.\n\nЕсли у вас есть дополнительные вопросы, не стесняйтесь спрашивать!',
      timestamp: new Date()
    };
    const newMessages = [...messages, successMessage];
    setMessages(newMessages);
    saveMessagesToStorage(newMessages);
  };

  // Функция для добавления предложения оставить заявку
  const addApplicationSuggestion = () => {
    if (!showApplicationSuggestion) {
      setShowApplicationSuggestion(true);
      setTimeout(() => {
        const suggestionMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: '💡 **Хотите получить персональную консультацию?**\n\nЕсли у вас есть дополнительные вопросы или нужна помощь в выборе подходящего решения, наши специалисты готовы помочь! Оставьте заявку, и мы свяжемся с вами в течение 2 часов.\n\n📝 **Нажмите кнопку ниже, чтобы оставить заявку:**',
          timestamp: new Date()
        };
        const newMessages = [...messages, suggestionMessage];
        setMessages(newMessages);
        saveMessagesToStorage(newMessages);
      }, 2000);
    }
  };

  const popularQuestions = [
    'Какие тарифы у вас есть?',
    'Как подать заявку?',
    'Как работает техническая поддержка?',
    'Какие способы оплаты доступны?',
    'Есть ли бесплатный период?'
  ];

  const handleQuickQuestion = async (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    onActivity();
    
    // Увеличиваем счетчик вопросов
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    try {
      let botContent = '';
      
      // Проверяем, является ли сообщение приветствием
      if (isGreeting(question)) {
        botContent = getGreetingResponse();
      } else {
        // Если не приветствие, ищем в FAQ
        const response = await searchFAQ(question);
        
        if (response.data && response.data.faq && response.data.faq.length > 0) {
          const bestMatch = response.data.faq[0];
          botContent = `**${bestMatch.question}**\n\n${bestMatch.answer}`;
        } else {
          botContent = 'К сожалению, я не нашел точного ответа на ваш вопрос. Попробуйте переформулировать или выберите тему из списка ниже.';
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botContent,
        timestamp: new Date()
      };

      const finalMessages = [...messages, userMessage, botMessage];
      setMessages(finalMessages);
      
      // Сохраняем сообщения в localStorage
      saveMessagesToStorage(finalMessages);
      
      // Показываем предложение оставить заявку после 3 вопросов
      if (newQuestionCount >= 3) {
        addApplicationSuggestion();
      }
      
      // Скрываем популярные вопросы после ответа и показываем через 10 секунд
      setShowPopularQuestions(false);
      setTimeout(() => {
        setShowPopularQuestions(true);
      }, 12000);
    } catch (error: unknown) {
      console.error('Ошибка при поиске FAQ (quick question):', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Извините, произошла ошибка при поиске ответа. Попробуйте позже.',
        timestamp: new Date()
      };
      const newMessages = [...messages, userMessage, errorMessage];
      setMessages(newMessages);
      saveMessagesToStorage(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-100 shadow-xl'
              }`}
            >
                             <div className="flex items-start gap-3">
                 <div className="flex-1">
                  {message.type === 'bot' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-purple-700">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          li: ({ children }) => <li className="mb-1">{children}</li>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      
                      {/* Кнопка заявки для вопросов о заявках и предложений */}
                      {(isApplicationQuestion(message.content) || message.content.includes('персональную консультацию')) && (
                        <div className="mt-4">
                          <button
                            onClick={handleApplicationClick}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-sm"
                          >
                            📝 Подать заявку
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Popular Questions */}
      {showPopularQuestions && (
        <div className="p-3 border-t border-gray-200 bg-white bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-purple-500" />
            <p className="text-xs font-medium text-gray-700">Популярные вопросы:</p>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {popularQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-1.5 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md text-left"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white bg-opacity-80 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите ваш вопрос..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md"
              disabled={isLoading}
            />
            {inputValue && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
      
      {/* Application Form Modal */}
      {showApplicationForm && (
        <ApplicationForm 
          onClose={() => setShowApplicationForm(false)} 
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
} 