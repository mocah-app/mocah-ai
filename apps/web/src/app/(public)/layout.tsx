import PublicHeader from "@/components/public/PublicHeader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="w-screen h-svh">
        <PublicHeader />
        {children}
      </div>
    </>
  );
}
