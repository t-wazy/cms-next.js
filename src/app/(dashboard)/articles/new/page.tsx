'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/article/ArticleForm';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { ArticleFormData } from '@/types/article';

export default function NewArticlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: ArticleFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '記事の作成に失敗しました');
      }

      router.push('/articles');
    } catch (error: any) {
      setError(error.message || '記事の作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">新規記事作成</h1>

      <Card>
        <ArticleForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>

      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
    </div>
  );
}
