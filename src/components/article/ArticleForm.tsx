'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ArticleEditor } from '@/components/article/ArticleEditor';
import { ArticleFormData, ArticleStatus } from '@/types/article';

interface ArticleFormProps {
  initialData?: Partial<ArticleFormData>;
  isEdit?: boolean;
  onSubmit: (data: ArticleFormData) => Promise<void>;
  isLoading: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

const emptyContent = {
  type: 'doc',
  content: [],
};

export function ArticleForm({
  initialData,
  isEdit = false,
  onSubmit,
  isLoading,
}: ArticleFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState<object>(initialData?.content || emptyContent);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [status, setStatus] = useState<ArticleStatus>(
    initialData?.status || 'DRAFT'
  );
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt || ''
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tagIds || []
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // カテゴリとタグの取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags'),
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories and tags:', error);
      }
    };

    fetchData();
  }, []);

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        if (prev.length >= 10) {
          setErrors((e) => ({ ...e, tags: 'タグは最大10個まで選択できます' }));
          return prev;
        }
        setErrors((e) => ({ ...e, tags: '' }));
        return [...prev, tagId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // クライアント側バリデーション
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (title.length > 200) {
      newErrors.title = 'タイトルは200文字以内で入力してください';
    }

    // contentがemptyかどうかチェック
    const contentStr = JSON.stringify(content);
    const isEmptyContent = contentStr === JSON.stringify(emptyContent) ||
                          !content ||
                          (content as any).content?.length === 0;
    if (isEmptyContent) {
      newErrors.content = '本文は必須です';
    }

    if (!categoryId) {
      newErrors.categoryId = 'カテゴリは必須です';
    }

    if (selectedTagIds.length > 10) {
      newErrors.tags = 'タグは最大10個まで選択できます';
    }

    if (status === 'SCHEDULED' && !publishedAt) {
      newErrors.publishedAt = '予約投稿の場合、公開日時は必須です';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({
      title,
      content,
      excerpt,
      status,
      publishedAt,
      categoryId,
      tagIds: selectedTagIds,
    });
  };

  const statusOptions = [
    { value: 'DRAFT', label: '下書き' },
    { value: 'PUBLISHED', label: '公開' },
    { value: 'SCHEDULED', label: '予約投稿' },
    { value: 'ARCHIVED', label: 'アーカイブ' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="タイトル"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="記事のタイトルを入力"
        required
        error={errors.title}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          本文<span className="text-red-500 ml-1">*</span>
        </label>
        <ArticleEditor content={content} onChange={setContent} />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500">{errors.content}</p>
        )}
      </div>

      <Textarea
        label="リード文"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="記事のリード文を入力（任意）"
        rows={3}
        error={errors.excerpt}
      />

      <Select
        label="カテゴリ"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categories.map((cat) => ({
          value: cat.id,
          label: cat.name,
        }))}
        required
        error={errors.categoryId}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          タグ（最大10個）
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => handleTagToggle(tag.id)}
                className="rounded"
              />
              <span className="text-sm">{tag.name}</span>
            </label>
          ))}
        </div>
        {errors.tags && (
          <p className="mt-1 text-sm text-red-500">{errors.tags}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          選択中: {selectedTagIds.length}/10
        </p>
      </div>

      <Select
        label="ステータス"
        value={status}
        onChange={(e) => setStatus(e.target.value as ArticleStatus)}
        options={statusOptions}
        required
      />

      {status === 'SCHEDULED' && (
        <Input
          label="公開日時"
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          required
          error={errors.publishedAt}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? '保存中...' : isEdit ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  );
}
