"use client";

import { ReactEmailPreview } from "../view-mode/ReactEmailPreview";
import { useEditorMode } from "../providers/EditorModeProvider";
import type { ElementData } from "@/lib/react-email";

interface ViewModeContentProps {
  template: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleDefinitions?: Record<string, React.CSSProperties>;
  };
}

export function ViewModeContent({ template }: ViewModeContentProps) {
  const { state: editorState, actions: editorActions } = useEditorMode();

  // Handle element selection in React Email templates
  const handleElementSelect = (elementData: ElementData | null) => {
    // Store element data as JSON string in EditorModeProvider
    if (elementData) {
      editorActions.selectElement(JSON.stringify(elementData));
    } else {
      editorActions.selectElement(null);
    }
  };

  return (
    <div className="w-full h-full overflow-hidden bg-background">
      <ReactEmailPreview 
        reactEmailCode={template.reactEmailCode || ""}
        styleDefinitions={template.styleDefinitions}
        enableSelection={editorState.designMode} // Only enable when design mode is active
        onElementSelect={handleElementSelect}
        renderKey={editorState.previewRenderKey} // Force re-render when this changes
      />
    </div>
  );
}
