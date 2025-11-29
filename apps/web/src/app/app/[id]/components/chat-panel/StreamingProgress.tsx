import { Code2, FileText, Type } from "lucide-react";
import { CodePreview } from "./CodePreview";

interface StreamingProgressProps {
  progress: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleType?: string;
  };
  isComplete?: boolean;
}

export const StreamingProgress = ({
  progress,
  isComplete = false,
}: StreamingProgressProps) => {
  const sections = [
    {
      key: "subject",
      label: "Subject Line",
      icon: Type,
      value: progress.subject,
      color: "text-blue-400",
    },
    {
      key: "previewText",
      label: "Preview Text",
      icon: FileText,
      value: progress.previewText,
      color: "text-purple-400",
    },
    {
      key: "reactEmailCode",
      label: "React Email Code",
      icon: Code2,
      value: progress.reactEmailCode,
      color: "text-green-400",
      isCode: true,
    },
  ];

  const completedSections = sections.filter((s) => s.value);
  const currentSection = completedSections[completedSections.length - 1];

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        {sections.map((section) => {
          const isCompleted = !!section.value;
          const isCurrent = currentSection?.key === section.key;
          const Icon = section.icon;

          if (!isCompleted) return null;

          return (
            <div
              key={section.key}
              className={`space-y-2 transition-all duration-300 ${
                isCurrent && !isComplete ? "animate-in slide-in-from-bottom-2" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {section.label}
                </span>
                {/* Show bouncing dots only while streaming, checkmark when complete */}
                {isCurrent && !isComplete && (
                  <div className="flex gap-1 ml-auto">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-1 h-1 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                )}
                {isComplete && (
                  <span className="text-xs text-green-500 ml-auto">✓</span>
                )}
              </div>

              {section.isCode && section.value ? (
                <CodePreview code={section.value} />
              ) : (
                <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                  <p className="text-sm leading-relaxed">{section.value}</p>
                </div>
              )}

              {section.key === "reactEmailCode" && section.value && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{section.value.split("\n").length} lines</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>{(section.value.length / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

