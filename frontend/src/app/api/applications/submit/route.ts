import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/services/applicationService';

const applicationService = new ApplicationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация обязательных полей
    if (!body.name || !body.email || !body.phone || !body.selectedTariff) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, email, phone, selectedTariff' 
        },
        { status: 400 }
      );
    }

    const result = await applicationService.submitApplication(body);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Application Submit API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Произошла ошибка при отправке заявки'
      },
      { status: 500 }
    );
  }
} 