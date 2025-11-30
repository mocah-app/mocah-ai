"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetOverlay,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Wand2,
  CheckCircle2,
  Mail,
  Shield,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useErrorFix } from "../providers/ErrorFixProvider";

interface AlertItem {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  line?: number;
  clients?: string[];
  learnMoreUrl?: string;
}

interface CodeAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
  warnings: string[];
  reactEmailCode: string;
  onGoToLine?: (line: number) => void;
}

// Email client compatibility data
const EMAIL_CLIENT_COMPATIBILITY: Record<
  string,
  { clients: string[]; moreUrl: string }
> = {
  "align-items": {
    clients: ["Gmail", "Outlook", "Yahoo! Mail"],
    moreUrl: "https://www.caniemail.com/features/css-align-items/",
  },
  "display:flex": {
    clients: ["Outlook"],
    moreUrl: "https://www.caniemail.com/features/css-display-flex/",
  },
  "justify-content": {
    clients: ["Gmail", "Outlook", "Yahoo! Mail"],
    moreUrl: "https://www.caniemail.com/features/css-justify-content/",
  },
  "text-decoration-line": {
    clients: ["Outlook"],
    moreUrl: "https://www.caniemail.com/features/css-text-decoration-line/",
  },
  "target-attribute": {
    clients: ["Gmail", "Outlook", "Yahoo! Mail"],
    moreUrl: "https://www.caniemail.com/features/html-link-target/",
  },
  position: {
    clients: ["Most email clients"],
    moreUrl: "https://www.caniemail.com/features/css-position/",
  },
  overflow: {
    clients: ["Most email clients"],
    moreUrl: "https://www.caniemail.com/features/css-overflow/",
  },
  transform: {
    clients: ["Most email clients"],
    moreUrl: "https://www.caniemail.com/features/css-transform/",
  },
  "box-shadow": {
    clients: ["Outlook", "Yahoo! Mail"],
    moreUrl: "https://www.caniemail.com/features/css-box-shadow/",
  },
};

// Find line number in code for a given issue pattern
function findLineNumberForIssue(
  code: string,
  message: string
): number | undefined {
  if (!code) return undefined;

  const lines = code.split("\n");

  // Map message patterns to regex patterns to search in code
  const patterns: Array<{ check: (msg: string) => boolean; regex: RegExp }> = [
    {
      check: (m) => m.includes("display"),
      regex: /display:\s*['"]?(?:flex|inline-flex|grid|block|inline)/i,
    },
    {
      check: (m) => m.includes("position"),
      regex: /position:\s*['"]?(?:absolute|fixed|sticky|relative)/i,
    },
    {
      check: (m) => m.includes("align-items"),
      regex: /alignItems|align-items/i,
    },
    {
      check: (m) => m.includes("justify-content"),
      regex: /justifyContent|justify-content/i,
    },
    { check: (m) => m.includes("overflow"), regex: /overflow:\s*['"]?hidden/i },
    { check: (m) => m.includes("transform"), regex: /transform:\s*['"]/i },
    {
      check: (m) => m.includes("boxShadow") || m.includes("box-shadow"),
      regex: /boxShadow:\s*['"]/i,
    },
    {
      check: (m) => m.includes("fit-content") || m.includes("max-content"),
      regex:
        /(?:width|height):\s*['"]?(?:fit-content|max-content|min-content)/i,
    },
    { check: (m) => m.includes("<div"), regex: /<div[\s>]/i },
    { check: (m) => m.includes("<span"), regex: /<span[\s>]/i },
    { check: (m) => m.includes("<p>") || m.includes("<p "), regex: /<p[\s>]/i },
    {
      check: (m) =>
        m.includes("<h1") || m.includes("<h2") || m.includes("heading"),
      regex: /<h[1-6][\s>]/i,
    },
    { check: (m) => m.includes("<a>") || m.includes("<a "), regex: /<a[\s>]/i },
    {
      check: (m) => m.includes("as=") || m.includes("'as' prop"),
      regex: /<Heading[^>]*\s+as=/i,
    },
    { check: (m) => m.includes("<Html"), regex: /<Html/i },
    { check: (m) => m.includes("<Body"), regex: /<Body/i },
    { check: (m) => m.includes("<Container"), regex: /<Container/i },
    { check: (m) => m.includes("target"), regex: /target=["']/i },
    {
      check: (m) => m.includes("text-decoration"),
      regex: /textDecorationLine|text-decoration-line/i,
    },
  ];

  for (const pattern of patterns) {
    if (pattern.check(message)) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.regex.test(lines[i])) {
          return i + 1; // Line numbers are 1-indexed
        }
      }
    }
  }

  return undefined;
}

function parseAlertFromMessage(
  message: string,
  index: number,
  type: "error" | "warning",
  code: string
): AlertItem {
  // Try to extract CSS property name for compatibility info
  const cssProperties = Object.keys(EMAIL_CLIENT_COMPATIBILITY);
  let matchedProperty: string | undefined;

  for (const prop of cssProperties) {
    if (message.toLowerCase().includes(prop.toLowerCase())) {
      matchedProperty = prop;
      break;
    }
  }

  const compat = matchedProperty
    ? EMAIL_CLIENT_COMPATIBILITY[matchedProperty]
    : undefined;

  // Find the line number by scanning the code
  const lineNumber = findLineNumberForIssue(code, message);

  return {
    id: `${type}-${index}`,
    type,
    title: extractTitleFromMessage(message),
    description: message,
    line: lineNumber,
    clients: compat?.clients,
    learnMoreUrl: compat?.moreUrl,
  };
}

function extractTitleFromMessage(message: string): string {
  // Extract a shorter title from the full message
  if (message.includes("display")) return "DISPLAY PROPERTY";
  if (message.includes("position")) return "POSITION PROPERTY";
  if (message.includes("align-items")) return "ALIGN ITEMS";
  if (message.includes("justify-content")) return "JUSTIFY CONTENT";
  if (message.includes("overflow")) return "OVERFLOW PROPERTY";
  if (message.includes("transform")) return "TRANSFORM PROPERTY";
  if (message.includes("boxShadow") || message.includes("box-shadow"))
    return "BOX SHADOW";
  if (message.includes("fit-content") || message.includes("max-content"))
    return "CSS VALUES";
  if (message.includes("<div")) return "HTML DIV TAGS";
  if (message.includes("<span")) return "HTML SPAN TAGS";
  if (message.includes("<p>") || message.includes("<p ")) return "HTML P TAGS";
  if (
    message.includes("<h1") ||
    message.includes("<h2") ||
    message.includes("heading")
  )
    return "HTML HEADING TAGS";
  if (message.includes("<a>") || message.includes("<a "))
    return "HTML ANCHOR TAGS";
  if (message.includes("as=") || message.includes("'as' prop"))
    return "HEADING 'AS' PROP";
  if (message.includes("<Html")) return "MISSING HTML WRAPPER";
  if (message.includes("<Body")) return "MISSING BODY COMPONENT";
  if (message.includes("<Container")) return "MISSING CONTAINER";
  if (message.includes("@react-email")) return "MISSING IMPORTS";
  if (message.includes("export default")) return "MISSING EXPORT";
  if (message.includes("target")) return "TARGET ATTRIBUTE";
  if (message.includes("text-decoration")) return "TEXT DECORATION LINE";
  return message.substring(0, 30).toUpperCase();
}

export function CodeAlertsDrawer({
  isOpen,
  onClose,
  errors,
  warnings,
  reactEmailCode,
  onGoToLine,
}: CodeAlertsDrawerProps) {
  const { onRequestErrorFix } = useErrorFix();
  const [activeTab, setActiveTab] = useState("compatibility");

  // Convert errors and warnings to AlertItems
  const errorAlerts = errors.map((err, idx) =>
    parseAlertFromMessage(err, idx, "error", reactEmailCode)
  );
  const warningAlerts = warnings.map((warn, idx) =>
    parseAlertFromMessage(warn, idx, "warning", reactEmailCode)
  );
  const allAlerts = [...errorAlerts, ...warningAlerts];

  const totalIssues = allAlerts.length;

  const handleFixIssue = (alert: AlertItem) => {
    if (!reactEmailCode) return;

    // Create a specific prompt for the AI to fix the issue
    // Note: Template code is automatically fetched by the regeneration API
    const fixPrompt = `Fix the following email compatibility issue:

**Issue:** ${alert.title}
**Description:** ${alert.description}
${alert.clients ? `**Affected Clients:** ${alert.clients.join(", ")}` : ""}

Please fix this issue while:
1. Maintaining the exact same visual appearance
2. Using only email-safe CSS properties and React Email components
3. Replacing any unsupported properties with email-compatible alternatives
4. Do NOT use any display, flex, grid, or positioning properties
5. Use <Section>, <Row>, <Column> for layouts instead of flexbox`;

    // Send to chat panel for AI to fix
    onRequestErrorFix(fixPrompt, reactEmailCode);
    onClose();
  };

  const handleFixAllIssues = () => {
    if (!reactEmailCode || allAlerts.length === 0) return;

    const issuesList = allAlerts
      .map((alert, idx) => `${idx + 1}. ${alert.title}: ${alert.description}`)
      .join("\n");

    // Note: Template code is automatically fetched by the regeneration API
    const fixPrompt = `Fix ALL the following email compatibility issues:

**Issues Found (${allAlerts.length}):**
${issuesList}

Please fix ALL these issues while:
1. Maintaining the exact same visual appearance and layout
2. Using only email-safe CSS properties and React Email components
3. Replacing any unsupported properties with email-compatible alternatives
4. Do NOT use any display, flex, grid, or positioning properties
5. Use <Section>, <Row>, <Column> for table-based layouts instead of flexbox
6. Use margin and padding for spacing instead of flex gap
7. Remove all 'as' props from Heading components

Fix all issues in a single pass.`;

    // Send to chat panel for AI to fix
    onRequestErrorFix(fixPrompt, reactEmailCode);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetOverlay className="bg-black/5" />
      <SheetContent
        side="bottom"
        className="w-full h-full lg:max-h-[300px] p-0 flex flex-col"
      >
        <SheetHeader className="p-2 px-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              Email Review
              {totalIssues > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalIssues}
                </Badge>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Review and fix issues and test email client compatibility.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="px-4 pb-1 border-b border-border flex flex-col lg:flex-row justify-between items-center">
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="linter" className="text-xs gap-1">
                <Code2 className="h-3 w-3" />
                Linter
              </TabsTrigger>
              <TabsTrigger value="compatibility" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                Compatibility
              </TabsTrigger>
              <TabsTrigger value="spam" className="text-xs gap-1">
                <Shield className="h-3 w-3" />
                Spam
              </TabsTrigger>
              <TabsTrigger value="resend" className="text-xs gap-1">
                <Mail className="h-3 w-3" />
                Resend
              </TabsTrigger>
            </TabsList>
            {allAlerts.length > 0 && (
              <div className="w-full lg:w-auto p-4 bg-muted/30">
                <Button
                  onClick={handleFixAllIssues}
                  className="w-full"
                  variant="default"
                  size="sm"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Fix All ({allAlerts.length}) Issues
                </Button>
              </div>
            )}
          </div>

          {/* Linter Tab */}
          <TabsContent value="linter" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="px-4 py-2">
                {errorAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">No linting errors</p>
                    <p className="text-xs mt-1">Your code looks good!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {errorAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onFix={() => handleFixIssue(alert)}
                        onGoToLine={onGoToLine}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Compatibility Tab */}
          <TabsContent
            value="compatibility"
            className="flex-1 m-0 flex flex-col"
          >
            <ScrollArea className="flex-1">
              <div className="px-4 py-2">
                {allAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">
                      No compatibility issues
                    </p>
                    <p className="text-xs mt-1">
                      Your email is compatible with all major clients!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {allAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onFix={() => handleFixIssue(alert)}
                        onGoToLine={onGoToLine}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Spam Tab */}
          <TabsContent value="spam" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Spam Check</p>
                  <p className="text-xs mt-1">Coming soon...</p>
                  <p className="text-xs mt-2 text-muted-foreground/70">
                    Analyze your email for spam triggers and deliverability
                    issues.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Resend Tab */}
          <TabsContent value="resend" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-medium">Test Send</p>
                  <p className="text-xs mt-1">Coming soon...</p>
                  <p className="text-xs mt-2 text-muted-foreground/70">
                    Send test emails to verify rendering across clients.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// Alert Row Component - simplified design
function AlertCard({
  alert,
  onGoToLine,
}: {
  alert: AlertItem;
  onFix: () => void;
  onGoToLine?: (line: number) => void;
}) {
  const IconComponent = alert.type === "error" ? AlertCircle : AlertTriangle;
  const iconColor = alert.type === "error" ? "text-red-500" : "text-amber-500";
  const titleColor = alert.type === "error" ? "text-red-500" : "text-amber-500";

  return (
    <div className="flex items-center gap-3 py-2 px-1 hover:bg-muted/30 rounded transition-colors">
      {/* Icon */}
      <IconComponent className={cn("h-4 w-4 shrink-0", iconColor)} />

      {/* Title */}
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-wide shrink-0",
          titleColor
        )}
      >
        {alert.title}
      </span>

      <div className="flex items-center gap-3">
        {/* Clients info */}
        <span className="text-xs text-muted-foreground flex-1 truncate">
          {alert.clients
            ? `Not supported in ${alert.clients.join(", ")}`
            : "May cause compatibility issues"}
        </span>
        {/* More link */}
        {alert.learnMoreUrl && (
          <a
            href={alert.learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 shrink-0 underline"
          >
            More <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Line number - clickable */}
      {alert.line && (
        <Button
          variant="link"
          onClick={() => onGoToLine?.(alert.line!)}
          title={`Go to line ${alert.line}`}
          className="ml-auto"
        >
          L{alert.line}
        </Button>
      )}
    </div>
  );
}
