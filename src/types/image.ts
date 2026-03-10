export interface Image {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  alt: string | null;
  caption: string | null;
  uploaderId: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface ImageUploadResponse {
  image: Image;
}

export interface ImageListResponse {
  images: Image[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImageInUseError {
  error: 'IMAGE_IN_USE';
  message: string;
  details: {
    articles: Array<{
      id: string;
      title: string;
    }>;
  };
}
