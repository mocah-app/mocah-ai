"use client";

import { ReactEmailPreview } from "../view-mode/ReactEmailPreview";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useTemplate } from "../providers/TemplateProvider";
import { useErrorFix } from "../providers/ErrorFixProvider";
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
  const { state: templateState, actions: templateActions } = useTemplate();
  const { onRequestErrorFix } = useErrorFix();

  // Handle element selection in React Email templates
  const handleElementSelect = (elementData: ElementData | null) => {
    // Store element data as JSON string in EditorModeProvider
    if (elementData) {
      editorActions.selectElement(JSON.stringify(elementData));
    } else {
      editorActions.selectElement(null);
    }
  };

  // Handle validation error fix - uses the ErrorFixProvider to trigger chat
  const handleFixValidationError = (errorDetails: string, code: string) => {
    templateActions.clearValidationError();
    onRequestErrorFix(errorDetails, code);
  };

  // Handle dismissing validation error
  const handleDismissValidationError = () => {
    templateActions.clearValidationError();
  };

  return (
    <div className="w-full h-full overflow-hidden bg-background">
      <ReactEmailPreview 
        reactEmailCode={template.reactEmailCode || ""}
        styleDefinitions={template.styleDefinitions}
        enableSelection={editorState.designMode} // Only enable when design mode is active
        onElementSelect={handleElementSelect}
        renderKey={editorState.previewRenderKey} // Force re-render when this changes
        onRenderComplete={templateActions.onPreviewRenderComplete}
        validationError={templateState.validationError}
        onFixValidationError={handleFixValidationError}
        onDismissValidationError={handleDismissValidationError}
      />
    </div>
  );
}
