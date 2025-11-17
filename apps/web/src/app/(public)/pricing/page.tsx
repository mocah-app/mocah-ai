import { Card } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <Card className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-4xl font-bold">Pricing</h1>
      <div className="prose prose-lg">
        <p className="text-muted-foreground">
          This is the pricing page for the platform.
        </p>
        {/* Add your pricing content here */}
      </div>
    </Card>
  );
}
