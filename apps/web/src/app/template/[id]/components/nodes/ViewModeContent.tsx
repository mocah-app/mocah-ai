"use client";

import React from "react";
import { Mail } from "lucide-react";

interface ViewModeContentProps {
  template: {
    subject?: string;
    previewText?: string;
    content: string;
  };
}

export function ViewModeContent({ template }: ViewModeContentProps) {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Email Subject */}
        {template.subject && (
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Subject
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {template.subject}
            </p>
          </div>
        )}

        {/* Preview Text */}
        {template.previewText && (
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Preview Text
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {template.previewText}
            </p>
          </div>
        )}

        {/* Email Preview Placeholder */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
          <Mail className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Email Preview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Visual email preview will be rendered here
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Coming in Day 2: Element-level editing with click-to-edit
          </p>
        </div>

        {/* Placeholder for sections */}
        <div className="mt-6 space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📧 Header Section
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🎨 Hero Section
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📝 Content Section
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🔗 Footer Section
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
