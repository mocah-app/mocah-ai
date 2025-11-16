import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <Card className="mx-auto max-w-4xl p-8">
      <h1 className="mb-2 text-4xl font-bold">Help</h1>
      <CardContent>
        <p>
          Please read this help section carefully before using our platform.
        </p>
      </CardContent>
      <CardFooter>
        <Button>Get Help</Button>
      </CardFooter>
    </Card>
  );
}
