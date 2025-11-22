export type SectionType =
  | "header"
  | "hero"
  | "text"
  | "button"
  | "image"
  | "footer"
  | "cta"
  | "product_grid"
  | "testimonial";

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

export interface SectionStyles {
  backgroundColor?: string;
  padding?: string;
  backgroundImage?: string;
  textColor?: string;
  [key: string]: any;
}

// Flat structure for now, matching AI output
export interface EmailSection {
  id?: string; // Optional as AI might not generate it immediately
  type: SectionType;
  styles?: SectionStyles;

  // Content fields
  headline?: string;
  subheadline?: string;
  body?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  imageAlt?: string;

  // For future nested structure
  elements?: any[];

  [key: string]: any;
}

export interface TemplateData {
  subject?: string;
  previewText?: string;
  content?: string;
  sections: EmailSection[];
}
