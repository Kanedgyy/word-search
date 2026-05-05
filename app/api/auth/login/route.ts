import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Валидация
    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Поиск пользователя
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь с таким email не найден' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Ошибка входа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
