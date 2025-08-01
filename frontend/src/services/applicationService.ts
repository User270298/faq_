import { ApplicationCreate, ApplicationResponse } from '@/types/api';

export class ApplicationService {
  private applications: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    selectedTariff: string;
    message?: string;
    created_at: string;
    status: string;
    updated_at?: string;
  }> = [];

  async submitApplication(applicationData: ApplicationCreate): Promise<ApplicationResponse> {
    try {
      // Валидация данных
      if (!applicationData.name || !applicationData.email || !applicationData.phone) {
        throw new Error('Необходимо заполнить все обязательные поля');
      }

      // Проверка email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(applicationData.email)) {
        throw new Error('Некорректный email адрес');
      }

      // Проверка телефона
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(applicationData.phone)) {
        throw new Error('Некорректный номер телефона');
      }

      // Создаем заявку
      const application = {
        id: Date.now().toString(),
        ...applicationData,
        created_at: new Date().toISOString(),
        status: 'new'
      };

      // В реальном приложении здесь была бы запись в базу данных
      this.applications.push(application);

      // Логирование для отладки
      console.log('📝 Новая заявка:', application);

      // Имитация отправки email
      await this.sendNotificationEmail(application);

      return {
        success: true,
        message: 'Заявка успешно отправлена! Мы свяжемся с вами в течение 2 часов.',
        application_id: application.id
      };

    } catch (error) {
      console.error('❌ Ошибка при отправке заявки:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Произошла ошибка при отправке заявки'
      };
    }
  }

  private async sendNotificationEmail(application: {
    id: string;
    name: string;
    email: string;
    phone: string;
    selectedTariff: string;
    message?: string;
    created_at: string;
    status: string;
  }): Promise<void> {
    // Имитация отправки email
    console.log('📧 Отправляем уведомление на email:', application.email);
    console.log('📧 Тема: Новая заявка от', application.name);
    console.log('📧 Содержание:', {
      name: application.name,
      email: application.email,
      phone: application.phone,
      tariff: application.selectedTariff,
      message: application.message || 'Сообщение не указано'
    });

    // В реальном приложении здесь была бы интеграция с email сервисом
    // например, SendGrid, Mailgun, или встроенный SMTP
  }

  getAllApplications(): Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    selectedTariff: string;
    message?: string;
    created_at: string;
    status: string;
    updated_at?: string;
  }> {
    return this.applications;
  }

  getApplicationById(id: string): {
    id: string;
    name: string;
    email: string;
    phone: string;
    selectedTariff: string;
    message?: string;
    created_at: string;
    status: string;
    updated_at?: string;
  } | null {
    return this.applications.find(app => app.id === id) || null;
  }

  updateApplicationStatus(id: string, status: string): boolean {
    const application = this.applications.find(app => app.id === id);
    if (application) {
      application.status = status;
      application.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }
} 