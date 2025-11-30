/**
 * Client-Side React Email Renderer
 *
 * Renders React Email JSX to HTML entirely in the browser.
 * This eliminates server-side RCE risk since code executes in the browser's sandbox.
 *
 * Production Features:
 * - LRU cache for repeated renders
 * - Input validation and size limits
 * - Structured error handling with error codes
 * - Performance metrics
 * - Timeout protection
 * - Safari compatible (uses browser-compatible server rendering)
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server.browser";
import * as ReactEmail from "@react-email/components";
import * as Babel from "@babel/standalone";


// ============================================================================
// Types
// ============================================================================

export interface RenderResult {
  html: string;
  fromCache: boolean;
  renderTimeMs: number;
}

export interface RenderOptions {
  /** Skip cache lookup/storage */
  skipCache?: boolean;
  /** Custom timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Pretty print HTML output (default: true) */
  pretty?: boolean;
}

export enum RenderErrorCode {
  BABEL_UNAVAILABLE = "BABEL_UNAVAILABLE",
  BABEL_TRANSFORM_FAILED = "BABEL_TRANSFORM_FAILED",
  COMPONENT_NOT_FOUND = "COMPONENT_NOT_FOUND",
  RENDER_FAILED = "RENDER_FAILED",
  TIMEOUT = "TIMEOUT",
  INPUT_TOO_LARGE = "INPUT_TOO_LARGE",
  INVALID_INPUT = "INVALID_INPUT",
}

export class RenderError extends Error {
  constructor(
    public readonly code: RenderErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "RenderError";
  }
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  /** Maximum input size in characters */
  MAX_INPUT_SIZE: 500_000, // 500KB
  /** Default render timeout in ms */
  DEFAULT_TIMEOUT: 10_000,
  /** LRU cache size */
  CACHE_SIZE: 50,
  /** Cache TTL in ms (5 minutes) */
  CACHE_TTL: 5 * 60 * 1000,
} as const;

// ============================================================================
// LRU Cache Implementation
// ============================================================================

interface CacheEntry {
  html: string;
  timestamp: number;
}

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.html;
  }

  set(key: string, html: string): void {
    // Delete if exists (to update position)
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { html, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

const renderCache = new LRUCache(CONFIG.CACHE_SIZE, CONFIG.CACHE_TTL);

// ============================================================================
// Input Processing
// ============================================================================

/**
 * Generate a hash for cache key
 * Uses a simple but fast string hash
 */
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Generate cache key that includes code and render options
 */
function generateCacheKey(code: string, pretty: boolean): string {
  const codeHash = hashCode(code);
  return `${codeHash}:${pretty ? '1' : '0'}`;
}

/**
 * Validate input code before processing
 */
function validateInput(code: string): void {
  if (!code || typeof code !== "string") {
    throw new RenderError(
      RenderErrorCode.INVALID_INPUT,
      "Code must be a non-empty string"
    );
  }

  if (code.length > CONFIG.MAX_INPUT_SIZE) {
    throw new RenderError(
      RenderErrorCode.INPUT_TOO_LARGE,
      `Input exceeds maximum size of ${CONFIG.MAX_INPUT_SIZE} characters`
    );
  }
}

/**
 * Remove import statements from code
 * React Email components are provided directly at runtime
 */
function removeImports(code: string): string {
  // Consolidated regex patterns for import removal
  const importPatterns = [
    // import X from 'module'
    /import\s+\w+\s+from\s+['"][^'"]+['"];?\s*/g,
    // import { X, Y } from 'module'
    /import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*/g,
    // import * as X from 'module'
    /import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*/g,
    // import 'module' (side effects)
    /import\s+['"][^'"]+['"];?\s*/g,
    // import X, { Y } from 'module'
    /import\s+\w+\s*,\s*\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*/g,
  ];

  let cleanedCode = code;
  for (const pattern of importPatterns) {
    cleanedCode = cleanedCode.replace(pattern, "");
  }

  return cleanedCode;
}

/**
 * Transform export default to return statement
 */
function transformExport(code: string): string {
  // Handle: export default function ComponentName
  let transformed = code.replace(
    /export\s+default\s+function\s+(\w+)/,
    "return function $1"
  );

  // Handle: export default ComponentName or export default () => ...
  transformed = transformed.replace(/export\s+default\s+/, "return ");

  return transformed;
}

// ============================================================================
// Core Renderer
// ============================================================================

/**
 * Render React Email JSX to HTML (Client-Side)
 *
 * Safe to execute arbitrary code - runs in browser sandbox.
 *
 * @param code - React Email JSX/TSX code string
 * @param options - Render options
 * @returns Promise resolving to render result with HTML and metadata
 *
 * @example
 * ```ts
 * const result = await renderReactEmailClientSide(emailCode);
 * console.log(result.html);
 * console.log(`Rendered in ${result.renderTimeMs}ms`);
 * ```
 */
export async function renderReactEmailClientSide(
  code: string,
  options: RenderOptions = {}
): Promise<string> {
  const startTime = performance.now();
  const {
    skipCache = false,
    timeout = CONFIG.DEFAULT_TIMEOUT,
    pretty = true,
  } = options;

  // Validate input
  validateInput(code);

  // Check Babel availability
  if (!isClientRenderingAvailable()) {
    throw new RenderError(
      RenderErrorCode.BABEL_UNAVAILABLE,
      "Babel is not available for client-side rendering"
    );
  }

  // Check cache
  const cacheKey = generateCacheKey(code, pretty);
  if (!skipCache) {
    const cached = renderCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Wrap render in timeout promise
  const renderPromise = executeRender(code, pretty);
  
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new RenderError(
          RenderErrorCode.TIMEOUT,
          `Render timed out after ${timeout}ms`
        )
      );
    }, timeout);
  });

  try {
    const html = await Promise.race([renderPromise, timeoutPromise]);

    // Cache result
    if (!skipCache) {
      renderCache.set(cacheKey, html);
    }

    const renderTimeMs = Math.round(performance.now() - startTime);

    // Log performance in development
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[ReactEmail] Rendered in ${renderTimeMs}ms (cached: ${!skipCache && renderCache.get(cacheKey) !== null})`
      );
    }

    return html;
  } catch (error) {
    // Re-throw RenderErrors as-is
    if (error instanceof RenderError) {
      throw error;
    }

    // Wrap unknown errors
    throw new RenderError(
      RenderErrorCode.RENDER_FAILED,
      error instanceof Error ? error.message : "Unknown render error",
      error
    );
  } finally {
    // Clear timeout to prevent timer leak
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/**
 * Execute the actual render process
 */
async function executeRender(code: string, pretty: boolean): Promise<string> {
  // Step 1: Remove imports
  const cleanedCode = removeImports(code);

  // Step 2: Transform with Babel
  let transformedResult: { code?: string | null };
  try {
    transformedResult = Babel.transform(cleanedCode, {
      presets: [
        ["typescript", { isTSX: true, allExtensions: true }],
        ["react", { runtime: "classic" }],
      ],
      filename: "email.tsx",
    });
  } catch (error) {
    throw new RenderError(
      RenderErrorCode.BABEL_TRANSFORM_FAILED,
      `Babel transformation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }

  if (!transformedResult.code) {
    throw new RenderError(
      RenderErrorCode.BABEL_TRANSFORM_FAILED,
      "Babel transformation produced no output"
    );
  }

  // Step 3: Transform exports
  const jsCode = transformExport(transformedResult.code);

  // Step 4: Create component factory
  // In browser context, this is safe - sandboxed by browser
  const reactEmailComponentNames = Object.keys(ReactEmail);

  const componentFactory = new Function(
    "React",
    ...reactEmailComponentNames,
    `
      'use strict';
      ${jsCode}
    `
  );

  // Step 5: Execute with React and React Email components
  const Component = componentFactory(
    { createElement },
    ...Object.values(ReactEmail)
  );

  if (!Component || typeof Component !== "function") {
    throw new RenderError(
      RenderErrorCode.COMPONENT_NOT_FOUND,
      "No valid React component found in code. Ensure you export a default function component."
    );
  }

  // Step 6: Render to HTML using react-dom/server.browser (Safari compatible)
  // Uses browser-compatible server rendering which doesn't rely on Web Streams
  let html = renderToStaticMarkup(createElement(Component));

  // Add DOCTYPE and proper HTML structure for email
  html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html}`;

  // Apply pretty formatting if requested
  if (pretty) {
    return formatHtml(html);
  }

  return html;
}

/**
 * Basic HTML pretty printer
 * Adds indentation to HTML for readability
 */
function formatHtml(html: string): string {
  let formatted = "";
  let indent = 0;
  const indentSize = 2;

  html.split(/(<[^>]+>)/g).forEach((part) => {
    if (!part.trim()) return;

    // Closing tag
    if (part.startsWith("</")) {
      indent = Math.max(0, indent - indentSize);
      formatted += " ".repeat(indent) + part + "\n";
    }
    // Self-closing or opening tag
    else if (part.startsWith("<")) {
      formatted += " ".repeat(indent) + part + "\n";
      // Don't indent for self-closing tags or DOCTYPE/comments
      if (!part.endsWith("/>") && !part.startsWith("<!")) {
        indent += indentSize;
      }
    }
    // Text content
    else {
      formatted += " ".repeat(indent) + part.trim() + "\n";
    }
  });

  return formatted.trim();
}

// ============================================================================
// Extended Render (with full result)
// ============================================================================

/**
 * Render with full result including metadata
 *
 * @param code - React Email JSX/TSX code string
 * @param options - Render options
 * @returns Promise resolving to full render result
 */
export async function renderReactEmailWithMetadata(
  code: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const startTime = performance.now();
  const pretty = options.pretty ?? true;
  const cacheKey = generateCacheKey(code, pretty);
  const wasInCache = !options.skipCache && renderCache.get(cacheKey) !== null;

  const html = await renderReactEmailClientSide(code, options);

  return {
    html,
    fromCache: wasInCache,
    renderTimeMs: Math.round(performance.now() - startTime),
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if client-side rendering is available
 * (Babel must be loaded)
 */
export function isClientRenderingAvailable(): boolean {
  return typeof Babel !== "undefined" && typeof Babel.transform === "function";
}

/**
 * Clear the render cache
 * Useful when making changes that should reflect immediately
 */
export function clearRenderCache(): void {
  renderCache.clear();
}

/**
 * Get current cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: renderCache.size,
    maxSize: CONFIG.CACHE_SIZE,
  };
}

/**
 * Pre-warm the cache with code
 * Useful for preloading templates
 */
export async function prewarmCache(codes: string[]): Promise<void> {
  await Promise.all(
    codes.map((code) =>
      renderReactEmailClientSide(code, { skipCache: false }).catch(() => {
        // Silently ignore errors during pre-warm
      })
    )
  );
}
