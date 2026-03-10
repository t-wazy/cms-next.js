import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/categories - カテゴリ一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/categories - カテゴリ作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 権限チェック: EDITOR または ADMIN のみ作成可能
    if (session.user.role !== 'EDITOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'カテゴリを作成する権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, description, displayOrder } = body;

    // バリデーション
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'カテゴリ名は必須です' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'カテゴリ名は100文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'スラッグは必須です' },
        { status: 400 }
      );
    }

    // スラッグの重複チェック
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'このスラッグは既に使用されています' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        displayOrder: displayOrder ?? 0,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
