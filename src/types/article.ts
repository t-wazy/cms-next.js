export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

export interface Article {
  id: string;
  title: string;
  content: object;
  excerpt: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  authorId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
}

export interface ArticleFormData {
  title: string;
  content: object;
  excerpt: string;
  status: ArticleStatus;
  publishedAt: string;
  categoryId: string;
  tagIds: string[];
}

export interface ArticleListResponse {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// TipTap JSON形式からプレーンテキストを抽出するユーティリティ
export const extractTextFromTipTapContent = (content: any): string => {
  if (!content?.content) return '';
  return content.content
    .map((node: any) => {
      if (node.type === 'paragraph' && node.content) {
        return node.content.map((c: any) => c.text || '').join('');
      }
      return '';
    })
    .join('\n');
};
