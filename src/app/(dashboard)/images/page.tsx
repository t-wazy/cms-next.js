'use client';

import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/image/ImageUpload';
import { ImageGallery } from '@/components/image/ImageGallery';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { Image as ImageType } from '@/types/image';

export default function ImagesPage() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchImages = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/images?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(currentPage);
  }, [currentPage]);

  const handleUploadSuccess = () => {
    setSuccessMessage('画像をアップロードしました');
    fetchImages(1); // 1ページ目に戻る
    setCurrentPage(1);
  };

  const handleDeleteClick = (imageId: string) => {
    setSelectedImageId(imageId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedImageId) return;

    try {
      const res = await fetch(`/api/images/${selectedImageId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'IMAGE_IN_USE') {
          const articleTitles = data.details.articles
            .map((a: any) => a.title)
            .join('、');
          setError(
            `この画像は以下の記事で使用されています: ${articleTitles}`
          );
        } else {
          setError(data.error || '削除に失敗しました');
        }
      } else {
        setSuccessMessage('画像を削除しました');
        fetchImages(currentPage);
      }
    } catch (error) {
      setError('削除に失敗しました');
    } finally {
      setDeleteModalOpen(false);
      setSelectedImageId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">画像管理</h1>
        <p className="text-gray-600 mt-2">画像のアップロードと管理</p>
      </div>

      <ImageUpload onUploadSuccess={handleUploadSuccess} />

      <ImageGallery
        images={images}
        isLoading={isLoading}
        showDelete={true}
        onDelete={handleDeleteClick}
      />

      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="画像を削除"
        onConfirm={handleDeleteConfirm}
        confirmText="削除"
        cancelText="キャンセル"
      >
        <p>この画像を削除してもよろしいですか？</p>
        <p className="text-sm text-gray-500 mt-2">
          この操作は取り消せません。
        </p>
      </Modal>

      {error && (
        <Toast message={error} type="error" onClose={() => setError('')} />
      )}

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage('')}
        />
      )}
    </div>
  );
}
