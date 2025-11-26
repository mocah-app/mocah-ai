"use client";
import BrandKitSetupBanner from "@/components/brand-kit/BrandKitSetupBanner";
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
import { FileText, Palette, Plus, Send, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/utils/trpc";
import { Textarea } from "@/components/ui/textarea";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    subject?: string | null;
    category?: string | null;
    updatedAt: string | Date;
    isFavorite?: boolean;
    _count?: {
      versions: number;
    };
  };
}

const TemplateCard = ({ template }: TemplateCardProps) => {
  return (
    <Link href={`/app/${template.id}`}>
      <Card className="gap-0 hover:shadow-md transition-all duration-300 group p-0 h-full overflow-hidden">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 w-full h-28 bg-primary/10" />
              <CardTitle className="group-hover:text-primary transition-colors duration-300 p-2">
                {template.name}
              </CardTitle>
            </div>
            {template.isFavorite && (
              <span className="text-yellow-500 text-sm">★</span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 p-2">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span>{template._count?.versions ?? 0} versions</span>
            </div>
            <span>
              {formatDistanceToNow(new Date(template.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
};

const TemplateList = ({ organizationId }: { organizationId: string }) => {
  const { data, isLoading } = trpc.template.list.useQuery(
    { limit: 6 },
    { enabled: !!organizationId }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.templates || data.templates.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.templates.map((template) => (
        <TemplateCard key={template.id} template={template as TemplateCardProps['template']} />
      ))}
    </div>
  );
};
export default function Dashboard() {
  const router = useRouter();
  const {
    activeOrganization,
    organizations,
    isLoading: orgLoading,
  } = useOrganization();

  // Show first organization if we have orgs but no active one set yet
  const displayOrg =
    activeOrganization || (organizations.length > 0 ? organizations[0] : null);

  if (!displayOrg && !orgLoading) {
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
            <Button
              onClick={() => router.push("/brand-setup")}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Brand
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  interface TopStats {
    title: string;
    value: number | string;
    description: string | React.ReactNode;
  }

  // Check if brand kit is set up
  const hasBrandKit = displayOrg?.metadata?.setupCompleted;

  // Fetch templates count
  const { data: templatesData } = trpc.template.list.useQuery(
    { limit: 100 },
    { enabled: !!displayOrg?.id }
  );
  const templateCount = templatesData?.templates.length || 0;

  const topStats: TopStats[] = [
    {
      title: "Templates",
      value: templateCount,
      description: "Your email templates",
    },
    { title: "AI Credits", value: 0, description: "50 remaining this month" },
    {
      title: "Plan",
      value: 0,
      description: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pricing")}
        >
          Upgrade Plan
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 relative">
      <h1 className="sr-only">{displayOrg?.name}</h1>

      {/* Brand Kit Setup Call-to-Action */}
      {!orgLoading && !hasBrandKit && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <BrandKitSetupBanner />
        </div>
      )}

      <PromptInput />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 relative z-10">
        {topStats.map((stat) => (
          <Card key={stat.title} className="gap-2 py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="text-2xl font-bold relative">{stat.value}</div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Templates */}
      {templateCount > 0 ? (
        <Card className="relative z-10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {displayOrg?.id && <TemplateList organizationId={displayOrg.id} />}
          </CardContent>
        </Card>
      ) : (
        <Card className="relative z-10">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-muted-foreground">
              <p className="text-lg font-semibold mb-2">No templates yet</p>
              <p>Create your first template to get started!</p>
            </div>
            <Button onClick={() => router.push("/app/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const PromptInput = () => {
  const handleGenerate = () => {
    console.log("Generate");
  };
  return (
    <div className="mx-auto max-w-2xl flex flex-col items-center justify-center gap-4 py-8">
      <h2 className="text-2xl font-bold">What do you want to create?</h2>
      <div className="w-full relative">
      <Textarea
        placeholder="Describe the email template you want to generate..."
        rows={4}
        maxLength={1000}
        className="w-full bg-card focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-2 focus-visible:ring-offset-ring/5 focus:outline-none focus-visible:border-ring outline-none resize-none max-h-[180px] disabled:opacity-50 shadow-2xl"
      />
      <Button
        size="icon"
        onClick={handleGenerate}
        className="absolute bottom-0.5 right-0.5 rounded-md w-10 h-8"
        aria-label="Generate template"
      >
        <Send className="size-4" />
      </Button>
      </div>
    </div>
  );
};
