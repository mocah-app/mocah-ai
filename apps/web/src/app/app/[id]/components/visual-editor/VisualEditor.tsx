// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { 
//   renderReactEmailWithIds, 
//   extractElementData,
//   RenderError,
//   RenderErrorCode,
// } from '@/lib/react-email';
// import type { ElementData } from '@/lib/react-email';
// import Loader from '@/components/loader';

// /** Map error codes to user-friendly messages */
// function getErrorMessage(error: unknown): string {
//   if (error instanceof RenderError) {
//     switch (error.code) {
//       case RenderErrorCode.TIMEOUT:
//         return "Preview took too long to render. Try simplifying your template.";
//       case RenderErrorCode.COMPONENT_NOT_FOUND:
//         return "No valid component found. Make sure you export a default function.";
//       case RenderErrorCode.BABEL_TRANSFORM_FAILED:
//         return "Syntax error in your code. Check for typos or invalid JSX.";
//       default:
//         return error.message;
//     }
//   }
//   return String(error);
// }

// interface VisualEditorProps {
//   reactEmailCode: string;
//   styleDefinitions: Record<string, React.CSSProperties>;
//   onElementSelect?: (elementData: ElementData | null) => void;
//   className?: string;
// }

// export function VisualEditor({
//   reactEmailCode,
//   styleDefinitions,
//   onElementSelect,
//   className = '',
// }: VisualEditorProps) {
//   const [html, setHtml] = useState('');
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const iframeRef = useRef<HTMLIFrameElement>(null);

//   // Render React Email JSX to HTML
//   useEffect(() => {
//     async function render() {
//       if (!reactEmailCode) {
//         setError('No React Email code provided');
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);
        
//         // Render with element IDs for selection
//         const renderedHtml = await renderReactEmailWithIds(reactEmailCode);
//         setHtml(renderedHtml);
//       } catch (err) {
//         console.error('Failed to render React Email:', err);
//         setError(getErrorMessage(err));
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     render();
//   }, [reactEmailCode]);

//   // Handle element clicks inside iframe
//   useEffect(() => {
//     const iframe = iframeRef.current;
//     if (!iframe || !html || !onElementSelect) return;

//     const handleIframeLoad = () => {
//       const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
//       if (!iframeDoc) return;

//       // Add click handler to iframe document
//       const handleClick = (e: MouseEvent) => {
//         e.preventDefault();
//         e.stopPropagation();

//         const target = e.target as HTMLElement;
        
//         // Find closest element with data-element-id
//         const element = target.closest('[data-element-id]');
        
//         if (element) {
//           try {
//             // Extract element data from JSX
//             const elementData = extractElementData(
//               element,
//               reactEmailCode,
//               styleDefinitions
//             );
            
//             // Highlight selected element
//             highlightElement(iframeDoc, element);
            
//             // Pass to parent
//             onElementSelect(elementData);
//           } catch (err) {
//             console.error('Failed to extract element data:', err);
//           }
//         } else {
//           // Click on non-selectable element - deselect
//           clearHighlight(iframeDoc);
//           onElementSelect(null);
//         }
//       };

//       iframeDoc.addEventListener('click', handleClick);

//       // Cleanup
//       return () => {
//         iframeDoc.removeEventListener('click', handleClick);
//       };
//     };

//     iframe.addEventListener('load', handleIframeLoad);

//     return () => {
//       iframe.removeEventListener('load', handleIframeLoad);
//     };
//   }, [html, reactEmailCode, styleDefinitions, onElementSelect]);

//   // Highlight selected element
//   function highlightElement(doc: Document, element: Element) {
//     // Clear previous highlights
//     clearHighlight(doc);

//     // Add highlight class
//     element.setAttribute('data-selected', 'true');
    
//     // Inject highlight styles if not already present
//     if (!doc.getElementById('mocah-highlight-styles')) {
//       const style = doc.createElement('style');
//       style.id = 'mocah-highlight-styles';
//       style.textContent = `
//         [data-selected="true"] {
//           outline: 2px solid #3b82f6 !important;
//           outline-offset: 2px !important;
//           cursor: pointer !important;
//         }
//         [data-element-id]:hover {
//           outline: 1px dashed #94a3b8 !important;
//           outline-offset: 1px !important;
//           cursor: pointer !important;
//         }
//       `;
//       doc.head.appendChild(style);
//     }
//   }

//   // Clear highlight
//   function clearHighlight(doc: Document) {
//     const selected = doc.querySelector('[data-selected="true"]');
//     if (selected) {
//       selected.removeAttribute('data-selected');
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className={`flex h-full items-center justify-center bg-muted/20 ${className}`}>
//        <Loader />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className={`flex h-full items-center justify-center bg-muted/20 ${className}`}>
//         <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
//           <p className="mb-2 font-semibold text-destructive">
//             Failed to render preview
//           </p>
//           <p className="text-sm text-destructive/80">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`relative h-full w-full overflow-hidden bg-muted/20 ${className}`}>
//       <iframe
//         ref={iframeRef}
//         srcDoc={html}
//         className="h-full w-full border-0"
//         title="Email Preview"
//         sandbox="allow-same-origin"
//       />
//     </div>
//   );
// }

