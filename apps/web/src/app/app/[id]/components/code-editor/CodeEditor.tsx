'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import { validateReactEmailCode } from '@/lib/react-email';
import Loader from '@/components/loader';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[], warnings?: string[]) => void;
  className?: string;
  readOnly?: boolean;
  language?: string; // 'typescript', 'html', 'javascript', etc.
}

export interface CodeEditorRef {
  scrollToLine: (line: number) => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(function CodeEditor({
  code,
  onChange,
  onValidationChange,
  className = '',
  readOnly = false,
  language = 'typescript',
}, ref) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Expose scrollToLine method via ref
  useImperativeHandle(ref, () => ({
    scrollToLine: (line: number) => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(line);
        editorRef.current.setPosition({ lineNumber: line, column: 1 });
        editorRef.current.focus();
      }
    },
  }), []);

  // Configure Monaco TypeScript settings
  useEffect(() => {
    loader.init().then((monaco) => {
      // Configure TypeScript compiler options for TSX files
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
        jsxFactory: 'React.createElement',
        jsxFragmentFactory: 'React.Fragment',
        reactNamespace: 'React',
        allowNonTsExtensions: true,
        allowJs: true,
        target: monaco.languages.typescript.ScriptTarget.Latest,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noSemanticValidation: false,
        noSyntaxValidation: false,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        lib: ['es2020', 'dom'],
      });

      // Reduce diagnostic severity - only show real errors, not missing type definitions
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        diagnosticCodesToIgnore: [
          2304, // Cannot find name
          2552, // Cannot find name, did you mean
          2307, // Cannot find module
          2345, // Argument of type X is not assignable to parameter of type Y
          2583, // Cannot find name 'X'. Do you need to install type definitions?
          2686, // 'X' refers to a UMD global, but the current file is a module
          2792, // Cannot find module 'X'. Did you mean to set the 'moduleResolution' option?
          6133, // Variable is declared but never read
          7006, // Parameter implicitly has an 'any' type
          7016, // Could not find a declaration file for module
          17004, // Cannot use JSX unless the '--jsx' flag is provided
          2354, // This JSX tag requires the module path 'react/jsx-runtime' to exist
        ],
      });
    });
  }, []);

  // Validate code on change
  useEffect(() => {
    if (!onValidationChange) return;

    const { isValid, errors, warnings } = validateReactEmailCode(code);
    onValidationChange(isValid, errors, warnings);
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
    <div className={`h-full w-full ${className}`}>
      <Editor
        height="100%"
        defaultLanguage="typescript"
        language="typescript"
        path="email-template.tsx"
        value={code}
        loading={<div className="flex h-full items-center justify-center bg-background"><Loader /></div>}
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
});

