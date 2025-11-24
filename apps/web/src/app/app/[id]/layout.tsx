export default function TemplateEditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-screen h-svh">{children}</div>;
}
