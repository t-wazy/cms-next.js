import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractImageIds } from '@/lib/utils/extract-image-ids';

// GET /api/articles/[id] - 記事詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    const formattedArticle = {
      ...article,
      tags: article.tags.map((at) => at.tag),
    };

    return NextResponse.json({ article: formattedArticle });
  } catch (error) {
    console.error('GET /api/articles/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] - 記事更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック: 自分の記事のみ編集可能（ADMIN/EDITORは全て編集可能）
    if (
      article.authorId !== session.user.id &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'EDITOR'
    ) {
      return NextResponse.json(
        { error: 'この記事を編集する権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, status, publishedAt, categoryId, tagIds } =
      body;

    // バリデーション
    if (title !== undefined) {
      if (title.trim().length === 0) {
        return NextResponse.json(
          { error: 'タイトルは必須です' },
          { status: 400 }
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          { error: 'タイトルは200文字以内で入力してください' },
          { status: 400 }
        );
      }
    }

    // contentがemptyかどうかチェック（TipTap JSON形式）
    if (content !== undefined) {
      if (!content || !content.content || content.content.length === 0) {
        return NextResponse.json(
          { error: '本文は必須です' },
          { status: 400 }
        );
      }
    }

    if (tagIds && tagIds.length > 10) {
      return NextResponse.json(
        { error: 'タグは最大10個まで選択できます' },
        { status: 400 }
      );
    }

    if (status === 'SCHEDULED' && !publishedAt && !article.publishedAt) {
      return NextResponse.json(
        { error: '予約投稿の場合、公開日時は必須です' },
        { status: 400 }
      );
    }

    // 更新データの準備
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) {
      updateData.content = content;
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    // publishedAtの処理
    if (status === 'PUBLISHED' && !article.publishedAt) {
      updateData.publishedAt = new Date();
    } else if (status === 'SCHEDULED' && publishedAt) {
      updateData.publishedAt = new Date(publishedAt);
    } else if (publishedAt !== undefined) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    }

    // トランザクションで記事とタグの更新
    const updatedArticle = await prisma.$transaction(async (tx) => {
      const updated = await tx.article.update({
        where: { id: id },
        data: updateData,
      });

      // タグの更新
      if (tagIds !== undefined) {
        // 既存のタグ関連を削除
        await tx.articleTag.deleteMany({
          where: { articleId: id },
        });

        // 新しいタグ関連を作成
        if (tagIds.length > 0) {
          await tx.articleTag.createMany({
            data: tagIds.map((tagId: string) => ({
              articleId: id,
              tagId,
            })),
          });
        }
      }

      // 画像の更新
      if (content !== undefined) {
        // 既存の画像関連を削除
        await tx.articleImage.deleteMany({
          where: { articleId: id },
        });

        // 新しい画像関連を作成
        const imageIds = extractImageIds(content);
        if (imageIds.length > 0) {
          await tx.articleImage.createMany({
            data: imageIds.map((imageId: string) => ({
              articleId: id,
              imageId,
            })),
          });
        }
      }

      // 更新後のデータをtagsを含めて取得
      const articleWithTags = await tx.article.findUnique({
        where: { id: id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return articleWithTags;
    });

    const formattedArticle = {
      ...updatedArticle,
      tags: updatedArticle?.tags.map((at) => at.tag) || [],
    };

    return NextResponse.json({ article: formattedArticle });
  } catch (error) {
    console.error('PUT /api/articles/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - 記事削除
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

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json(
        { error: '記事が見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック: EDITOR または ADMIN のみ削除可能
    if (session.user.role !== 'EDITOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '記事を削除する権限がありません' },
        { status: 403 }
      );
    }

    // 記事削除（Cascade設定により、ArticleTagも自動削除される）
    await prisma.article.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: '記事を削除しました' });
  } catch (error) {
    console.error('DELETE /api/articles/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
