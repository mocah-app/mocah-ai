import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { createElement } from "react";
import * as ReactEmail from "@react-email/components";
import * as Babel from "@babel/standalone";

/**
 * Render React Email JSX to HTML (Server-Side)
 * POST /api/template/render
 */
export async function POST(req: NextRequest) {
  try {
    const { reactEmailCode, withIds } = await req.json();

    if (!reactEmailCode) {
      return NextResponse.json(
        { error: "reactEmailCode is required" },
        { status: 400 }
      );
    }

    // Create a safe component from the code string
    const html = await renderReactEmailComponent(reactEmailCode);

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Failed to render React Email:", error);
    return NextResponse.json(
      { error: "Failed to render React Email", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Render React Email component from code string
 */
async function renderReactEmailComponent(code: string): Promise<string> {
  try {
    // Step 1: Remove import statements
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
    // Use both TypeScript and React presets to handle full React Email syntax
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
    // Provide React and React Email components as context
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
    const html = render(createElement(Component), {
      pretty: true,
    });

    return html;
  } catch (error) {
    console.error("Failed to render component:", error);
    throw new Error(`Rendering failed: ${error}`);
  }
}
