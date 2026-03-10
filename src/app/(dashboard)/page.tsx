'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Card } from '@/components/ui/Card';

interface DashboardStats {
  articles: {
    total: number;
    draft: number;
    published: number;
    scheduled: number;
    archived: number;
  };
  categories: number;
  tags: number;
  images: number;
}

interface RecentArticle {
  id: string;
  title: string;
  status: string;
  author: string;
  category: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentArticles(data.recentArticles);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const statusLabels: Record<string, string> = {
    DRAFT: '下書き',
    PUBLISHED: '公開済み',
    SCHEDULED: '予約投稿',
    ARCHIVED: 'アーカイブ',
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-2">ようこそ、{session.user.name}さん</p>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">記事総数</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.articles.total}</p>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-gray-600">下書き: {stats.articles.draft}</p>
              <p className="text-xs text-gray-600">公開済み: {stats.articles.published}</p>
              <p className="text-xs text-gray-600">予約投稿: {stats.articles.scheduled}</p>
              <p className="text-xs text-gray-600">アーカイブ: {stats.articles.archived}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">カテゴリ</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.categories}</p>
            <Link href="/categories" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
              カテゴリ管理
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">タグ</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.tags}</p>
            <Link href="/tags" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
              タグ管理
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">画像</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.images}</p>
            <Link href="/images" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
              画像管理
            </Link>
          </Card>
        </div>
      )}

      {/* クイックアクション */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/articles/new')}>
            新規記事作成
          </Button>
          <Button onClick={() => router.push('/images')} variant="secondary">
            画像管理
          </Button>
          <Link href="/setup-2fa" className="inline-block">
            <Button variant="secondary">2FA設定</Button>
          </Link>
        </div>
      </div>

      {/* 最近の記事 */}
      {recentArticles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近の記事</h2>
          <Card>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      タイトル
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      著者
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentArticles.map((article) => (
                    <tr key={article.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {article.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {statusLabels[article.status] || article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {article.author}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          編集
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
