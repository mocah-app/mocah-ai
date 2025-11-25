'use client';

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { validateReactEmailCode } from '@/lib/react-email';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  className?: string;
  readOnly?: boolean;
  language?: string; // 'typescript', 'html', 'javascript', etc.
}

export function CodeEditor({
  code,
  onChange,
  onValidationChange,
  className = '',
  readOnly = false,
  language = 'typescript',
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Validate code on change
  useEffect(() => {
    if (!onValidationChange) return;

    const { isValid, errors } = validateReactEmailCode(code);
    onValidationChange(isValid, errors);
  }, [code, onValidationChange]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure editor
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly,
      tabSize: 2,
      wordWrap: 'on',
      automaticLayout: true,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className={`h-full w-full ${className}`}
    >
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  );
}

