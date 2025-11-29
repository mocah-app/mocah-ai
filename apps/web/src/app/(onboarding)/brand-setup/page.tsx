"use client";

import { EMAIL_SAFE_FONTS } from "@/components/brand-kit/brand-form";
import Loader from "@/components/loader";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import { LiveEmailPreview } from "@/components/onboarding/live-email-preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOrganization } from "@/contexts/organization-context";
import { authClient } from "@/lib/auth-client";
import { fileToApiFormat, validateImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


// LocalStorage key for tracking the onboarding organization
const ONBOARDING_ORG_KEY = "mocah_onboarding_org_id";

// --- Types & Schemas ---

const workspaceSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(50),
  // Slug is auto-generated, not user input
  logo: z.string().optional(),
});

const brandSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .optional(),
  fontFamily: z.string().min(1, "Please select a font"),
  brandVoice: z.enum(["professional", "casual", "playful", "luxury"]),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;
type BrandFormValues = z.infer<typeof brandSchema>;

// Add orgId to type to fix linter error
type WorkspaceData = WorkspaceFormValues & { slug: string; orgId?: string };

function BrandSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const { createOrganization, refreshOrganizations } = useOrganization();

  // Get step from URL, default to 1
  const urlStep = searchParams.get("step");
  const [step, setStep] = useState<1 | 2>(urlStep === "2" ? 2 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false); // Track if we're recovering data

  // State to hold data across steps
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(
    null
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploaded, setLogoUploaded] = useState(false); // Track if current logo was uploaded
  const [brandData, setBrandData] = useState<BrandFormValues>({
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    fontFamily: "Arial, sans-serif",
    brandVoice: "professional",
  });

  // Sync step to URL
  const updateStep = (newStep: 1 | 2) => {
    setStep(newStep);
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", newStep.toString());
    router.replace(`/brand-setup?${params.toString()}`, { scroll: false });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      const callbackUrl = encodeURIComponent("/brand-setup");
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [session, isPending, router]);

  // Initialize: Check if there's an existing onboarding session when landing on step 1
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (step === 1 && !workspaceData && !isRecovering && session?.user) {
        const onboardingOrgId = localStorage.getItem(ONBOARDING_ORG_KEY);

        if (onboardingOrgId) {
          // There's an existing onboarding session, try to recover it
          setIsRecovering(true);
          try {
            const org = await trpcClient.organization.getById.query({
              organizationId: onboardingOrgId,
            });

            if (org) {
              // Successfully recovered, populate the form
              setWorkspaceData({
                name: org.name,
                slug: org.slug,
                logo: org.logo || undefined,
                orgId: org.id,
              });

              // Pre-fill form
              workspaceForm.setValue("name", org.name);
              if (org.logo) {
                workspaceForm.setValue("logo", org.logo);
              }

              // If brand kit exists, populate that too
              if (org.brandKit) {
                setBrandData({
                  primaryColor: org.brandKit.primaryColor || "#3B82F6",
                  secondaryColor: org.brandKit.secondaryColor || "#10B981",
                  fontFamily: org.brandKit.fontFamily || "Arial, sans-serif",
                  brandVoice:
                    (org.brandKit
                      .brandVoice as BrandFormValues["brandVoice"]) ||
                    "professional",
                });
              }
            } else {
              // Organization doesn't exist anymore, clear localStorage
              localStorage.removeItem(ONBOARDING_ORG_KEY);
            }
          } catch (error) {
            console.error(
              "Failed to recover previous onboarding session:",
              error
            );
            // Clear invalid localStorage entry
            localStorage.removeItem(ONBOARDING_ORG_KEY);
          } finally {
            setIsRecovering(false);
          }
        }
      }
    };

    initializeOnboarding();
  }, [step, workspaceData, session, isRecovering]);

  // Recover workspace data if loading on step 2 (e.g., after refresh)
  useEffect(() => {
    const recoverWorkspaceData = async () => {
      if (step === 2 && !workspaceData && !isRecovering) {
        // Check if there's an onboarding org ID in localStorage
        const onboardingOrgId = localStorage.getItem(ONBOARDING_ORG_KEY);

        if (!onboardingOrgId) {
          // No onboarding in progress, redirect back to step 1
          toast.error("Please complete step 1 first");
          updateStep(1);
          return;
        }

        setIsRecovering(true);
        try {
          // Fetch the organization created in step 1
          const org = await trpcClient.organization.getById.query({
            organizationId: onboardingOrgId,
          });

          if (org) {
            setWorkspaceData({
              name: org.name,
              slug: org.slug,
              logo: org.logo || undefined,
              orgId: org.id,
            });

            // If there's an existing brand kit, populate the form
            if (org.brandKit) {
              setBrandData({
                primaryColor: org.brandKit.primaryColor || "#3B82F6",
                secondaryColor: org.brandKit.secondaryColor || "#10B981",
                fontFamily: org.brandKit.fontFamily || "Arial, sans-serif",
                brandVoice:
                  (org.brandKit.brandVoice as BrandFormValues["brandVoice"]) ||
                  "professional",
              });
            }
          } else {
            // Organization not found, clear localStorage and go back
            localStorage.removeItem(ONBOARDING_ORG_KEY);
            toast.error("Workspace not found. Please start over.");
            updateStep(1);
          }
        } catch (error) {
          console.error("Failed to recover workspace data:", error);
          // Clear localStorage and redirect back to step 1
          localStorage.removeItem(ONBOARDING_ORG_KEY);
          toast.error("Failed to load workspace. Please start over.");
          updateStep(1);
        } finally {
          setIsRecovering(false);
        }
      }
    };

    recoverWorkspaceData();
  }, [step, workspaceData, isRecovering]);

  // tRPC mutation for logo upload
  const uploadLogoMutation = useMutation({
    mutationFn: (data: { file: any; organizationId: string }) =>
      trpcClient.storage.uploadLogo.mutate(data),
  });

  // --- Step 1: Workspace ---

  const workspaceForm = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      logo: "",
    },
  });

  // Pre-fill form when going back to step 1 with existing data
  useEffect(() => {
    if (step === 1 && workspaceData) {
      workspaceForm.setValue("name", workspaceData.name);
      if (workspaceData.logo) {
        workspaceForm.setValue("logo", workspaceData.logo);
      }
    }
  }, [step, workspaceData]);

  // Update live preview when workspace form changes
  const watchedName = workspaceForm.watch("name");
  const watchedLogo = workspaceForm.watch("logo");
  useEffect(() => {
    if (step === 1) {
      const name = workspaceForm.getValues("name");
      const logo = workspaceForm.getValues("logo");
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      // We don't update orgId here, just preview data
      setWorkspaceData((prev) => ({
        ...prev,
        name,
        logo: logo || undefined,
        slug,
        orgId: prev?.orgId,
      }));
    }
  }, [watchedName, watchedLogo, step]);

  // --- Step 2: Brand ---

  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: brandData,
  });

  // Update live preview when brand form changes
  const watchedBrandValues = brandForm.watch();
  useEffect(() => {
    setBrandData(watchedBrandValues as BrandFormValues);
  }, [JSON.stringify(watchedBrandValues)]);

  // --- Main Handlers ---

  const handleStep1Submit = async (values: WorkspaceFormValues) => {
    setIsLoading(true);
    try {
      // Generate slug
      const slug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      let orgId = workspaceData?.orgId;
      let logoUrl = workspaceData?.logo || "";
      let logoChanged = false;

      // Check if organization already exists (user went back)
      if (workspaceData?.orgId) {
        // Only upload logo if it's a new file that hasn't been uploaded yet
        if (logoFile && !logoUploaded) {
          const fileData = await fileToApiFormat(logoFile);
          const uploadResult = await uploadLogoMutation.mutateAsync({
            file: fileData,
            organizationId: workspaceData.orgId,
          });
          logoUrl = uploadResult.url;
          setLogoUploaded(true);
          logoChanged = true;
        } else if (!logoFile && !values.logo && workspaceData.logo) {
          // Logo was removed (had a logo before, now doesn't)
          logoUrl = "";
          logoChanged = true;
        }

        // Update existing organization (only include logo if it changed)
        const updateData: any = {
          organizationId: workspaceData.orgId,
          name: values.name,
          slug: slug,
        };
        if (logoChanged) {
          updateData.logo = logoUrl;
        }

        await trpcClient.organization.update.mutate(updateData);

        // Refresh organizations if logo changed to update the UI
        if (logoChanged) {
          await refreshOrganizations(workspaceData.orgId);
        }

        // Ensure localStorage still has this org ID
        localStorage.setItem(ONBOARDING_ORG_KEY, workspaceData.orgId);
      } else {
        // 1. Create Organization
        const newOrg = await createOrganization({
          name: values.name,
          slug: slug,
          metadata: {
            setupCompleted: false, // Not complete yet
            onboardingCompletedAt: undefined,
          },
        });

        if (!newOrg) throw new Error("Failed to create organization");
        orgId = newOrg.id;

        // Store the org ID in localStorage for recovery on refresh
        localStorage.setItem(ONBOARDING_ORG_KEY, newOrg.id);

        // 2. Upload Logo if exists
        if (logoFile && !logoUploaded) {
          const fileData = await fileToApiFormat(logoFile);
          const uploadResult = await uploadLogoMutation.mutateAsync({
            file: fileData,
            organizationId: newOrg.id,
          });
          logoUrl = uploadResult.url;
          setLogoUploaded(true);

          // Update organization with the logo immediately so the UI can reflect it
          await trpcClient.organization.update.mutate({
            organizationId: newOrg.id,
            logo: logoUrl,
          });

          // Refresh organizations to get the updated logo in context state
          await refreshOrganizations(newOrg.id);
        }
      }

      // Update workspace data with real ID and logo URL
      setWorkspaceData({ ...values, slug, logo: logoUrl, orgId });

      // Move to step 2
      updateStep(2);
    } catch (error: any) {
      toast.error(error.message || "Failed to save workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (values: BrandFormValues) => {
    if (!workspaceData?.orgId) {
      toast.error("Missing workspace data");
      return;
    }

    const orgId = workspaceData.orgId;
    setIsLoading(true);

    try {
      // 3. Update Organization with Brand Kit and mark complete
      await trpcClient.organization.updateWithBrandKit.mutate({
        organizationId: orgId,
        organization: {
          logo: workspaceData.logo || undefined, // Use the uploaded URL or undefined if explicitly empty
          metadata: {
            setupCompleted: true,
            onboardingCompletedAt: new Date().toISOString(),
          },
        },
        brandKit: {
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          fontFamily: values.fontFamily,
          brandVoice: values.brandVoice,
          logo: workspaceData.logo || undefined,
        },
      });

      // Clear the onboarding org ID from localStorage since we're done
      localStorage.removeItem(ONBOARDING_ORG_KEY);

      toast.success("Workspace setup complete!");

      // Refresh organization data to reflect the updated logo and brand kit
      await refreshOrganizations(orgId);

      router.push("/app");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Utility Handlers ---

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setLogoFile(file);
      setLogoUploaded(false); // Mark as not uploaded since it's a new file
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        workspaceForm.setValue("logo", result);
        // Also update workspaceData immediately for preview if in step 1
        if (step === 1) {
          const currentName = workspaceForm.getValues("name");
          const slug = currentName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          setWorkspaceData((prev) => ({
            ...prev,
            name: currentName,
            logo: result,
            slug,
            orgId: prev?.orgId,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoUploaded(false);
    workspaceForm.setValue("logo", "");
    if (step === 1) {
      if (workspaceData) {
        setWorkspaceData({ ...workspaceData, logo: undefined });
      }
    }
  };

  // Show loading state while checking authentication or recovering data
  if (isPending || isRecovering) {
    return (
      <div className="h-screen flex-1 flex items-center justify-center">
        <MocahLoadingIcon />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="h-screen flex flex-col w-full">
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid lg:grid-cols-2 gap-0">
          {/* Left Side - Form */}
          <div className="overflow-y-auto bg-background px-4 py-8 md:px-12 flex flex-col justify-center">
            <div className="max-w-lg w-full mx-auto space-y-0 relative">
              {/* Header */}
              <Card className="rounded-b-none gap-0 p-0 pb-12 relative translate-y-4">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border text-xs",
                        step === 1
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-primary"
                      )}
                    >
                      {step > 1 ? <Check className="w-3 h-3" /> : "1"}
                    </span>
                    <span>Name</span>
                  </div>
                  <div className="w-px h-4 bg-border" />

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border text-xs",
                        step === 2
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-primary"
                      )}
                    >
                      2
                    </span>
                    <span className={step === 2 ? "text-foreground" : ""}>
                      Voice
                    </span>
                  </div>
                </div>

                <Separator />

                <CardContent className="p-0 pt-2 text-center">
                  <h1 className="text-xl font-bold tracking-tight">
                    {step === 1
                      ? "Create your brand workspace"
                      : "Set up your brand"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {step === 1
                      ? "Set up a shared workspace to manage your templates."
                      : "Customize your brand identity to ensure consistency."}
                  </p>
                </CardContent>
              </Card>

              {/* Step 1: Workspace Form */}
              {step === 1 && (
                <Form {...workspaceForm}>
                  <form
                    onSubmit={workspaceForm.handleSubmit(handleStep1Submit)}
                    className="space-y-6 shadow-2xl rounded-xl border p-0 relative z-20 bg-card"
                  >
                    <FormField
                      control={workspaceForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="border-b pb-4 px-4 pt-4">
                          <FormLabel>Brand Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acme Inc."
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={workspaceForm.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem className="pb-4 px-4">
                          <FormLabel>Brand Logo</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border">
                                  <AvatarImage src={field.value} />
                                  <AvatarFallback>
                                    {workspaceForm.watch("name")?.charAt(0) ||
                                      "W"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        document
                                          .getElementById("logo-upload")
                                          ?.click()
                                      }
                                      disabled={isLoading}
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload image
                                    </Button>
                                    {field.value && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveLogo}
                                        disabled={isLoading}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Recommended size: 160x160px. Max file size:
                                    5MB.
                                  </p>
                                  <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    disabled={isLoading}
                                  />
                                </div>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="px-4 pb-4">
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader />
                            {workspaceData?.orgId
                              ? "Updating..."
                              : "Creating brand..."}
                          </>
                        ) : (
                          <>
                            {workspaceData?.orgId
                              ? "Save and continue"
                              : "Create and continue"}{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* Step 2: Brand Form */}
              {step === 2 && (
                <Form {...brandForm}>
                  <form
                    onSubmit={brandForm.handleSubmit(handleStep2Submit)}
                    className="space-y-6 shadow-2xl rounded-xl border p-0 pt-4 relative z-20 bg-card"
                  >
                    <FormField
                      control={brandForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem className="border-b pb-4 px-4 pt-4">
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                {...field}
                                className="w-20 h-10 cursor-pointer"
                                disabled={isLoading}
                              />
                              <Input
                                {...field}
                                placeholder="#3B82F6"
                                className="flex-1"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={brandForm.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem className="border-b pb-4 px-4">
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                {...field}
                                className="w-20 h-10 cursor-pointer"
                                disabled={isLoading}
                              />
                              <Input
                                {...field}
                                placeholder="#10B981"
                                className="flex-1"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pb-4 px-4 border-b">
                      <FormField
                        control={brandForm.control}
                        name="fontFamily"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Font Family</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EMAIL_SAFE_FONTS.map((font) => (
                                  <SelectItem key={font} value={font}>
                                    <span style={{ fontFamily: font }}>
                                      {font.split(",")[0]}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={brandForm.control}
                        name="brandVoice"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Brand Voice</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a voice" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="professional">
                                  Professional
                                </SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="playful">Playful</SelectItem>
                                <SelectItem value="luxury">Luxury</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-3 px-4 pb-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateStep(1)}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader />
                            Finishing...
                          </>
                        ) : (
                          "Complete Setup"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </div>

          {/* Right Side - Live Preview */}
          <div className="hidden lg:block overflow-y-auto bg-muted/50 p-8">
            <LiveEmailPreview
              brand={{
                brandName: workspaceData?.name || "Your Brand",
                primaryColor: brandData.primaryColor,
                secondaryColor: brandData.secondaryColor,
                fontFamily: brandData.fontFamily,
                logo: workspaceData?.logo || undefined,
                brandVoice: brandData.brandVoice,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrandSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex-1 flex items-center justify-center">
          <MocahLoadingIcon />
        </div>
      }
    >
      <BrandSetupContent />
    </Suspense>
  );
}
