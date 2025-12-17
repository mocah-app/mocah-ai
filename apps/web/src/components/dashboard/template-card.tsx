"use client";

import { TemplatePreview } from "@/components/template/TemplatePreview";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { TemplateCardMenu } from "./template-card-menu";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    updatedAt: string | Date;
    isFavorite: boolean | null;
    htmlCode: string | null;
    _count: {
      versions: number;
    };
  };
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="gap-0 hover:shadow-md bg-accent/50 transition-all duration-300 p-0 h-full overflow-hidden flex flex-col border-border rounded-md">
      <Link href={`/app/${template.id}`} className="flex-1 flex flex-col">
        <CardHeader className="p-0 w-full group flex-1 flex flex-col">
          <div className="flex w-full items-start justify-between">
            <div className="flex-1">
              <div className="relative w-full group-hover:scale-105 group-focus:scale-105 transition-all duration-300">
                <TemplatePreview htmlCode={template.htmlCode} />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors duration-300 p-4 text-lg">
                {template.name}
              </CardTitle>
            </div>
            {template.isFavorite && (
              <span className="text-yellow-500 text-sm">★</span>
            )}
          </div>
        </CardHeader>
      </Link>
      <CardFooter className="p-0 w-full border-t border-border [.border-t]:pt-0 mt-auto">
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 p-4 w-full">
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            <span className="truncate w-[95%]">
              {template._count.versions} versions
            </span>
          </div>
          <span className="truncate w-[95%]">
            {formatDistanceToNow(new Date(template.updatedAt), {
              addSuffix: true,
            })}
          </span>
          <div className="flex items-center justify-end">
            <TemplateCardMenu
              templateId={template.id}
              templateName={template.name}
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
