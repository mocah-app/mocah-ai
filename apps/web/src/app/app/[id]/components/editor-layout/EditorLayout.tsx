'use client';

import { useState } from 'react';
import { VisualEditor } from '../visual-editor/VisualEditor';
import { CodeEditor } from '../code-editor/CodeEditor';
import { ReactEmailEditorPanel } from '../smart-editor/ReactEmailEditorPanel';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import { updateReactEmailCode } from '@/lib/react-email';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code2 } from 'lucide-react';

interface EditorLayoutProps {
  reactEmailCode: string;
  styleDefinitions: Record<string, React.CSSProperties>;
  onCodeChange: (code: string, styleDefinitions: Record<string, React.CSSProperties>) => void;
  className?: string;
}

export function EditorLayout({
  reactEmailCode,
  styleDefinitions,
  onCodeChange,
  className = '',
}: EditorLayoutProps) {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');

  const handleElementSelect = (elementData: ElementData | null) => {
    setSelectedElement(elementData);
  };

  const handleElementUpdate = (updates: ElementUpdates) => {
    if (!selectedElement) return;

    try {
      // Update the React Email code
      const { updatedCode, updatedStyleDefinitions } = updateReactEmailCode(
        reactEmailCode,
        selectedElement,
        updates,
        styleDefinitions
      );

      // Pass updated code to parent
      onCodeChange(updatedCode, updatedStyleDefinitions);

      // Keep element selected with updated data
      // The element data will be refreshed on next render
    } catch (error) {
      console.error('Failed to update element:', error);
    }
  };

  const handleCodeChange = (code: string) => {
    onCodeChange(code, styleDefinitions);
    // Clear selection when code is manually edited
    setSelectedElement(null);
  };

  return (
    <div className={`flex h-full w-full overflow-hidden ${className}`}>
      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Tabs 
          value={editorMode} 
          onValueChange={(v) => setEditorMode(v as 'visual' | 'code')}
          className="flex h-full flex-col"
        >
          <TabsList className="w-full justify-start rounded-none border-b shrink-0">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="mt-0 flex-1 overflow-hidden">
            <VisualEditor
              reactEmailCode={reactEmailCode}
              styleDefinitions={styleDefinitions}
              onElementSelect={handleElementSelect}
              className="h-full w-full"
            />
          </TabsContent>

          <TabsContent value="code" className="mt-0 flex-1 overflow-hidden">
            <CodeEditor 
              code={reactEmailCode} 
              onChange={handleCodeChange}
              className="h-full w-full"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Smart Editor Panel */}
      <ReactEmailEditorPanel
        isOpen={selectedElement !== null}
        onClose={() => setSelectedElement(null)}
        elementData={selectedElement}
        styleDefinitions={styleDefinitions}
        onElementUpdate={handleElementUpdate}
      />
    </div>
  );
}

