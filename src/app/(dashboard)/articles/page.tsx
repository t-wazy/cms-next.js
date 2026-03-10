'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loading } from '@/components/ui/Loading';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { Article } from '@/types/article';
import { extractTextFromTipTapContent } from '@/types/article';

function ArticlesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  // カテゴリの取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // 記事一覧の取得
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '20');
        if (search) params.set('search', search);
        if (categoryFilter) params.set('category', categoryFilter);
        if (statusFilter) params.set('status', statusFilter);

        const res = await fetch(`/api/articles?${params.toString()}`);

        if (!res.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data = await res.json();
        setArticles(data.articles);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setError('記事の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [page, search, categoryFilter, statusFilter]);

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const res = await fetch(`/api/articles/${articleToDelete}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '削除に失敗しました');
      }

      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete));
      setDeleteModalOpen(false);
      setArticleToDelete(null);
    } catch (error: any) {
      setError(error.message || '削除に失敗しました');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: '下書き',
      PUBLISHED: '公開',
      SCHEDULED: '予約投稿',
      ARCHIVED: 'アーカイブ',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-800',
      PUBLISHED: 'bg-green-200 text-green-800',
      SCHEDULED: 'bg-blue-200 text-blue-800',
      ARCHIVED: 'bg-red-200 text-red-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const canDelete = session?.user.role === 'EDITOR' || session?.user.role === 'ADMIN';

  const canEdit = (article: Article) => {
    return (
      article.authorId === session?.user.id ||
      session?.user.role === 'EDITOR' ||
      session?.user.role === 'ADMIN'
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">記事一覧</h1>
        <Link href="/articles/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      {/* フィルタ・検索 */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="検索"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="タイトルで検索"
          />

          <Select
            label="カテゴリ"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
          />

          <Select
            label="ステータス"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'DRAFT', label: '下書き' },
              { value: 'PUBLISHED', label: '公開' },
              { value: 'SCHEDULED', label: '予約投稿' },
              { value: 'ARCHIVED', label: 'アーカイブ' },
            ]}
          />
        </div>
      </Card>

      {/* ローディング */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      )}

      {/* エラー */}
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}

      {/* 記事一覧 */}
      {!isLoading && articles.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">記事が見つかりません</p>
        </Card>
      )}

      {!isLoading && articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{article.title}</h2>
                    <span
                      className={`px-2 py-1 text-xs rounded ${getStatusColor(
                        article.status
                      )}`}
                    >
                      {getStatusLabel(article.status)}
                    </span>
                  </div>

                  {article.excerpt && (
                    <p className="text-gray-600 mb-2 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-sm text-gray-500">
                      カテゴリ: {article.category.name}
                    </span>
                    {article.tags.length > 0 && (
                      <span className="text-sm text-gray-500">
                        タグ: {article.tags.map((t) => t.name).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400">
                    作成者: {article.author.name} |{' '}
                    {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {canEdit(article) && (
                    <Link href={`/articles/${article.id}`}>
                      <Button size="sm" variant="secondary">
                        編集
                      </Button>
                    </Link>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setArticleToDelete(article.id);
                        setDeleteModalOpen(true);
                      }}
                    >
                      削除
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {!isLoading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* 削除確認モーダル */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setArticleToDelete(null);
        }}
        title="記事を削除"
        onConfirm={handleDelete}
        confirmText="削除"
        cancelText="キャンセル"
      >
        <p>この記事を削除してもよろしいですか？</p>
        <p className="text-sm text-gray-500 mt-2">
          この操作は取り消すことができません。
        </p>
      </Modal>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="p-8"><Loading size="lg" /></div>}>
      <ArticlesList />
    </Suspense>
  );
}
