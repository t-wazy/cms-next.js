'use client';

import { Editor } from '@tiptap/react';
import clsx from 'clsx';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const ButtonItem = ({
    onClick,
    isActive,
    children,
  }: {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors',
        isActive && 'bg-gray-200 font-bold'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b p-2 flex gap-1 flex-wrap bg-gray-50">
      <ButtonItem
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        太字
      </ButtonItem>
      <ButtonItem
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        斜体
      </ButtonItem>
      <div className="w-px bg-gray-300 mx-1" />
      <ButtonItem
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      >
        H1
      </ButtonItem>
      <ButtonItem
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        H2
      </ButtonItem>
      <ButtonItem
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      >
        H3
      </ButtonItem>
      <div className="w-px bg-gray-300 mx-1" />
      <ButtonItem
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      >
        箇条書き
      </ButtonItem>
      <ButtonItem
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      >
        番号付き
      </ButtonItem>
      <ButtonItem
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
      >
        引用
      </ButtonItem>
    </div>
  );
}
