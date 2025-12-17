/**
 * Version History Types
 * Type definitions for the version history system
 */


/**
 * Template snapshot for version creation
 */
export interface TemplateSnapshot {
  reactEmailCode: string | null;
  styleDefinitions: Record<string, React.CSSProperties>;
  subject: string | null;
  previewText: string | null;
  htmlCode?: string | null;
}

/**
 * Version creation options
 */
export interface CreateVersionOptions {
  changeNote?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Version switching options
 */
export interface SwitchVersionOptions {
  warnOnUnsavedChanges?: boolean;
}
