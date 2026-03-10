import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 記事統計（ステータス別）
    const [
      draftCount,
      publishedCount,
      scheduledCount,
      archivedCount,
      categoryCount,
      tagCount,
      imageCount,
      recentArticles,
    ] = await Promise.all([
      prisma.article.count({ where: { status: 'DRAFT' } }),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.article.count({ where: { status: 'SCHEDULED' } }),
      prisma.article.count({ where: { status: 'ARCHIVED' } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.image.count(),
      prisma.article.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
    ]);

    const totalArticles = draftCount + publishedCount + scheduledCount + archivedCount;

    return NextResponse.json({
      stats: {
        articles: {
          total: totalArticles,
          draft: draftCount,
          published: publishedCount,
          scheduled: scheduledCount,
          archived: archivedCount,
        },
        categories: categoryCount,
        tags: tagCount,
        images: imageCount,
      },
      recentArticles: recentArticles.map((article) => ({
        id: article.id,
        title: article.title,
        status: article.status,
        author: article.author.name,
        category: article.category.name,
        createdAt: article.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
