"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import type { FieldPath, UseFormReturn } from "react-hook-form";

// ============================================================================
// Types
// ============================================================================

/**
 * Schema for extended brand fields that can be edited in the accordion.
 * Forms using BrandExtendedFields must include these optional fields.
 */
export interface ExtendedBrandFieldsSchema {
  // Company Info
  tagline?: string;
  companyDescription?: string;
  industry?: string;
  targetAudience?: string;
  
  // Extended Colors
  backgroundColor?: string;
  textPrimaryColor?: string;
  
  // Layout
  borderRadius?: string;
  
  // Brand Personality
  brandTone?: string;
  brandEnergy?: string;
}

/**
 * Props for the BrandExtendedFields component.
 * Generic type T must extend ExtendedBrandFieldsSchema.
 */
interface BrandExtendedFieldsProps<T extends ExtendedBrandFieldsSchema> {
  form: UseFormReturn<T>;
  disabled?: boolean;
  showConfidence?: boolean;
  confidence?: number | null;
}

// ============================================================================
// Constants
// ============================================================================

const BRAND_TONES = [
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Traditional" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Playful" },
  { value: "luxury", label: "Luxury" },
  { value: "minimalist", label: "Minimalist" },
];

const BRAND_ENERGIES = [
  { value: "high", label: "High Energy" },
  { value: "medium", label: "Medium Energy" },
  { value: "low", label: "Low / Calm" },
];

// ============================================================================
// Component
// ============================================================================

export function BrandExtendedFields<T extends ExtendedBrandFieldsSchema>({
  form,
  disabled = false,
  showConfidence = false,
  confidence,
}: BrandExtendedFieldsProps<T>) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {/* Company Details */}
      <AccordionItem value="company">
        <AccordionTrigger className="text-sm font-medium">
          Company Details
          {showConfidence && confidence && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <FormField
            control={form.control}
            name={"tagline" as FieldPath<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as string) || ""}
                    placeholder="Your brand's tagline or slogan"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"companyDescription" as FieldPath<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={(field.value as string) || ""}
                    placeholder="Brief description of your company"
                    disabled={disabled}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  This helps AI generate more relevant email content.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"industry" as FieldPath<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as string) || ""}
                    placeholder="e.g., Technology, Healthcare, E-commerce"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"targetAudience" as FieldPath<T>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Audience</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as string) || ""}
                    placeholder="e.g., Tech professionals, small business owners"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </AccordionContent>
      </AccordionItem>

      {/* Extended Styling */}
      <AccordionItem value="styling">
        <AccordionTrigger className="text-sm font-medium">
          Extended Styling
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={"backgroundColor" as FieldPath<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={(field.value as string) || "#FFFFFF"}
                        onChange={field.onChange}
                        className="w-12 h-10 cursor-pointer p-1"
                        disabled={disabled}
                      />
                      <Input
                        {...field}
                        value={(field.value as string) || ""}
                        placeholder="#FFFFFF"
                        className="flex-1 font-mono text-sm"
                        disabled={disabled}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={"textPrimaryColor" as FieldPath<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={(field.value as string) || "#000000"}
                        onChange={field.onChange}
                        className="w-12 h-10 cursor-pointer p-1"
                        disabled={disabled}
                      />
                      <Input
                        {...field}
                        value={(field.value as string) || ""}
                        placeholder="#000000"
                        className="flex-1 font-mono text-sm"
                        disabled={disabled}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={"borderRadius" as FieldPath<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Border Radius</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ""}
                      placeholder="8px"
                      className="font-mono text-sm"
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Brand Personality */}
      <AccordionItem value="personality">
        <AccordionTrigger className="text-sm font-medium">
          Brand Personality
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={"brandTone" as FieldPath<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Tone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={(field.value as string) || ""}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BRAND_TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={"brandEnergy" as FieldPath<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Energy</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={(field.value as string) || ""}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select energy level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BRAND_ENERGIES.map((energy) => (
                        <SelectItem key={energy.value} value={energy.value}>
                          {energy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

