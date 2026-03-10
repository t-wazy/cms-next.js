import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// DELETE /api/images/[id] - 画像削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 画像の存在確認
    const image = await prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      return NextResponse.json(
        { error: '画像が見つかりません' },
        { status: 404 }
      );
    }

    // 使用中チェック
    const usedInArticles = await prisma.articleImage.findMany({
      where: { imageId: id },
      include: {
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (usedInArticles.length > 0) {
      return NextResponse.json(
        {
          error: 'IMAGE_IN_USE',
          message: 'この画像は以下の記事で使用されています',
          details: {
            articles: usedInArticles.map((ai) => ai.article),
          },
        },
        { status: 409 }
      );
    }

    // 画像削除（DB + ファイル）
    await prisma.image.delete({
      where: { id },
    });

    // 物理ファイル削除
    try {
      const physicalPath = path.join(process.cwd(), 'public', image.filePath);
      await fs.unlink(physicalPath);
    } catch (fileError) {
      console.error('Failed to delete physical file:', fileError);
      // ファイル削除失敗してもDBからは削除済みなので続行
    }

    return NextResponse.json({ message: '画像を削除しました' });
  } catch (error) {
    console.error('DELETE /api/images/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
