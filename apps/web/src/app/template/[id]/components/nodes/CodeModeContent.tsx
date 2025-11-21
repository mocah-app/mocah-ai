"use client";

import React, { useState } from "react";
import { Code2, FileCode } from "lucide-react";

interface CodeModeContentProps {
  template: {
    subject?: string;
    previewText?: string;
    content: string;
  };
}

export function CodeModeContent({ template }: CodeModeContentProps) {
  const [activeTab, setActiveTab] = useState<"react" | "html">("react");

  return (
    <div className="h-full flex flex-col">
      {/* Tab Selector */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("react")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "react"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Code2 className="w-4 h-4" />
          React
        </button>
        <button
          onClick={() => setActiveTab("html")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "html"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <FileCode className="w-4 h-4" />
          HTML
        </button>
      </div>

      {/* Code Editor Placeholder */}
      <div className="flex-1 p-8">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center h-full flex flex-col items-center justify-center">
          {activeTab === "react" ? (
            <>
              <Code2 className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                React Email Code
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Monaco editor will be integrated here
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Coming in Day 2: Editable React Email JSX with syntax highlighting
              </p>
            </>
          ) : (
            <>
              <FileCode className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                HTML Code
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Monaco editor will be integrated here
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Coming in Day 2: Editable HTML with syntax highlighting
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
