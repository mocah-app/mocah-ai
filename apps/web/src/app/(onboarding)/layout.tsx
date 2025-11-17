export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-background">
      {children}
    </div>
  );
}
