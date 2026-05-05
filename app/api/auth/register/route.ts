import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    // Валидация
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Имя и email обязательны' },
        { status: 400 }
      );
    }

    // Проверка существования email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Создание пользователя
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
      })
      .returning();

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error: any) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
