/**
 * Client-Side React Email Renderer
 * 
 * Renders React Email JSX to HTML entirely in the browser.
 * This eliminates server-side RCE risk since code executes in the browser's sandbox.
 * 
 */

import { render } from "@react-email/render";
import { createElement } from "react";
import * as ReactEmail from "@react-email/components";
import * as Babel from "@babel/standalone";

/**
 * Render React Email JSX to HTML (Client-Side)
 * Safe to execute arbitrary code - runs in browser sandbox
 */
export async function renderReactEmailClientSide(
  code: string
): Promise<string> {
  try {
    // Step 1: Remove import statements (we provide components directly)
    let cleanedCode = code;
    cleanedCode = cleanedCode.replace(
      /import\s+.*?from\s+['"].*?['"];?\s*/g,
      ""
    );
    cleanedCode = cleanedCode.replace(
      /import\s+\{[^}]*\}\s+from\s+['"].*?['"];?\s*/g,
      ""
    );
    cleanedCode = cleanedCode.replace(
      /import\s+\*\s+as\s+\w+\s+from\s+['"].*?['"];?\s*/g,
      ""
    );

    // Step 2: Transform TypeScript/JSX to JavaScript using Babel
    const transformedResult = Babel.transform(cleanedCode, {
      presets: [
        ["typescript", { isTSX: true, allExtensions: true }],
        ["react", { runtime: "classic" }],
      ],
      filename: "email.tsx",
    });

    if (!transformedResult.code) {
      throw new Error("Babel transformation failed");
    }

    let jsCode = transformedResult.code;

    // Step 3: Replace export default with return
    jsCode = jsCode.replace(
      /export\s+default\s+function\s+(\w+)/,
      "return function $1"
    );
    jsCode = jsCode.replace(/export\s+default\s+/, "return ");

    // Step 4: Create and execute function
    // In browser context, this is safe - sandboxed by browser
    const componentFactory = new Function(
      "React",
      ...Object.keys(ReactEmail),
      `
        'use strict';
        ${jsCode}
      `
    );

    // Execute with React and React Email components
    const Component = componentFactory(
      { createElement },
      ...Object.values(ReactEmail)
    );

    if (!Component || typeof Component !== "function") {
      throw new Error("No valid React component found in code");
    }

    // Step 5: Render to HTML
    const html = await render(createElement(Component), {
      pretty: true,
    });

    return html;
  } catch (error) {
    console.error("Client-side render failed:", error);
    throw new Error(`Rendering failed: ${error}`);
  }
}

/**
 * Check if client-side rendering is available
 * (Babel must be loaded)
 */
export function isClientRenderingAvailable(): boolean {
  return typeof Babel !== "undefined" && typeof Babel.transform === "function";
}

