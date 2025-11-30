import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodePreviewProps {
  code: string;
  maxLines?: number;
  language?: string;
}

export const CodePreview = ({ 
  code, 
  maxLines = 12, 
  language = "tsx" 
}: CodePreviewProps) => {
  const lines = code.split("\n");
  const previewLines = lines.slice(0, maxLines);

  return (
    <div className="relative group">
      <div className="bg-card rounded-md overflow-hidden border border-border">
        {/* Header with language badge */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">
              {language}
            </span>
            <div className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </span>
          </div>
          
        </div>

        {/* Code content with syntax highlighting */}
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "12px",
            background: "var(--background)",
            fontSize: "12px",
            lineHeight: "1.5",
            maxHeight: "150px",
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2em",

            paddingRight: "1em",
            color: "var(--muted-foreground)",
            textAlign: "right",
            userSelect: "none",
          }}
          wrapLines={true}
        >
          {previewLines.join("\n")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

