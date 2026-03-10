import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractImageIds } from '@/lib/utils/extract-image-ids';

// GET /api/articles - 記事一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.categoryId = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.title = {
        contains: search,
      };
    }

    if (tag) {
      where.tags = {
        some: {
          tagId: tag,
        },
      };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
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
      }),
      prisma.article.count({ where }),
    ]);

    const formattedArticles = articles.map((article) => ({
      ...article,
      tags: article.tags.map((at) => at.tag),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/articles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/articles - 記事作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, status, publishedAt, categoryId, tagIds } =
      body;

    // バリデーション
    if (!title || title.trim().length === 0) {
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

    // contentがemptyかどうかチェック（TipTap JSON形式）
    if (!content || !content.content || content.content.length === 0) {
      return NextResponse.json(
        { error: '本文は必須です' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'カテゴリは必須です' },
        { status: 400 }
      );
    }

    if (tagIds && tagIds.length > 10) {
      return NextResponse.json(
        { error: 'タグは最大10個まで選択できます' },
        { status: 400 }
      );
    }

    if (status === 'SCHEDULED' && !publishedAt) {
      return NextResponse.json(
        { error: '予約投稿の場合、公開日時は必須です' },
        { status: 400 }
      );
    }

    // publishedAtの処理
    let finalPublishedAt = null;
    if (status === 'PUBLISHED') {
      finalPublishedAt = new Date();
    } else if (status === 'SCHEDULED' && publishedAt) {
      finalPublishedAt = new Date(publishedAt);
    }

    // トランザクションで記事とタグの関連を作成
    const article = await prisma.$transaction(async (tx) => {
      const createdArticle = await tx.article.create({
        data: {
          title,
          content: content,
          excerpt: excerpt || null,
          status,
          publishedAt: finalPublishedAt,
          authorId: session.user.id,
          categoryId,
        },
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
        },
      });

      // タグの関連付け
      if (tagIds && tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: tagIds.map((tagId: string) => ({
            articleId: createdArticle.id,
            tagId,
          })),
        });
      }

      // 画像の関連付け
      const imageIds = extractImageIds(content);
      if (imageIds.length > 0) {
        await tx.articleImage.createMany({
          data: imageIds.map((imageId: string) => ({
            articleId: createdArticle.id,
            imageId,
          })),
        });
      }

      // タグ情報を含めて返す
      const articleWithTags = await tx.article.findUnique({
        where: { id: createdArticle.id },
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
      ...article,
      tags: article?.tags.map((at) => at.tag) || [],
    };

    return NextResponse.json({ article: formattedArticle }, { status: 201 });
  } catch (error) {
    console.error('POST /api/articles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
