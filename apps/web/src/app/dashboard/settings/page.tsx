import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-4xl font-bold">Settings</h1>

      <Card className="grid gap-4 p-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This section allows you to manage your profile information.</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This section allows you to manage your preferences.</p>
          </CardContent>
        </Card>
      </Card>

      <Link href="/template">Templates</Link>
    </div>
  );
}
