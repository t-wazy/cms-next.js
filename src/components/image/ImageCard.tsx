'use client';

import { Image as ImageType } from '@/types/image';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

interface ImageCardProps {
  image: ImageType;
  selected?: boolean;
  onSelect?: (image: ImageType) => void;
  onDelete?: (imageId: string) => void;
  showDelete?: boolean;
}

export function ImageCard({
  image,
  selected = false,
  onSelect,
  onDelete,
  showDelete = false,
}: ImageCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      className={clsx(
        'border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow cursor-pointer',
        selected && 'ring-2 ring-blue-500'
      )}
      onClick={() => onSelect?.(image)}
    >
      <div className="relative aspect-video bg-gray-100">
        <img
          src={image.filePath}
          alt={image.alt || image.fileName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate" title={image.fileName}>
          {image.fileName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {image.width} × {image.height} • {formatFileSize(image.fileSize)}
        </p>
        {image.alt && (
          <p className="text-xs text-gray-600 mt-1 truncate" title={image.alt}>
            {image.alt}
          </p>
        )}
        {showDelete && onDelete && (
          <div className="mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              className="w-full px-3 py-1.5 text-sm rounded font-medium text-red-600 bg-gray-100 hover:bg-red-50 transition-colors"
            >
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
