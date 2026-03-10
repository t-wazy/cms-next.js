'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { ImagePicker } from '@/components/image/ImagePicker';
import { CustomImage } from '@/lib/tiptap/image-node';
import { useEffect, useState } from 'react';

interface ArticleEditorProps {
  content?: object;
  onChange: (content: object) => void;
}

export function ArticleEditor({ content, onChange }: ArticleEditorProps) {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, CustomImage],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror p-4 min-h-[400px] focus:outline-none',
      },
    },
  });

  // contentが外部から変更された場合に更新
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageSelect = (imageId: string, src: string, alt: string, width: number, height: number) => {
    if (editor) {
      editor.chain().focus().setImage({ imageId, src, alt, width, height }).run();
    }
  };

  if (!editor) {
    return <div className="border rounded-lg p-4 bg-gray-50">エディタ読み込み中...</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <EditorToolbar editor={editor} />
      <div className="border-b px-2 py-1 bg-gray-50">
        <button
          type="button"
          onClick={() => setIsImagePickerOpen(true)}
          className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
        >
          🖼️ 画像挿入
        </button>
      </div>
      <EditorContent editor={editor} />

      <ImagePicker
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
