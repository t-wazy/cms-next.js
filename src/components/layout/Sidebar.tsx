'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: '記事', href: '/articles', icon: '📝' },
  { label: '画像', href: '/images', icon: '🖼️' },
  { label: '分類', href: '/categories', icon: '📁' },
  { label: 'タグ', href: '/tags', icon: '🏷️' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg',
        'transform transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* ヘッダー（モバイルのみ） */}
      <div className="flex items-center justify-between p-4 border-b md:hidden">
        <span className="font-bold text-lg">メニュー</span>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-gray-100"
          aria-label="メニューを閉じる"
        >
          ✕
        </button>
      </div>

      {/* メニュー項目 */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onClose()}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
