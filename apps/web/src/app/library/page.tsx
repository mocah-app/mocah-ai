import { Suspense } from "react";
import { LibraryGrid } from "./components/LibraryGrid";
import PublicHeader from "@/components/public/PublicHeader";

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground w-full overflow-x-hidden">
      <div className="w-full border-b border-border">
        <PublicHeader />
      </div>
      <Suspense fallback={null}>
        <LibraryGrid />
      </Suspense>
    </div>
  );
}
