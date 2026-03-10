'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'error', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`px-6 py-4 rounded-lg shadow-lg ${
          type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
