'use client';

import { Image as ImageType } from '@/types/image';
import { ImageCard } from './ImageCard';
import { Loading } from '@/components/ui/Loading';

interface ImageGalleryProps {
  images: ImageType[];
  selectedId?: string;
  onSelect?: (image: ImageType) => void;
  onDelete?: (imageId: string) => void;
  showDelete?: boolean;
  isLoading?: boolean;
}

export function ImageGallery({
  images,
  selectedId,
  onSelect,
  onDelete,
  showDelete = false,
  isLoading = false,
}: ImageGalleryProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">画像がありません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          selected={selectedId === image.id}
          onSelect={onSelect}
          onDelete={onDelete}
          showDelete={showDelete}
        />
      ))}
    </div>
  );
}
