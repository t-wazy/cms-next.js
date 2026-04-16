// prisma/seed.ts
import { PrismaClient, UserRole, ArticleStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 既にシードデータが存在する場合はスキップ
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.jp' },
  });
  if (existingAdmin) {
    console.log('シードデータは既に存在します。スキップします。');
    return;
  }

  // ユーザー作成
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: '管理者',
      email: 'admin@example.jp',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const editor = await prisma.user.create({
    data: {
      name: '編集者',
      email: 'editor@example.jp',
      passwordHash,
      role: UserRole.EDITOR,
    },
  });

  const reporter = await prisma.user.create({
    data: {
      name: '記者',
      email: 'reporter@example.jp',
      passwordHash,
      role: UserRole.REPORTER,
    },
  });

  // カテゴリ作成
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: '政治', slug: 'politics', displayOrder: 1 },
    }),
    prisma.category.create({
      data: { name: '経済', slug: 'economy', displayOrder: 2 },
    }),
    prisma.category.create({
      data: { name: 'スポーツ', slug: 'sports', displayOrder: 3 },
    }),
    prisma.category.create({
      data: { name: '地域ニュース', slug: 'local-news', displayOrder: 4 },
    }),
    prisma.category.create({
      data: { name: '文化', slug: 'culture', displayOrder: 5 },
    }),
  ]);

  // タグ作成
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: '十勝', slug: 'tokachi' } }),
    prisma.tag.create({ data: { name: '帯広', slug: 'obihiro' } }),
    prisma.tag.create({ data: { name: '農業', slug: 'agriculture' } }),
    prisma.tag.create({ data: { name: 'イベント', slug: 'event' } }),
    prisma.tag.create({ data: { name: 'インタビュー', slug: 'interview' } }),
  ]);

  // サンプル記事作成
  const articles = await Promise.all([
    // 下書き
    prisma.article.create({
      data: {
        title: '【下書き】十勝の農業について',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'これは下書き記事です。' }],
            },
          ],
        },
        excerpt: '十勝の農業についての記事',
        status: ArticleStatus.DRAFT,
        authorId: reporter.id,
        categoryId: categories[3].id,
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[2].id },
          ],
        },
      },
    }),
    // 公開済み
    prisma.article.create({
      data: {
        title: '帯広市で夏祭り開催',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '帯広市で夏祭りが開催されました。' },
              ],
            },
          ],
        },
        excerpt: '帯広市で夏祭りが開催',
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date('2026-03-01'),
        authorId: editor.id,
        categoryId: categories[3].id,
        tags: {
          create: [
            { tagId: tags[1].id },
            { tagId: tags[3].id },
          ],
        },
      },
    }),
    // 予約投稿
    prisma.article.create({
      data: {
        title: '【予約】十勝の経済動向',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'これは予約投稿記事です。' }],
            },
          ],
        },
        excerpt: '十勝の経済動向についての分析',
        status: ArticleStatus.SCHEDULED,
        publishedAt: new Date('2026-12-31'),
        authorId: reporter.id,
        categoryId: categories[1].id,
        tags: {
          create: [{ tagId: tags[0].id }],
        },
      },
    }),
  ]);

  console.log('シードデータ投入完了');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
