import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/images - 画像一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        skip,
        take: limit,
        orderBy: {
          uploadedAt: 'desc',
        },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          mimeType: true,
          fileSize: true,
          width: true,
          height: true,
          alt: true,
          caption: true,
          uploaderId: true,
          uploadedAt: true,
          updatedAt: true,
        },
      }),
      prisma.image.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/images error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
