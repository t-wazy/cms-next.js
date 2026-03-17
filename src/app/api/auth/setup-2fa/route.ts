import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpSecret: true },
    });

    return NextResponse.json({
      is2FAEnabled: !!user?.totpSecret,
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, totpCode, secret } = body;

    if (action === 'generate') {
      // シークレット生成
      const secretObj = speakeasy.generateSecret({
        name: `Next-CMS (${session.user.email})`,
        issuer: 'Next-CMS',
      });

      // QRコード生成
      const qrCode = await QRCode.toDataURL(secretObj.otpauth_url!);

      return NextResponse.json({
        secret: secretObj.base32,
        qrCode,
      });
    }

    if (action === 'verify') {
      // コード検証
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: totpCode,
      });

      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid code' },
          { status: 400 }
        );
      }

      // DBに保存
      await prisma.user.update({
        where: { id: session.user.id },
        data: { totpSecret: secret },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
