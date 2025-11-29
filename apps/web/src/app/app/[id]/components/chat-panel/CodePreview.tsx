import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const previewLines = lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="bg-[#1e1e1e] rounded-md overflow-hidden border border-gray-800">
        {/* Header with language badge and copy button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#252526]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 uppercase">
              {language}
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-500">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-xs text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </Button>
        </div>

        {/* Code content with syntax highlighting */}
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "12px",
            background: "#1e1e1e",
            fontSize: "12px",
            lineHeight: "1.5",
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "#858585",
            textAlign: "right",
            userSelect: "none",
          }}
          wrapLines={true}
        >
          {previewLines.join("\n")}
        </SyntaxHighlighter>

        {/* "More lines" indicator */}
        {hasMore && (
          <div className="px-4 py-2 text-xs text-gray-500 font-mono border-t border-gray-800 bg-[#252526]">
            <span className="text-gray-600">...</span> {lines.length - maxLines} more lines
          </div>
        )}
      </div>
    </div>
  );
};

