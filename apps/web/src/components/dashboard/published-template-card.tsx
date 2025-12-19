"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, ExternalLink, MoreVertical, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface PublishedTemplateCardProps {
  libraryEntry: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    thumbnail: string | null;
    isPremium: boolean;
    tags: string[];
    createdAt: Date | string;
    updatedAt: Date | string;
    sourceTemplate: {
      id: string;
      name: string;
      updatedAt: Date | string;
    } | null;
    _count: {
      customizations: number;
    };
  };
  onEdit: (id: string) => void;
  onUpdateFromSource: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PublishedTemplateCard({
  libraryEntry,
  onEdit,
  onUpdateFromSource,
  onUnpublish,
  onDelete,
}: PublishedTemplateCardProps) {
  const isSourceUpdated =
    libraryEntry.sourceTemplate &&
    new Date(libraryEntry.sourceTemplate.updatedAt) >
      new Date(libraryEntry.updatedAt);

  const remixCount = libraryEntry._count.customizations;

  return (
    <Card className="hover:shadow-md pt-0 bg-accent/50 transition-all duration-300 overflow-hidden flex flex-col border-border rounded-md h-full">
      <CardHeader className="p-0 relative">
        {/* Thumbnail */}
        <div className="relative w-full aspect-16/10 bg-muted overflow-hidden">
          {libraryEntry.thumbnail ? (
            <Image
              src={libraryEntry.thumbnail}
              alt={libraryEntry.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No thumbnail
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-0 right-2 flex flex-col gap-1">
            {isSourceUpdated && (
              <Badge
                variant="default"
                className="bg-destructive backdrop-blur-sm"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Source Updated
              </Badge>
            )}
            {libraryEntry.isPremium && (
              <Badge variant="default" className="bg-primary backdrop-blur-sm">
                Premium
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-0 flex-1 flex flex-col gap-2">
        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2">
          {libraryEntry.name}
        </h3>

        {/* Category and Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {libraryEntry.category && (
            <Badge variant="secondary" className="text-xs">
              {libraryEntry.category}
            </Badge>
          )}
          {libraryEntry.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {libraryEntry.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{libraryEntry.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-0 px-4 flex flex-col gap-3 border-t border-border mt-auto">
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
          <span className="truncate">
            Published{" "}
            {formatDistanceToNow(new Date(libraryEntry.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() =>
              window.open(`/library?template=${libraryEntry.id}`, "_blank")
            }
          >
            <ExternalLink className="h-3 w-3" />
            View in Library
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
                <span>Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(libraryEntry.id)}>
                Edit Library Entry
              </DropdownMenuItem>
              {isSourceUpdated && (
                <DropdownMenuItem
                  onClick={() => onUpdateFromSource(libraryEntry.id)}
                >
                  Update from Source Template
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUnpublish(libraryEntry.id)}
                className="text-muted-foreground"
              >
                Unpublish
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(libraryEntry.id)}
                className="text-destructive"
              >
                Delete from Library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
