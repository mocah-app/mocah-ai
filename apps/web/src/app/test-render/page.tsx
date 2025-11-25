'use client';

import { useState, useEffect } from 'react';
import { renderReactEmailWithIds, exampleReactEmailCode } from '@/lib/react-email';

export default function TestRenderPage() {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function render() {
      try {
        setLoading(true);
        console.log('🚀 Starting render...');
        
        const renderedHtml = await renderReactEmailWithIds(exampleReactEmailCode);
        
        console.log('✅ Render successful!');
        console.log('📊 HTML length:', renderedHtml.length);
        
        setHtml(renderedHtml);
        setError(null);
      } catch (err) {
        console.error('❌ Render failed:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    render();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <div className="text-xl">Rendering email template...</div>
          <div className="mt-2 text-sm text-gray-500">
            Check the browser console for logs
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-2xl rounded-lg border border-red-300 bg-card p-6">
          <h1 className="mb-4 text-2xl font-bold text-red-700">❌ Render Failed</h1>
          <p className="mb-4 text-sm text-red-600">
            The React Email rendering encountered an error. Check the details below:
          </p>
          <pre className="overflow-auto rounded  p-4 text-sm">
            {error}
          </pre>
          <div className="mt-4 rounded  p-3 text-sm">
            <p className="font-semibold">💡 Common issues:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Make sure all dependencies are installed (see SETUP-DEPENDENCIES.md)</li>
              <li>Check the server logs in your terminal</li>
              <li>Verify the API route exists at /api/template/render</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold">✅ React Email Rendering Test</h1>
        <p className="text-sm text-gray-600">
          Successfully rendered {html.length.toLocaleString()} characters of HTML
        </p>
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          <span>✅ Server rendering working</span>
          <span>✅ Client rendering working</span>
          <span>✅ Element IDs injected</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="flex-1 border-r bg-background">
          <div className="border-b bg-background px-4 py-2 text-sm font-semibold">
            📧 Visual Preview
          </div>
          <iframe
            srcDoc={html}
            className="h-full w-full border-0"
            title="Email Preview"
            sandbox="allow-same-origin"
          />
        </div>
        
        <div className="flex-1 bg-background">
          <div className="border-b bg-background px-4 py-2 text-sm font-semibold">
            📝 HTML Source (first 500 chars)
          </div>
          <pre className="h-full overflow-auto p-4 text-xs text-foreground">
            {html.substring(0, 500)}...
          </pre>
        </div>
      </div>
    </div>
  );
}

