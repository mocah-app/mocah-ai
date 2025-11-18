'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';
import { fileToApiFormat, validateImageFile } from '@/lib/file-utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LiveEmailPreview } from '@/components/onboarding/live-email-preview';
import { toast } from 'sonner';
import { BrandForm } from '@/components/brand/brand-form';
import type { BrandFormValues, BrandFormData } from '@/components/brand/brand-form';

export default function BrandSetupPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { createOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BrandFormData | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      const callbackUrl = encodeURIComponent('/brand-setup');
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [session, isPending, router]);

  // tRPC mutation for logo upload
  const uploadLogoMutation = useMutation({
    mutationFn: (data: { file: any; organizationId: string }) =>
      trpc.storage.uploadLogo.mutate(data),
  });

  async function onSubmit(values: BrandFormValues, logoFile: File | null) {
    setIsLoading(true);
    try {
      // Generate slug from brand name
      const slug = values.brandName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create organization first
      const newOrg = await createOrganization({
        name: values.brandName,
        slug: slug,
        metadata: {
          setupCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
      });

      if (!newOrg) {
        throw new Error('Failed to create organization');
      }

      // Upload logo if provided
      let logoUrl = values.logo;
      if (logoFile) {
        // Validate file
        const validation = validateImageFile(logoFile);
        if (!validation.valid) {
          toast.error(validation.error);
          setIsLoading(false);
          return;
        }

        // Convert file to API format
        const fileData = await fileToApiFormat(logoFile);

        const uploadResult = await uploadLogoMutation.mutateAsync({
          file: fileData,
          organizationId: newOrg.id,
        });
        logoUrl = uploadResult.url;
      }

      // Create BrandKit and update organization with logo via tRPC
      await trpc.organization.updateWithBrandKit.mutate({
        organizationId: newOrg.id,
        organization: {
          logo: logoUrl,
        },
        brandKit: {
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          fontFamily: values.fontFamily,
          brandVoice: values.brandVoice,
          logo: logoUrl,
        },
      });

      toast.success('Brand created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create brand');
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the page if not authenticated (redirect will happen)
  if (!session?.user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="border-b bg-background">
        <div className="container py-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Create Your Brand</span>
            <span>Step 1 of 1</span>
          </div>
          <Progress value={100} />
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid lg:grid-cols-2 gap-0">
          {/* Left Side - Form */}
          <div className="overflow-y-auto p-8 lg:p-12 bg-background">
            <div className="max-w-xl mx-auto">
              <div className="space-y-2 mb-6">
                <h1 className="text-3xl font-bold">Let's set up your brand</h1>
                <p className="text-muted-foreground">
                  Watch your brand come to life in the preview as you fill out the details
                </p>
              </div>

              <BrandForm
                defaultValues={{
                  brandName: '',
                  primaryColor: '#3B82F6',
                  secondaryColor: '#10B981',
                  fontFamily: 'Arial, sans-serif',
                  brandVoice: 'professional',
                }}
                onSubmit={onSubmit}
                onFormChange={setFormData}
                isLoading={isLoading}
                submitButtonText="Create Brand"
                submitButtonLoadingText="Creating..."
                showSecondaryButton={true}
                secondaryButtonText="Skip for Now"
                onSecondaryButtonClick={() => router.push('/dashboard')}
                showAvatar={false}
                className="space-y-6"
              />
            </div>
          </div>

          {/* Right Side - Live Preview */}
          <div className="hidden lg:block overflow-y-auto bg-muted/50 p-8">
            <LiveEmailPreview
              brand={{
                brandName: formData?.values.brandName || 'Your Brand',
                primaryColor: formData?.values.primaryColor || '#3B82F6',
                secondaryColor: formData?.values.secondaryColor || '#10B981',
                fontFamily: formData?.values.fontFamily || 'Arial, sans-serif',
                logo: formData?.logoPreview || undefined,
                brandVoice: formData?.values.brandVoice || 'professional',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

