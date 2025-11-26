/**
 * Code Updater
 * Update React Email JSX code with element changes
 */

import { 
  parseJSX, 
  generateCode, 
  findElementAtLine,
  findStyleDefinition,
  evaluateObjectExpression
} from './jsx-parser';
import type { ElementData } from './element-extractor';
import * as t from '@babel/types';
import traverse from '@babel/traverse';

export interface ElementUpdates {
  content?: string;
  styles?: Record<string, any>;
  attributes?: Record<string, any>;
}

/**
 * Update React Email code with element changes
 */
export function updateReactEmailCode(
  originalCode: string,
  elementData: ElementData,
  updates: ElementUpdates,
  styleDefinitions: Record<string, React.CSSProperties>
): {
  updatedCode: string;
  updatedStyleDefinitions: Record<string, React.CSSProperties>;
} {
  const ast = parseJSX(originalCode);
  let updatedStyleDefinitions = { ...styleDefinitions };
  let elementFound = false;
  
  // Find the element node by line number
  traverse(ast, {
    JSXOpeningElement(path: any) {
      const nodeLine = path.node.loc?.start.line;
      
      if (nodeLine === elementData.line) {
        elementFound = true;
        
        // Update content
        if (updates.content !== undefined) {
          updateElementContent(path, updates.content);
        }
        
        // Update attributes
        if (updates.attributes) {
          Object.entries(updates.attributes).forEach(([key, value]) => {
            if (value !== undefined) {
              updateAttribute(path.node, key, value);
            }
          });
        }
        
        // Update styles
        if (updates.styles && Object.keys(updates.styles).length > 0) {
          if (elementData.styleType === 'style-object' && elementData.styleName) {
            // Will update style object separately
          } else {
            // Update inline styles
            updateInlineStyles(path.node, updates.styles);
          }
        }
      }
    }
  });
  
  if (!elementFound) {
    console.warn('updateReactEmailCode: Element not found at line', elementData.line, {
      elementType: elementData.type,
      elementId: elementData.id
    });
  }
  
  // Update style object if needed
  if (updates.styles && elementData.styleType === 'style-object' && elementData.styleName) {
    traverse(ast, {
      VariableDeclarator(path: any) {
        if (
          path.node.id.type === 'Identifier' &&
          path.node.id.name === elementData.styleName
        ) {
          const currentStyles = evaluateObjectExpression(path.node.init);
          const newStyles = { ...currentStyles, ...updates.styles };
          
          // Replace the style object
          path.node.init = createObjectExpression(newStyles);
          
          // Update style definitions
          if (elementData.styleName) {
            updatedStyleDefinitions = {
              ...updatedStyleDefinitions,
              [elementData.styleName]: newStyles
            };
          }
        }
      }
    });
  }
  
  return {
    updatedCode: generateCode(ast),
    updatedStyleDefinitions
  };
}

/**
 * Update element text content
 */
function updateElementContent(path: any, content: string) {
  const parentPath = path.parentPath;
  
  if (parentPath && parentPath.node && parentPath.node.type === 'JSXElement') {
    // Clear existing children
    parentPath.node.children = [];
    
    // Add new text content (even empty string is valid)
    if (content !== undefined && content !== null) {
      // Use JSXText for the content
      const textNode = t.jsxText(content);
      parentPath.node.children.push(textNode);
    }
  } else {
    console.warn('updateElementContent: Could not find parent JSXElement', {
      hasParentPath: !!parentPath,
      parentNodeType: parentPath?.node?.type
    });
  }
}

/**
 * Update element attribute
 */
function updateAttribute(node: any, key: string, value: any) {
  // Find existing attribute
  const existingAttrIndex = node.attributes.findIndex(
    (attr: any) => attr.name?.name === key
  );
  
  // Create new attribute
  const newAttr = t.jsxAttribute(
    t.jsxIdentifier(key),
    typeof value === 'string' 
      ? t.stringLiteral(value)
      : t.jsxExpressionContainer(
          typeof value === 'number'
            ? t.numericLiteral(value)
            : t.booleanLiteral(value)
        )
  );
  
  if (existingAttrIndex >= 0) {
    // Replace existing attribute
    node.attributes[existingAttrIndex] = newAttr;
  } else {
    // Add new attribute
    node.attributes.push(newAttr);
  }
}

/**
 * Update inline styles
 */
function updateInlineStyles(node: any, styles: Record<string, any>) {
  // Find style attribute
  const styleAttrIndex = node.attributes.findIndex(
    (attr: any) => attr.name?.name === 'style'
  );
  
  let currentStyles: any = {};
  
  if (styleAttrIndex >= 0) {
    const styleAttr = node.attributes[styleAttrIndex];
    if (styleAttr.value?.type === 'JSXExpressionContainer') {
      if (styleAttr.value.expression.type === 'ObjectExpression') {
        currentStyles = evaluateObjectExpression(styleAttr.value.expression);
      }
    }
  }
  
  // Merge styles
  const newStyles = { ...currentStyles, ...styles };
  
  // Create new style attribute
  const newStyleAttr = t.jsxAttribute(
    t.jsxIdentifier('style'),
    t.jsxExpressionContainer(createObjectExpression(newStyles))
  );
  
  if (styleAttrIndex >= 0) {
    node.attributes[styleAttrIndex] = newStyleAttr;
  } else {
    node.attributes.push(newStyleAttr);
  }
}

/**
 * Create object expression from plain object
 */
function createObjectExpression(obj: Record<string, any>): any {
  const properties: any[] = Object.entries(obj).map(([key, value]) => {
    let valueNode;
    
    if (typeof value === 'string') {
      valueNode = t.stringLiteral(value);
    } else if (typeof value === 'number') {
      valueNode = t.numericLiteral(value);
    } else if (typeof value === 'boolean') {
      valueNode = t.booleanLiteral(value);
    } else if (typeof value === 'object' && value !== null) {
      valueNode = createObjectExpression(value);
    } else {
      valueNode = t.stringLiteral(String(value));
    }
    
    return t.objectProperty(t.identifier(key), valueNode);
  });
  
  return t.objectExpression(properties);
}

/**
 * Convert inline styles to style object
 */
export function convertInlineToStyleObject(
  code: string,
  elementData: ElementData,
  styleObjectName: string
): {
  updatedCode: string;
  styleDefinitions: Record<string, React.CSSProperties>;
} {
  if (elementData.styleType !== 'inline' || !elementData.inlineStyles) {
    return { updatedCode: code, styleDefinitions: {} };
  }
  
  const ast = parseJSX(code);
  
  // Add style object definition at the top
  let firstExport: any = null;
  traverse(ast, {
    ExportDefaultDeclaration(path: any) {
      if (!firstExport) {
        firstExport = path;
      }
    }
  });
  
  if (firstExport) {
    // Insert style object before export
    const styleDeclaration = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(styleObjectName),
        createObjectExpression(elementData.inlineStyles)
      )
    ]);
    
    firstExport.insertBefore(styleDeclaration);
  }
  
  // Update element to use style object
  traverse(ast, {
    JSXOpeningElement(path: any) {
      if (path.node.loc?.start.line === elementData.line) {
        // Remove inline style attribute
        path.node.attributes = path.node.attributes.filter(
          (attr: any) => attr.name?.name !== 'style'
        );
        
        // Add style object reference
        path.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier('style'),
            t.jsxExpressionContainer(t.identifier(styleObjectName))
          )
        );
      }
    }
  });
  
  return {
    updatedCode: generateCode(ast),
    styleDefinitions: {
      [styleObjectName]: elementData.inlineStyles
    }
  };
}

/**
 * Convert style object to inline styles
 */
export function convertStyleObjectToInline(
  code: string,
  elementData: ElementData,
  styleDefinitions: Record<string, React.CSSProperties>
): string {
  if (elementData.styleType !== 'style-object' || !elementData.styleName) {
    return code;
  }
  
  const ast = parseJSX(code);
  const styles = styleDefinitions[elementData.styleName];
  
  if (!styles) {
    return code;
  }
  
  // Update element to use inline styles
  traverse(ast, {
    JSXOpeningElement(path: any) {
      if (path.node.loc?.start.line === elementData.line) {
        // Remove style object reference
        path.node.attributes = path.node.attributes.filter(
          (attr: any) => {
            if (attr.name?.name === 'style') {
              if (attr.value?.type === 'JSXExpressionContainer') {
                return attr.value.expression.type !== 'Identifier' ||
                       attr.value.expression.name !== elementData.styleName;
              }
            }
            return true;
          }
        );
        
        // Add inline styles
        path.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier('style'),
            t.jsxExpressionContainer(createObjectExpression(styles))
          )
        );
      }
    }
  });
  
  return generateCode(ast);
}

