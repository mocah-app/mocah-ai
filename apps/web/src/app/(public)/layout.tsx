import PublicHeader from "@/components/public/PublicHeader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="grid grid-rows-[auto_1fr] h-svh">
        <PublicHeader />
        {children}
      </div>
    </>
  );
}
