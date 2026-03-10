import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/tags/[id] - タグ更新
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
        { error: 'タグを更新する権限がありません' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'タグが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, slug } = body;

    // バリデーション
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json(
          { error: 'タグ名は必須です' },
          { status: 400 }
        );
      }
      if (name.length > 50) {
        return NextResponse.json(
          { error: 'タグ名は50文字以内で入力してください' },
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
    if (slug !== undefined && slug !== tag.slug) {
      const existingTag = await prisma.tag.findUnique({
        where: { slug },
      });

      if (existingTag) {
        return NextResponse.json(
          { error: 'このスラッグは既に使用されています' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tag: updatedTag });
  } catch (error) {
    console.error('PUT /api/tags/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id] - タグ削除
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
        { error: 'タグを削除する権限がありません' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'タグが見つかりません' },
        { status: 404 }
      );
    }

    // 使用中チェック
    const articlesCount = await prisma.articleTag.count({
      where: { tagId: id },
    });

    if (articlesCount > 0) {
      return NextResponse.json(
        {
          error: 'TAG_IN_USE',
          message: `このタグは${articlesCount}件の記事で使用されています`,
        },
        { status: 409 }
      );
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'タグを削除しました' });
  } catch (error) {
    console.error('DELETE /api/tags/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
