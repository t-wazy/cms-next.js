import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        totpSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { needs2FA: false, valid: false },
        { status: 200 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { needs2FA: false, valid: false },
        { status: 200 }
      );
    }

    // パスワードは正しい
    return NextResponse.json({
      needs2FA: !!user.totpSecret,
      valid: true,
    });
  } catch (error) {
    console.error('Check 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
