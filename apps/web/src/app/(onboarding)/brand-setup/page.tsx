'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LiveEmailPreview } from '@/components/onboarding/live-email-preview';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const brandSetupSchema = z.object({
  brandName: z.string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(50, 'Brand name must be less than 50 characters'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  fontFamily: z.string().min(1, 'Please select a font'),
  brandVoice: z.enum(['professional', 'casual', 'playful', 'luxury']),
  logo: z.string().optional(),
});

type BrandSetupFormValues = z.infer<typeof brandSetupSchema>;

const EMAIL_SAFE_FONTS = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Impact, sans-serif',
  'Palatino, serif',
  'Garamond, serif',
  'Tahoma, sans-serif',
];

export default function BrandSetupPage() {
  const router = useRouter();
  const { createOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const form = useForm<BrandSetupFormValues>({
    resolver: zodResolver(brandSetupSchema),
    defaultValues: {
      brandName: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      fontFamily: 'Arial, sans-serif',
      brandVoice: 'professional',
    },
  });

  // Watch form values for live preview
  const watchedValues = form.watch();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function uploadLogo(file: File): Promise<string> {
    // TODO: Implement Tigris upload
    // For now, return the preview URL
    // In production, upload to Tigris and return the public URL
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Logo upload error:', error);
      // Fallback to preview URL for now
      return logoPreview;
    }
  }

  async function onSubmit(values: BrandSetupFormValues) {
    setIsLoading(true);
    try {
      // Upload logo if provided
      let logoUrl = values.logo;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      // Generate slug from brand name
      const slug = values.brandName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create organization
      await createOrganization({
        name: values.brandName,
        slug: slug,
        logo: logoUrl, // Add logo at top level
        metadata: {
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          fontFamily: values.fontFamily,
          brandVoice: values.brandVoice,
          logo: logoUrl, // Keep in metadata for backwards compatibility
          setupCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
      });

      // TODO: Create BrandKit via tRPC after organization is created
      // For now, metadata stores brand data

      toast.success('Brand created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create brand');
    } finally {
      setIsLoading(false);
    }
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
            <div className="max-w-xl mx-auto space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Let's set up your brand</h1>
                <p className="text-muted-foreground">
                  Watch your brand come to life in the preview as you fill out the details
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Brand Name */}
                  <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Fashion Brand"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          The name of your brand or client
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Logo Upload */}
                  <FormItem>
                    <FormLabel>Logo (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            disabled={isLoading}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {logoFile ? 'Change Logo' : 'Upload Logo'}
                          </Button>
                          {logoFile && (
                            <span className="text-sm text-muted-foreground">
                              {logoFile.name}
                            </span>
                          )}
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={isLoading}
                          />
                        </div>
                        {logoPreview && (
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-12 w-12 object-contain"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview('');
                              }}
                              disabled={isLoading}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      PNG, JPG, or SVG. Recommended size: 200x200px
                    </FormDescription>
                  </FormItem>

                  {/* Primary Color */}
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              {...field}
                              className="w-20 h-10 cursor-pointer"
                              disabled={isLoading}
                            />
                            <Input
                              type="text"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="#3B82F6"
                              className="flex-1"
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your main brand color used throughout templates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Secondary Color */}
                  <FormField
                    control={form.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              {...field}
                              className="w-20 h-10 cursor-pointer"
                              disabled={isLoading}
                            />
                            <Input
                              type="text"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="#10B981"
                              className="flex-1"
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Used for buttons and accents
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Font Family */}
                  <FormField
                    control={form.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Family *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EMAIL_SAFE_FONTS.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>
                                  {font.split(',')[0]}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Email-safe fonts that work across all email clients
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Brand Voice */}
                  <FormField
                    control={form.control}
                    name="brandVoice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Voice *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="professional">
                              <div className="space-y-1">
                                <div className="font-semibold">Professional</div>
                                <div className="text-xs text-muted-foreground">
                                  Formal and authoritative
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="casual">
                              <div className="space-y-1">
                                <div className="font-semibold">Casual</div>
                                <div className="text-xs text-muted-foreground">
                                  Friendly and conversational
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="playful">
                              <div className="space-y-1">
                                <div className="font-semibold">Playful</div>
                                <div className="text-xs text-muted-foreground">
                                  Fun and energetic
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="luxury">
                              <div className="space-y-1">
                                <div className="font-semibold">Luxury</div>
                                <div className="text-xs text-muted-foreground">
                                  Elegant and sophisticated
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          AI will match this tone when generating copy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Actions */}
                  <div className="flex gap-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Skip for Now
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Brand'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          {/* Right Side - Live Preview */}
          <div className="hidden lg:block overflow-y-auto bg-muted/50 p-8">
            <LiveEmailPreview
              brand={{
                brandName: watchedValues.brandName || 'Your Brand',
                primaryColor: watchedValues.primaryColor,
                secondaryColor: watchedValues.secondaryColor,
                fontFamily: watchedValues.fontFamily,
                logo: logoPreview || undefined,
                brandVoice: watchedValues.brandVoice,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

