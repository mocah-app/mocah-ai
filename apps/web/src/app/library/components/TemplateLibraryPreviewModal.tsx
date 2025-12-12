"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Copy, Crown, LogIn } from "lucide-react";
import { TemplatePreview } from "@/components/template/TemplatePreview";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/organization-context";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

// Type-safe message interface matching Prisma ChatMessage schema
interface TemplateMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    imageUrls?: string[];
    subject?: string;
    previewText?: string;
    codePreview?: string;
  } | null;
}

interface TemplateLibraryPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
}

export function TemplateLibraryPreviewModal({
  open,
  onOpenChange,
  templateId,
}: TemplateLibraryPreviewModalProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { activeOrganization } = useOrganization();
  const utils = trpc.useUtils();

  // Fetch template detail - explicitly type to break inference chain
  const { data: templateData, isLoading } =
    trpc.template.getLibraryTemplateDetail.useQuery(
      { id: templateId! },
      { enabled: !!templateId && open }
    );
  
  // Cast to simplified type structure
  const template = templateData as {
    id: string;
    name: string | null;
    subject: string | null;
    previewText: string | null;
    htmlCode: string | null;
    category: string | null;
    isPremium: boolean | null;
    sourceTemplate?: {
      id: string;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        metadata: unknown;
      }>;
    } | null;
  } | undefined;

  // Remix mutation
  const remixMutation = trpc.template.duplicate.useMutation({
    onSuccess: (data: { id: string }) => {
      toast.success("Template remixed successfully");
      utils.template.list.invalidate();
      onOpenChange(false);
      router.push(`/app/${data.id}`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to remix template");
    },
  });

  const handleRemix = () => {
    // If not logged in, redirect to login with callback
    if (!session) {
      const callbackUrl = encodeURIComponent(`/library?template=${templateId}`);
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    if (!template?.sourceTemplate?.id) {
      toast.error("Template source not found");
      return;
    }
    if (!activeOrganization) {
      toast.error("No active workspace");
      return;
    }

    const toastId = `remix-${template.id}`;
    toast.loading("Remixing template...", { id: toastId });
    remixMutation.mutate(
      { id: template.sourceTemplate.id },
      {
        onSuccess: () => {
          toast.success("Template remixed successfully", { id: toastId });
        },
        onError: (error) => {
          toast.error(error.message || "Failed to remix template", {
            id: toastId,
          });
        },
      }
    );
  };

  if (!templateId) return null;

  // Break type inference chain for messages
  const rawMessages = template?.sourceTemplate?.messages || [];
  const messages = rawMessages as TemplateMessage[];
  const userMessage = messages.find((m) => m.role === "user");
  const assistantMessage = messages.find((m) => m.role === "assistant");
  
  // Extract image URLs from user message metadata
  const userImageUrls = userMessage?.metadata?.imageUrls || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-full sm:max-w-full w-full rounded-none h-dvh p-0 gap-0 flex flex-col lg:flex-row"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {template?.name || "Template Preview"}
        </DialogTitle>

        <DialogDescription className="sr-only">
          {template?.subject && `Template Preview - ${template.subject}`}
        </DialogDescription>

        {/* Left - Template Preview */}
        <div className="flex-1 flex flex-col bg-muted overflow-hidden relative min-h-0">
          <div className="absolute inset-0 bg-dot opacity-25 z-0" />
          <div className="flex-1 flex items-start justify-center h-full overflow-y-auto p-3 sm:p-4 z-10 relative min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <MocahLoadingIcon isLoading size="sm" />
              </div>
            ) : template?.htmlCode ? (
              <TemplatePreview 
                htmlCode={template.htmlCode} 
                className="max-w-2xl mx-auto w-full" 
                mode="full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No preview available
              </div>
            )}
          </div>
        </div>

        {/* Right - Details & Actions Panel */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-card bg-card flex flex-col max-h-[50vh] lg:max-h-none relative">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b flex items-start sm:items-center justify-between gap-2">
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
              <h3 className="font-semibold text-sm whitespace-nowrap">Template Details</h3>
              <div className="flex flex-wrap gap-2">
                {template?.category && (
                  <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                )}
                {template?.isPremium && (
                  <Badge variant="default" className="gap-1 text-xs">
                    <Crown className="size-3" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 hidden lg:block">
            <div className="space-y-6">
              {/* Template Info */}
              <div className="space-y-2 bg-secondary/50 py-4">
                {template?.subject && (
                  <>
                    <div className="space-y-2 px-4">
                      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Email Subject
                      </h5>
                      <p className="text-sm">{template.subject}</p>
                    </div>
                  </>
                )}

                {template?.previewText && (
                  <>
                    <Separator />
                    <div className="space-y-2 px-4">
                      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Preview Text
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        {template.previewText}
                      </p>
                    </div>
                  </>
                )}
              </div>

              

              {/* Chat History */}
              {(userMessage || assistantMessage) && (
                <div className="space-y-3 px-4">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Message
                  </h5>

                  <div className="space-y-3">
                    {userMessage && (
                      <div>
                        {/* Show attached images for user messages - above the message bubble */}
                        {userImageUrls.length > 0 && (
                          <div className="flex justify-end mb-2">
                            <MessageImageList imageUrls={userImageUrls} />
                          </div>
                        )}
                        
                        <div className="flex gap-3 flex-row-reverse">
                          <div className="p-3 rounded-lg text-sm max-w-[95%] whitespace-pre-wrap bg-secondary text-secondary-foreground">
                            {userMessage.content}
                          </div>
                        </div>
                      </div>
                    )}

                    {assistantMessage && (
                      <div className="flex gap-3">
                        <div className="p-3 rounded-lg text-sm max-w-[95%] whitespace-pre-wrap text-muted-foreground">
                          {assistantMessage.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

           
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 p-4 border-t space-y-2 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:bg-card">
            <Button
              className="w-full order-2 lg:order-1"
              size="lg"
              onClick={handleRemix}
              disabled={
                remixMutation.isPending || !template?.sourceTemplate?.id
              }
            >
              {!session ? (
                <>
                  <LogIn className="size-4 mr-2" />
                  Login to Remix
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-2" />
                  {remixMutation.isPending ? "Remixing..." : "Remix Template"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full order-1 lg:order-2"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Message image list component (similar to chat panel)
interface MessageImageListProps {
  imageUrls: string[];
}

const MessageImageList = ({ imageUrls }: MessageImageListProps) => {
  return (
    <div className="flex gap-2 flex-wrap max-w-full">
      {imageUrls.map((url, idx) => (
        <div
          key={idx}
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border shrink-0"
          title={`Reference image ${idx + 1}`}
        >
          <Image
            src={url}
            alt={`Reference ${idx + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
};
