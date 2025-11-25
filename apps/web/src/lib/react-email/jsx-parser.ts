/**
 * JSX Parser Utilities
 * Utilities for parsing, manipulating, and generating React Email JSX code
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

/**
 * Parse React Email JSX code to AST
 */
export function parseJSX(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
}

/**
 * Generate code from AST
 */
export function generateCode(ast: any): string {
  return generate(ast, {
    jsescOption: { minimal: true },
  }).code;
}

/**
 * Inject data-element-id attributes for selection
 */
export function injectElementIds(reactEmailCode: string): string {
  const ast = parseJSX(reactEmailCode);
  
  traverse(ast, {
    JSXOpeningElement(path: any) {
      const elementName = path.node.name.name;
      const line = path.node.loc?.start.line || 0;
      
      // Only inject for React Email components
      const reactEmailComponents = [
        'Html', 'Head', 'Body', 'Container', 'Section',
        'Row', 'Column', 'Heading', 'Text', 'Button',
        'Img', 'Link', 'Hr', 'Preview'
      ];
      
      if (reactEmailComponents.includes(elementName)) {
        // Check if data-element-id already exists
        const hasElementId = path.node.attributes.some(
          (attr: any) => attr.name?.name === 'data-element-id'
        );
        
        if (!hasElementId) {
          // Add data-element-id attribute
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('data-element-id'),
              t.stringLiteral(`element-${elementName}-${line}`)
            )
          );
        }
      }
    }
  });
  
  return generateCode(ast);
}

/**
 * Find element node at specific line
 * Returns the full JSXElement (not just opening element) to access children
 */
export function findElementAtLine(ast: any, line: number) {
  let foundNode = null;
  
  traverse(ast, {
    JSXElement(path: any) {
      if (path.node.openingElement.loc?.start.line === line) {
        foundNode = {
          openingElement: path.node.openingElement,
          children: path.node.children,
          closingElement: path.node.closingElement,
          fullNode: path.node,
        };
      }
    }
  });
  
  return foundNode;
}

/**
 * Extract text content from JSX element
 */
export function extractTextContent(node: any): string {
  if (!node) return '';
  
  // For JSX elements, we need to find the JSXElement (parent) to get children
  // This function now expects a JSXElement node, not just the opening element
  const children = node.children || [];
  
  let textContent = '';
  
  for (const child of children) {
    if (child.type === 'JSXText') {
      textContent += child.value;
    } else if (child.type === 'JSXExpressionContainer') {
      if (child.expression.type === 'StringLiteral') {
        textContent += child.expression.value;
      } else if (child.expression.type === 'Identifier') {
        textContent += `{${child.expression.name}}`;
      }
    }
  }
  
  return textContent.trim();
}

/**
 * Extract style object definitions from code
 */
export function extractStyleDefinitions(code: string): Record<string, any> {
  const ast = parseJSX(code);
  const styles: Record<string, any> = {};
  
  traverse(ast, {
    VariableDeclarator(path: any) {
      // Find const styleObject = { ... }
      if (
        path.node.id.type === 'Identifier' &&
        path.node.id.name.endsWith('Style')
      ) {
        const styleName = path.node.id.name;
        if (path.node.init?.type === 'ObjectExpression') {
          styles[styleName] = evaluateObjectExpression(path.node.init);
        }
      }
    }
  });
  
  return styles;
}

/**
 * Evaluate object expression to plain JS object
 */
export function evaluateObjectExpression(node: any): any {
  const obj: any = {};
  
  if (!node || node.type !== 'ObjectExpression') {
    return obj;
  }
  
  node.properties.forEach((prop: any) => {
    if (prop.type === 'ObjectProperty') {
      const key = prop.key.name || prop.key.value;
      
      // Handle different value types
      if (prop.value.type === 'StringLiteral') {
        obj[key] = prop.value.value;
      } else if (prop.value.type === 'NumericLiteral') {
        obj[key] = prop.value.value;
      } else if (prop.value.type === 'BooleanLiteral') {
        obj[key] = prop.value.value;
      } else if (prop.value.type === 'ObjectExpression') {
        obj[key] = evaluateObjectExpression(prop.value);
      }
    }
  });
  
  return obj;
}

/**
 * Find style definition in AST
 */
export function findStyleDefinition(ast: any, styleName: string) {
  let foundNode = null;
  
  traverse(ast, {
    VariableDeclarator(path: any) {
      if (
        path.node.id.type === 'Identifier' &&
        path.node.id.name === styleName &&
        path.node.init?.type === 'ObjectExpression'
      ) {
        foundNode = path.node;
      }
    }
  });
  
  return foundNode;
}

/**
 * Get element's style prop
 */
export function getElementStyleProp(node: any): any {
  if (!node || !node.attributes) return null;
  
  const styleProp = node.attributes.find(
    (attr: any) => attr.name?.name === 'style'
  );
  
  return styleProp?.value;
}

/**
 * Get element's className prop
 */
export function getElementClassName(node: any): string | null {
  if (!node || !node.attributes) return null;
  
  const classNameProp = node.attributes.find(
    (attr: any) => attr.name?.name === 'className'
  );
  
  return classNameProp?.value?.value || null;
}

