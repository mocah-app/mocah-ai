/**
 * React Email Utilities
 * Central export for all React Email JSX utilities
 */

// JSX Parser
export {
  parseJSX,
  generateCode,
  injectElementIds,
  findElementAtLine,
  extractTextContent,
  hasNestedFormatting,
  extractStyleDefinitions,
  evaluateObjectExpression,
  findStyleDefinition,
  getElementStyleProp,
  getElementClassName,
} from './jsx-parser';

// Element Extractor
export {
  extractElementData,
  getCurrentStyles,
  isEditableElement,
  hasTextContent,
  isLayoutElement,
  getEditableProperties,
} from './element-extractor';
export type { ElementData } from './element-extractor';

// Computed Styles
export {
  extractComputedStyles,
  normalizeStyles,
  mergeStyles,
  isScaleValue,
} from './computed-styles';

// Code Updater
export {
  updateReactEmailCode,
  convertInlineToStyleObject,
  convertStyleObjectToInline,
} from './code-updater';
export type { ElementUpdates } from './code-updater';

// React Email Renderer (client-side only)
export {
  renderReactEmail,
  renderReactEmailWithIds,
  convertToEmailHTML,
  convertToTableHTML,
  validateReactEmailCode,
  extractPreviewText,
  getEmailMetadata,
  clearCache,
} from './react-email-renderer';

// Client-Side Renderer
export {
  renderReactEmailClientSide,
  renderReactEmailWithMetadata,
  isClientRenderingAvailable,
  clearRenderCache,
  getCacheStats,
  prewarmCache,
  RenderError,
  RenderErrorCode,
} from './client-renderer';
export type { RenderResult, RenderOptions } from './client-renderer';
