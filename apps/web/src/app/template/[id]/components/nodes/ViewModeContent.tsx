import { EmailPreview } from "../view-mode/EmailPreview";

interface ViewModeContentProps {
  template: {
    subject?: string;
    previewText?: string;
    sections: any[];
  };
}

export function ViewModeContent({ template }: ViewModeContentProps) {
  return (
    <div className="w-full h-full overflow-hidden bg-background">
      <EmailPreview template={template} />
    </div>
  );
}
