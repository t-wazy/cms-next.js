'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ImageGallery } from './ImageGallery';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Image as ImageType } from '@/types/image';
import { Loading } from '@/components/ui/Loading';

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageId: string, src: string, alt: string, width: number, height: number) => void;
}

export function ImagePicker({ isOpen, onClose, onSelect }: ImagePickerProps) {
  const [images, setImages] = useState<ImageType[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [altText, setAltText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/images?limit=50');
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (image: ImageType) => {
    setSelectedImage(image);
    setAltText(image.alt || image.fileName);
  };

  const handleInsert = () => {
    if (selectedImage) {
      onSelect(
        selectedImage.id,
        selectedImage.filePath,
        altText,
        selectedImage.width,
        selectedImage.height
      );
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setAltText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="画像を選択"
      onConfirm={handleInsert}
      confirmText="挿入"
      cancelText="キャンセル"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loading size="lg" />
          </div>
        ) : (
          <>
            <ImageGallery
              images={images}
              selectedId={selectedImage?.id}
              onSelect={handleImageSelect}
              isLoading={false}
            />

            {selectedImage && (
              <div className="border-t pt-4">
                <Input
                  label="代替テキスト (alt)"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="画像の説明を入力"
                />
                <p className="text-xs text-gray-500 mt-1">
                  選択した画像: {selectedImage.fileName}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
