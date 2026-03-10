'use client';

import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  onLogout: () => void;
}

export function Header({ onMenuClick, userName, onLogout }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        {/* 左側: ハンバーガーメニュー + ロゴ */}
        <div className="flex items-center gap-3">
          {/* ハンバーガーメニュー（モバイルのみ） */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded hover:bg-gray-100 transition-colors"
            aria-label="メニューを開く"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* ロゴ */}
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            勝毎CMS
          </h1>
        </div>

        {/* 右側: ユーザー情報 + ログアウト */}
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-xs md:text-sm text-gray-700">
            {userName || 'ユーザー'}
          </span>
          <Button onClick={onLogout} variant="secondary" size="sm">
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
