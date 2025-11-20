"use client";
import BrandKitSetupBanner from "@/components/brand-kit/BrandKitSetupBanner";
import EdgeRayLoader from "@/components/EdgeLoader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/contexts/organization-context";
import { Palette, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Template {
  id: number;
  name: string;
}

const TEMPLATES: Template[] = [
  {
    id: 1,
    name: "Template 1",
  },
  {
    id: 2,
    name: "Template 2",
  },
  {
    id: 3,
    name: "Template 3",
  },
  {
    id: 4,
    name: "Template 4",
  },
];

const TemplateCard = ({
  template,
}: {
  template: (typeof TEMPLATES)[number];
}) => {
  return (
    <Link href={`/template/${template.id}`}>
      <Card className="gap-0">
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-all duration-300">
            {template.name}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
};

const TemplateList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {TEMPLATES.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
};
export default function Dashboard() {
  const router = useRouter();
  const { activeOrganization, isLoading: orgLoading } = useOrganization();

  if (!activeOrganization && !orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Brand Selected</CardTitle>
            <CardDescription>
              Create your first brand to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/brand-setup")} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Brand
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if brand kit is set up
  const hasBrandKit = activeOrganization?.metadata?.setupCompleted;
  const templateCount = 0; // TODO: Get from tRPC

  return (
    <div className="space-y-6 relative">
      {/* {orgLoading && <EdgeRayLoader delay={2} />} */}

      <h1 className="sr-only">{activeOrganization?.name}</h1>

      {/* Brand Kit Setup Call-to-Action */}
      {!orgLoading && !hasBrandKit && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <BrandKitSetupBanner />
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 relative z-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold relative">
              {orgLoading  ? <Skeleton className="h-5 w-10" /> : templateCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your email templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold relative">
              {orgLoading ? <Skeleton className="h-5 w-10" /> : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              50 remaining this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold relative">
              {orgLoading ? <Skeleton className="h-5 w-10" /> : "Free"}
            </div>
            <Button
              variant="link"
              className="px-0 h-auto"
              onClick={() => router.push("/pricing")}
            >
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push("/template/new")}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Plus className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Generate Template</h3>
              <p className="text-sm text-muted-foreground">
                Create with AI from a prompt
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push("/library")}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Settings className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Browse Library</h3>
              <p className="text-sm text-muted-foreground">
                Choose from 40+ templates
              </p>
            </div>
          </CardContent>
        </Card>

        {hasBrandKit && (
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push("/dashboard/settings")}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Palette className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Edit Brand Kit</h3>
                <p className="text-sm text-muted-foreground">
                  Update colors and fonts
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Templates */}
      {templateCount > 0 ? (
        <Card className="relative z-10">
          <CardHeader>
            <CardTitle>Recent Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateList />
          </CardContent>
        </Card>
      ) : (
        <Card className="relative z-10">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-muted-foreground">
              <p className="text-lg font-semibold mb-2">No templates yet</p>
              <p>Create your first template to get started!</p>
            </div>
            <Button onClick={() => router.push("/template/new")}>
              New Template
              <Plus className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
