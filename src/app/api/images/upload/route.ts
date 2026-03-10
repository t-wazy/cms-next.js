import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const alt = formData.get('alt') as string | null;
    const caption = formData.get('caption') as string | null;

    // バリデーション
    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '許可されていない画像形式です' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以内にしてください' },
        { status: 400 }
      );
    }

    // ファイルをBufferに変換
    const buffer = Buffer.from(await file.arrayBuffer());

    // sharpで画像情報取得
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: '画像情報の取得に失敗しました' },
        { status: 400 }
      );
    }

    // ファイル名生成
    const ext = path.extname(file.name);
    const fileName = crypto.randomUUID() + ext;
    const filePath = `/uploads/${fileName}`;
    const physicalPath = path.join(process.cwd(), 'public', 'uploads', fileName);

    // ファイル保存
    await fs.writeFile(physicalPath, buffer);

    // DB登録
    const image = await prisma.image.create({
      data: {
        fileName: file.name,
        filePath,
        mimeType: file.type,
        fileSize: file.size,
        width: metadata.width,
        height: metadata.height,
        alt: alt || null,
        caption: caption || null,
        uploaderId: session.user.id,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('POST /api/images/upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
