import { Button } from "@/components/ui/button";
import Link from "next/link";

const TITLE_TEXT = `
███╗   ███╗ ██████╗  ██████╗ █████╗ ██╗  ██╗
████╗ ████║██╔═══██╗██╔════╝██╔══██╗██║  ██║
██╔████╔██║██║   ██║██║     ███████║███████║
██║╚██╔╝██║██║   ██║██║     ██╔══██║██╔══██║
██║ ╚═╝ ██║╚██████╔╝╚██████╗██║  ██║██║  ██║
╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝
`;

export default function Home() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <pre className="overflow-x-auto font-mono text-2xl">{TITLE_TEXT}</pre>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4 space-y-4">
          <h2 className="mb-2 font-medium">Welcome to Mocah</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered email template builder for modern brands
          </p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
