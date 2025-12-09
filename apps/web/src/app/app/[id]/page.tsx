import { TemplateEditorPage } from "./TemplateEditorPage";

// Generate static params for the page
// This tells Next.js to statically generate the page shell
// while still allowing dynamic params at runtime
export async function generateStaticParams() {
  // Return empty array - we'll generate pages on-demand
  // but the page shell will be static
  return [];
}

// Allow dynamic params at runtime (for user-created templates)
export const dynamicParams = true;

// Make the page static (not server-rendered)
export const dynamic = "force-static";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplateEditorPage templateId={id} />;
}
