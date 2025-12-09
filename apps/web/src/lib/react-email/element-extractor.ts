/**
 * Element Data Extractor
 * Extract element data from React Email JSX for editing
 */

import {
  parseJSX,
  findElementAtLine,
  extractTextContent,
  hasNestedFormatting,
  evaluateObjectExpression,
  getElementStyleProp,
  getElementClassName,
} from "./jsx-parser";

import {
  extractComputedStyles,
  mergeStyles,
  normalizeStyles,
} from "./computed-styles";

export interface ElementData {
  id: string;
  type:
    | "Heading"
    | "Text"
    | "Button"
    | "Img"
    | "Link"
    | "Section"
    | "Container"
    | "Row"
    | "Column"
    | "Html"
    | "Head"
    | "Body"
    | "Hr"
    | "Preview";
  line: number;
  content: string;
  hasNestedFormatting?: boolean; // NEW: Has nested JSX elements like <strong>, <Link>
  styleType: "inline" | "predefined-class" | "style-object";
  styleName?: string;
  inlineStyles?: React.CSSProperties;
  computedStyles?: React.CSSProperties; // Styles from DOM
  className?: string;
  attributes: Record<string, any>;
}

/**
 * Extract element data from a clicked element in the preview
 */
export function extractElementData(
  element: Element,
  reactEmailCode: string,
  styleDefinitions: Record<string, React.CSSProperties>
): ElementData {
  const elementId = element.getAttribute("data-element-id");

  if (!elementId) {
    throw new Error("Element does not have data-element-id attribute");
  }

  const [, type, lineStr] = elementId.split("-");
  const line = parseInt(lineStr);

  // Parse JSX to find element
  const ast = parseJSX(reactEmailCode);
  const elementNode: any = findElementAtLine(ast, line);

  if (!elementNode) {
    throw new Error(`Element not found at line ${line}`);
  }

  // Get the opening element (for attributes) and children (for content)
  const openingElement = elementNode.openingElement;
  const children = elementNode.children;

  // Determine style type
  let styleType: ElementData["styleType"] = "inline";
  let styleName: string | undefined;
  let inlineStyles: React.CSSProperties | undefined;
  let className: string | undefined;

  // Check for style prop
  const styleProp = getElementStyleProp(openingElement);

  if (styleProp?.type === "JSXExpressionContainer") {
    const expression = styleProp.expression;

    if (expression.type === "Identifier") {
      // Style object reference
      styleType = "style-object";
      styleName = expression.name;
    } else if (expression.type === "ObjectExpression") {
      // Inline style
      styleType = "inline";
      inlineStyles = evaluateObjectExpression(expression);
    }
  }

  // Check for className
  const classNameResult = getElementClassName(openingElement);
  if (classNameResult) {
    className = classNameResult;
    styleType = "predefined-class";
  }

  // Extract content from children
  const content = extractTextContent({ children });
  
  // NEW: Check if element has nested formatting
  const elementHasNestedFormatting = hasNestedFormatting({ children });

  // Extract other attributes
  const attributes: Record<string, any> = {};
  if (openingElement.attributes && Array.isArray(openingElement.attributes)) {
    openingElement.attributes.forEach((attr: any) => {
      const attrName = attr.name?.name;
      if (
        attrName &&
        !["style", "className", "data-element-id"].includes(attrName)
      ) {
        if (attr.value?.type === "StringLiteral") {
          attributes[attrName] = attr.value.value;
        } else if (attr.value?.type === "JSXExpressionContainer") {
          // Handle expression values
          if (attr.value.expression.type === "StringLiteral") {
            attributes[attrName] = attr.value.expression.value;
          } else if (attr.value.expression.type === "NumericLiteral") {
            attributes[attrName] = attr.value.expression.value;
          } else if (attr.value.expression.type === "BooleanLiteral") {
            attributes[attrName] = attr.value.expression.value;
          }
        }
      }
    });
  }

  // NEW: Extract computed styles from DOM element
  const computedStyles = extractComputedStyles(element);

  return {
    id: elementId,
    type: type as ElementData["type"],
    line,
    content,
    hasNestedFormatting: elementHasNestedFormatting, // NEW
    styleType,
    styleName,
    inlineStyles,
    computedStyles,
    className,
    attributes,
  };
}

/**
 * Get current styles for an element
 * Merges source styles (from code) with computed styles (from DOM)
 * Source styles take precedence for explicit values
 */
export function getCurrentStyles(
  elementData: ElementData,
  styleDefinitions: Record<string, React.CSSProperties>
): React.CSSProperties {
  // Get source styles (from JSX code)
  let sourceStyles: React.CSSProperties = {};
  
  if (elementData.styleType === "style-object" && elementData.styleName) {
    sourceStyles = styleDefinitions[elementData.styleName] || {};
  } else if (elementData.inlineStyles) {
    sourceStyles = elementData.inlineStyles;
  }

  // Get computed styles (from DOM)
  const computedStyles = elementData.computedStyles || {};

  // Merge: computed styles as base, source styles override
  // This ensures we show actual rendered values but preserve explicit code values
  return mergeStyles(
    normalizeStyles(sourceStyles),
    computedStyles
  );
}

/**
 * Check if element is editable
 */
export function isEditableElement(type: string): boolean {
  const editableTypes = ["Heading", "Text", "Button", "Link"];
  return editableTypes.includes(type);
}

/**
 * Check if element has text content
 */
export function hasTextContent(type: string): boolean {
  const textTypes = ["Heading", "Text", "Button", "Link"];
  return textTypes.includes(type);
}

/**
 * Check if element is a layout element
 */
export function isLayoutElement(type: string): boolean {
  const layoutTypes = ["Section", "Container", "Row", "Column"];
  return layoutTypes.includes(type);
}

/**
 * Get editable properties for element type
 */
export function getEditableProperties(type: string): string[] {
  const baseProperties = ["backgroundColor", "padding", "margin"];

  const typeProperties: Record<string, string[]> = {
    Heading: ["fontSize", "fontWeight", "color", "textAlign", "lineHeight"],
    Text: ["fontSize", "color", "textAlign", "lineHeight"],
    Button: [
      "fontSize",
      "color",
      "backgroundColor",
      "padding",
      "borderRadius",
      "textAlign",
    ],
    Link: ["fontSize", "color", "textDecoration"],
    Img: ["width", "height", "objectFit"],
    Section: [...baseProperties, "textAlign", "width"],
    Container: [...baseProperties, "maxWidth"],
    Row: [...baseProperties, "width"],
    Column: [...baseProperties, "width"],
  };

  return typeProperties[type] || baseProperties;
}
