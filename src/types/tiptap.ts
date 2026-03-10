import { Editor } from '@tiptap/react';

export interface TipTapEditorProps {
  content?: object;
  onChange: (content: object) => void;
  editable?: boolean;
}

export interface ToolbarButtonProps {
  editor: Editor;
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}
