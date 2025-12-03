"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { BrandKitData } from "../brand-configuration-modal";
import { Globe, Mail, Calendar, Building2, Users, ExternalLink } from "lucide-react";

interface BrandCompanySectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

export function BrandCompanySection({
  data,
  onUpdate,
  disabled,
}: BrandCompanySectionProps) {
  return (
    <div className="space-y-8 px-6">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">Company Details</h3>
        <p className="sr-only">
          Business information used for context in email generation
        </p>
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="websiteUrl" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Website URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="websiteUrl"
            value={data.websiteUrl || ""}
            onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
            placeholder="https://yourcompany.com"
            disabled={disabled}
            className="flex-1"
          />
          {data.websiteUrl && (
            <a
              href={data.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border px-3 hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Your main company website
        </p>
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <Label htmlFor="industry" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Industry
        </Label>
        <Input
          id="industry"
          value={data.industry || ""}
          onChange={(e) => onUpdate({ industry: e.target.value })}
          placeholder="e.g., Technology, Healthcare, E-commerce"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Helps AI understand your business context
        </p>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="targetAudience" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Target Audience
        </Label>
        <Input
          id="targetAudience"
          value={data.targetAudience || ""}
          onChange={(e) => onUpdate({ targetAudience: e.target.value })}
          placeholder="e.g., Tech professionals, small business owners"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Who your emails are primarily for
        </p>
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <Label htmlFor="contactEmail" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact Email
        </Label>
        <Input
          id="contactEmail"
          type="email"
          value={data.contactEmail || ""}
          onChange={(e) => onUpdate({ contactEmail: e.target.value })}
          placeholder="contact@yourcompany.com"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Primary contact email for your business
        </p>
      </div>

      {/* Founding Year */}
      <div className="space-y-2">
        <Label htmlFor="foundingYear" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Founding Year
        </Label>
        <Input
          id="foundingYear"
          value={data.foundingYear || ""}
          onChange={(e) => onUpdate({ foundingYear: e.target.value })}
          placeholder="e.g., 2020"
          maxLength={4}
          disabled={disabled}
          className="w-32"
        />
        <p className="text-xs text-muted-foreground">
          When your company was established
        </p>
      </div>

      {/* Company Summary Card */}
      {(data.companyName || data.industry || data.targetAudience) && (
        <div className="p-4 rounded-xl border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Company Profile</p>
          </div>
          <div className="space-y-2 text-sm">
            {data.companyName && (
              <p>
                <span className="text-muted-foreground">Company:</span>{" "}
                <span className="font-medium">{data.companyName}</span>
              </p>
            )}
            {data.industry && (
              <p>
                <span className="text-muted-foreground">Industry:</span>{" "}
                <Badge variant="secondary">{data.industry}</Badge>
              </p>
            )}
            {data.targetAudience && (
              <p>
                <span className="text-muted-foreground">Audience:</span>{" "}
                <span>{data.targetAudience}</span>
              </p>
            )}
            {data.foundingYear && (
              <p>
                <span className="text-muted-foreground">Since:</span>{" "}
                <span>{data.foundingYear}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

