// React Email template types

export interface ElementStyles {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  padding?: string;
  margin?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
  [key: string]: any;
}

export type StyleType = "INLINE" | "PREDEFINED_CLASSES" | "STYLE_OBJECTS";

export interface ReactEmailTemplate {
  id: string;
  name: string;
  subject?: string;
  previewText?: string;
  reactEmailCode: string;
  styleType: StyleType;
  styleDefinitions?: Record<string, React.CSSProperties>;
  htmlCode?: string;
  tableHtmlCode?: string;
}

export interface TemplateData {
  subject?: string;
  previewText?: string;
  reactEmailCode?: string;
  styleType?: StyleType;
  styleDefinitions?: Record<string, React.CSSProperties>;
}
