'use client';

import { useState, useEffect } from 'react';
import { X, Code2, Eye, Type, Palette, Layout } from 'lucide-react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import {
  getCurrentStyles,
  isEditableElement,
  hasTextContent,
  getEditableProperties,
} from '@/lib/react-email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ReactEmailEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  elementData: ElementData | null;
  styleDefinitions: Record<string, React.CSSProperties>;
  onElementUpdate: (updates: ElementUpdates) => void;
}

export function ReactEmailEditorPanel({
  isOpen,
  onClose,
  elementData,
  styleDefinitions,
  onElementUpdate,
}: ReactEmailEditorPanelProps) {
  const [updates, setUpdates] = useState<ElementUpdates>({});
  const [currentStyles, setCurrentStyles] = useState<React.CSSProperties>({});

  // Load current styles when element changes
  useEffect(() => {
    if (elementData) {
      const styles = getCurrentStyles(elementData, styleDefinitions);
      setCurrentStyles(styles);
      setUpdates({});
    }
  }, [elementData, styleDefinitions]);

  const handleStyleChange = (property: string, value: string) => {
    setUpdates((prev) => ({
      ...prev,
      styles: {
        ...prev.styles,
        [property]: value,
      },
    }));
  };

  const handleContentChange = (content: string) => {
    setUpdates((prev) => ({
      ...prev,
      content,
    }));
  };

  const handleAttributeChange = (key: string, value: string) => {
    setUpdates((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value,
      },
    }));
  };

  const handleApply = () => {
    if (Object.keys(updates).length > 0) {
      onElementUpdate(updates);
      setUpdates({});
    }
  };

  const handleReset = () => {
    setUpdates({});
  };

  if (!isOpen) return null;

  if (!elementData) {
    return (
      <div className="fixed right-0 top-0 z-50 flex h-screen w-96 flex-col border-l bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Smart Editor</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 text-center text-muted-foreground">
          <div>
            <Eye className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm">Select an element to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const editableProps = getEditableProperties(elementData.type);
  const canEdit = isEditableElement(elementData.type);
  const hasText = hasTextContent(elementData.type);

  return (
    <div className="flex h-screen w-96 flex-col border-l bg-background shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Smart Editor</h2>
          <Badge variant="secondary" className="text-xs">
            {elementData.type}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!canEdit ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            <Layout className="mx-auto mb-2 h-8 w-8" />
            <p>This is a layout element. It cannot be directly edited.</p>
          </div>
        ) : (
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">
                <Type className="mr-1 h-3 w-3" />
                Content
              </TabsTrigger>
              <TabsTrigger value="styles">
                <Palette className="mr-1 h-3 w-3" />
                Styles
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <Code2 className="mr-1 h-3 w-3" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              {hasText && (
                <div className="space-y-2">
                  <Label htmlFor="content">Text Content</Label>
                  <textarea
                    id="content"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={updates.content ?? elementData.content ?? ''}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Enter text content..."
                  />
                </div>
              )}

              {elementData.type === 'Button' && (
                <div className="space-y-2">
                  <Label htmlFor="href">Link URL</Label>
                  <Input
                    id="href"
                    type="url"
                    value={updates.attributes?.href ?? elementData.attributes?.href ?? ''}
                    onChange={(e) => handleAttributeChange('href', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {elementData.type === 'Link' && (
                <div className="space-y-2">
                  <Label htmlFor="href">Link URL</Label>
                  <Input
                    id="href"
                    type="url"
                    value={updates.attributes?.href ?? elementData.attributes?.href ?? ''}
                    onChange={(e) => handleAttributeChange('href', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {elementData.type === 'Img' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="src">Image URL</Label>
                    <Input
                      id="src"
                      type="url"
                      value={updates.attributes?.src ?? elementData.attributes?.src ?? ''}
                      onChange={(e) => handleAttributeChange('src', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alt">Alt Text</Label>
                    <Input
                      id="alt"
                      type="text"
                      value={updates.attributes?.alt ?? elementData.attributes?.alt ?? ''}
                      onChange={(e) => handleAttributeChange('alt', e.target.value)}
                      placeholder="Image description"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Styles Tab */}
            <TabsContent value="styles" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Style Type: {elementData.styleType || 'inline'}
                </Label>
                {elementData.styleName && (
                  <Badge variant="outline" className="text-xs">
                    Using: {elementData.styleName}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Common style properties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fontSize" className="text-xs">
                    Font Size
                  </Label>
                  <Input
                    id="fontSize"
                    type="text"
                    value={updates.styles?.fontSize ?? currentStyles.fontSize ?? ''}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    placeholder="16px"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fontWeight" className="text-xs">
                    Font Weight
                  </Label>
                  <Input
                    id="fontWeight"
                    type="text"
                    value={updates.styles?.fontWeight ?? currentStyles.fontWeight ?? ''}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                    placeholder="400"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="color" className="text-xs">
                    Text Color
                  </Label>
                  <Input
                    id="color"
                    type="text"
                    value={updates.styles?.color ?? currentStyles.color ?? ''}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    placeholder="#000000"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="backgroundColor" className="text-xs">
                    Background
                  </Label>
                  <Input
                    id="backgroundColor"
                    type="text"
                    value={
                      updates.styles?.backgroundColor ?? currentStyles.backgroundColor ?? ''
                    }
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="padding" className="text-xs">
                    Padding
                  </Label>
                  <Input
                    id="padding"
                    type="text"
                    value={updates.styles?.padding ?? currentStyles.padding ?? ''}
                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                    placeholder="20px"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="margin" className="text-xs">
                    Margin
                  </Label>
                  <Input
                    id="margin"
                    type="text"
                    value={updates.styles?.margin ?? currentStyles.margin ?? ''}
                    onChange={(e) => handleStyleChange('margin', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="borderRadius" className="text-xs">
                    Border Radius
                  </Label>
                  <Input
                    id="borderRadius"
                    type="text"
                    value={updates.styles?.borderRadius ?? currentStyles.borderRadius ?? ''}
                    onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                    placeholder="4px"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="textAlign" className="text-xs">
                    Text Align
                  </Label>
                  <Input
                    id="textAlign"
                    type="text"
                    value={updates.styles?.textAlign ?? currentStyles.textAlign ?? ''}
                    onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                    placeholder="left"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <div className="space-y-1">
                  <p>
                    <strong>Element:</strong> {elementData.type}
                  </p>
                  <p>
                    <strong>Line:</strong> {elementData.line}
                  </p>
                  <p>
                    <strong>ID:</strong> {elementData.id}
                  </p>
                  {elementData.styleName && (
                    <p>
                      <strong>Style Object:</strong> {elementData.styleName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Current Styles (Read-only)</Label>
                <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(currentStyles, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Footer */}
      {canEdit && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              className="flex-1"
              disabled={Object.keys(updates).length === 0}
            >
              Apply Changes
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={Object.keys(updates).length === 0}
            >
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

