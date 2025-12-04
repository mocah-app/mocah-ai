import { logger } from "@mocah/shared/logger";

// ============================================================================
// HTML TAG REPAIR - JSX-safe approach for React Email components
// ============================================================================

export interface RepairResult {
  code: string;
  changed: boolean;
  changeCount: number;
}

// HTML to React Email component mapping
// NOTE: <strong>, <em>, <b>, <i> are VALID inline formatting tags inside <Text>
// They should NOT be repaired - they're allowed for inline text styling
const TAG_MAP: ReadonlyArray<[string, string]> = [
  ["div", "Section"],
  ["span", "Text"],
  ["p", "Text"],
  ["a", "Link"],
  ["img", "Img"],
  ["button", "Button"],
  ["br", "Hr"],
  ["hr", "Hr"],
  ["h1", "Heading"],
  ["h2", "Heading"],
  ["h3", "Heading"],
  ["h4", "Heading"],
  ["h5", "Heading"],
  ["h6", "Heading"],
  // Inline formatting tags like <strong>, <em>, <b>, <i> are intentionally
  // NOT included - they are valid inside <Text> components
];

/**
 * HTML tag repair for React Email components
 * Uses JSX-safe regex that preserves JSX syntax
 */
export function repairHtmlTags(code: string): RepairResult {
  let changeCount = 0;

  // Quick check: if no HTML tags present, return early
  const tagNames = TAG_MAP.map(([html]) => html).join("|");
  const quickCheck = new RegExp(`</?(?:${tagNames})(?:[\\s>]|/>)`, "i");
  
  if (!quickCheck.test(code)) {
    return { code, changed: false, changeCount: 0 };
  }

  let repaired = code;

  for (const [htmlTag, reactComponent] of TAG_MAP) {
    // Opening tag: <div or <div  (with space/newline after)
    // Captures everything until > but preserves JSX attributes
    const openingRegex = new RegExp(
      `<${htmlTag}((?:\\s[^>]*?)?)>`,
      "gi"
    );
    
    // Closing tag: </div>
    const closingRegex = new RegExp(`</${htmlTag}>`, "gi");
    
    // Self-closing: <div /> or <img/>
    const selfClosingRegex = new RegExp(
      `<${htmlTag}((?:\\s[^>]*?)?)(\\s*/)>`,
      "gi"
    );

    // Count and replace opening tags
    const openMatches = repaired.match(openingRegex);
    if (openMatches) {
      changeCount += openMatches.length;
      repaired = repaired.replace(openingRegex, `<${reactComponent}$1>`);
    }

    // Count and replace closing tags
    const closeMatches = repaired.match(closingRegex);
    if (closeMatches) {
      changeCount += closeMatches.length;
      repaired = repaired.replace(closingRegex, `</${reactComponent}>`);
    }

    // Count and replace self-closing tags
    const selfMatches = repaired.match(selfClosingRegex);
    if (selfMatches) {
      changeCount += selfMatches.length;
      repaired = repaired.replace(selfClosingRegex, `<${reactComponent}$1$2>`);
    }
  }

  if (changeCount > 0) {
    logger.warn("Repaired HTML tags in React Email code", {
      component: "ai",
      action: "repairHtmlTags",
      changeCount,
    });
  }

  return {
    code: repaired,
    changed: changeCount > 0,
    changeCount,
  };
}
