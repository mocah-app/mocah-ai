"use client";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TemplatePreviewProps {
  htmlCode: string | null | undefined;
  className?: string;
}

/**
 * TemplatePreview component renders a scaled-down preview of email HTML
 * Uses lazy loading with Intersection Observer for performance
 */
export function TemplatePreview({
  htmlCode,
  className = "",
}: TemplatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading slightly before visible
        threshold: 0,
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Load HTML into iframe when visible
  useEffect(() => {
    if (!isVisible || !htmlCode || !iframeRef.current) return;

    const iframe = iframeRef.current;

    // Make all elements non-interactive and non-focusable after load
    const handleLoad = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Inject CSS to disable interactions
      const style = iframeDoc.createElement("style");
      style.textContent = `
        * {
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        a, button, input, textarea, select, [tabindex] {
          tabindex: -1 !important;
        }
      `;
      iframeDoc.head.appendChild(style);

      // Prevent focus on all elements
      iframeDoc.addEventListener("focusin", (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, true);

      setIsLoading(false);
    };

    iframe.onload = handleLoad;

    // Fallback timeout
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      iframe.onload = null;
      clearTimeout(timeout);
    };
  }, [isVisible, htmlCode]);

  // Show placeholder if no HTML code
  if (!htmlCode) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center w-full h-48 bg-primary/10 bg-dot opacity-25 ${className}`}
      >
        <span className="text-muted-foreground text-xl font-light">No preview</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-48 overflow-hidden bg-white border border-border/50 rounded-t-lg ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Skeleton className="h-full w-full" />
        </div>
      )}
      {isVisible && (
        <div className="w-full h-full overflow-hidden" tabIndex={-1} aria-hidden="true">
          <iframe
            ref={iframeRef}
            className="border-0 pointer-events-none"
            style={{
              transform: "scale(1.1)",
              // transformOrigin: "top top",
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="Template preview"
            sandbox="allow-same-origin"
            loading="lazy"
            tabIndex={-1}
            aria-hidden="true"
            inert
            srcDoc={htmlCode}
          />
        </div>
      )}
    </div>
  );
}