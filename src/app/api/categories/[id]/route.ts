import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/categories/[id] - カテゴリ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 権限チェック: EDITOR または ADMIN のみ更新可能
    if (session.user.role !== 'EDITOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'カテゴリを更新する権限がありません' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'カテゴリが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, slug, description, displayOrder } = body;

    // バリデーション
    if (name !== undefined) {
      if (name.trim().length === 0) {
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
    }

    if (slug !== undefined && slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'スラッグは必須です' },
        { status: 400 }
      );
    }

    // スラッグの重複チェック（自分以外）
    if (slug !== undefined && slug !== category.slug) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'このスラッグは既に使用されています' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description || null;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error('PUT /api/categories/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - カテゴリ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 権限チェック: EDITOR または ADMIN のみ削除可能
    if (session.user.role !== 'EDITOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'カテゴリを削除する権限がありません' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'カテゴリが見つかりません' },
        { status: 404 }
      );
    }

    // 使用中チェック
    const articlesCount = await prisma.article.count({
      where: { categoryId: id },
    });

    if (articlesCount > 0) {
      return NextResponse.json(
        {
          error: 'CATEGORY_IN_USE',
          message: `このカテゴリは${articlesCount}件の記事で使用されています`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'カテゴリを削除しました' });
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
