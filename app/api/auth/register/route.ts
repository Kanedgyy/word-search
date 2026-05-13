import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Валидация
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: 'Имя должно быть от 2 до 20 символов' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 6 символов' },
        { status: 400 }
      );
    }

    // Проверка существования email
    const existingUserWithEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Проверка существования имени пользователя
    const existingUserWithName = await db.query.users.findFirst({
      where: eq(users.name, name),
    });

    if (existingUserWithName) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем уже существует. Выберите другое имя.' },
        { status: 400 }
      );
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        emailVerified: true,
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
