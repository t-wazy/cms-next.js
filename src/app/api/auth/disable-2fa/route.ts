import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // totpSecretをnullに設定して2FAを無効化
    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpSecret: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
