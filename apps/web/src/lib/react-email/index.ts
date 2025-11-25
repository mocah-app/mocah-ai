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
  extractStyleDefinitions,
  evaluateObjectExpression,
  findStyleDefinition,
  getElementStyleProp,
  getElementClassName,
} from '../jsx-parser';

// Element Extractor
export {
  extractElementData,
  getCurrentStyles,
  isEditableElement,
  hasTextContent,
  isLayoutElement,
  getEditableProperties,
} from '../element-extractor';
export type { ElementData } from '../element-extractor';

// Code Updater
export {
  updateReactEmailCode,
  convertInlineToStyleObject,
  convertStyleObjectToInline,
} from '../code-updater';
export type { ElementUpdates } from '../code-updater';

// React Email Renderer
export {
  renderReactEmail,
  renderReactEmailWithIds,
  convertToEmailHTML,
  convertToTableHTML,
  validateReactEmailCode,
  extractPreviewText,
  getEmailMetadata,
} from '../react-email-renderer';

// Example & Testing
export { exampleReactEmailCode, testRendering } from './example';

