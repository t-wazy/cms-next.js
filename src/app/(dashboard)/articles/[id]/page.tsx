'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArticleForm } from '@/components/article/ArticleForm';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Toast } from '@/components/ui/Toast';
import { ArticleFormData } from '@/types/article';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const [initialData, setInitialData] = useState<Partial<ArticleFormData> | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 既存記事の取得
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`);

        if (!res.ok) {
          throw new Error('記事の取得に失敗しました');
        }

        const data = await res.json();
        const article = data.article;

        // TipTap JSONからプレーンテキストを抽出
        // フォーム用のデータに変換
        setInitialData({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt || '',
          status: article.status,
          publishedAt: article.publishedAt
            ? new Date(article.publishedAt).toISOString().slice(0, 16)
            : '',
          categoryId: article.categoryId,
          tagIds: article.tags.map((tag: any) => tag.id),
        });
      } catch (error: any) {
        setError(error.message || '記事の取得に失敗しました');
      } finally {
        setIsLoadingArticle(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const handleSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '記事の更新に失敗しました');
      }

      router.push('/articles');
    } catch (error: any) {
      setError(error.message || '記事の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        <Card>
          <p className="text-center text-red-500">記事が見つかりません</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">記事編集</h1>

      <Card>
        <ArticleForm
          initialData={initialData}
          isEdit
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Card>

      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
    </div>
  );
}
