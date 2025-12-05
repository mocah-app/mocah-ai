"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Briefcase,
  Check,
  Coffee,
  Crown,
  MessageCircle,
  Palette,
  Plus,
  Sparkles,
} from "lucide-react";
import type { BrandKitData } from "../brand-configuration-modal";
import { useState } from "react";

interface BrandPersonalitySectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

const BRAND_VOICES = [
  {
    value: "professional",
    label: "Professional",
    description: "Formal, authoritative, and trustworthy",
    icon: Briefcase,
    example: "We're pleased to announce...",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Friendly, approachable, and conversational",
    icon: Coffee,
    example: "Hey! We've got some news...",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Fun, energetic, and creative",
    icon: Sparkles,
    example: "Guess what? Something awesome...",
  },
  {
    value: "luxury",
    label: "Luxury",
    description: "Elegant, sophisticated, and exclusive",
    icon: Crown,
    example: "We invite you to experience...",
  },
];

const BRAND_TONES = [
  {
    value: "modern",
    label: "Modern",
    description: "Contemporary and forward-thinking",
  },
  {
    value: "traditional",
    label: "Traditional",
    description: "Classic and established",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Business-focused and reliable",
  },
  { value: "casual", label: "Casual", description: "Relaxed and informal" },
  { value: "playful", label: "Playful", description: "Fun and lighthearted" },
  { value: "luxury", label: "Luxury", description: "Premium and exclusive" },
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Clean and simple",
  },
];

const BRAND_ENERGIES = [
  {
    value: "high",
    label: "High Energy",
    description: "Exciting and dynamic",
    color: "bg-orange-500",
  },
  {
    value: "medium",
    label: "Medium Energy",
    description: "Balanced and steady",
    color: "bg-blue-500",
  },
  {
    value: "low",
    label: "Low / Calm",
    description: "Peaceful and relaxed",
    color: "bg-green-500",
  },
];

export function BrandPersonalitySection({
  data,
  onUpdate,
  disabled,
}: BrandPersonalitySectionProps) {
  const [voicePopoverOpen, setVoicePopoverOpen] = useState(false);
  const [tonePopoverOpen, setTonePopoverOpen] = useState(false);
  const [energyPopoverOpen, setEnergyPopoverOpen] = useState(false);

  const selectedVoice = BRAND_VOICES.find((v) => v.value === data.brandVoice);
  const selectedTone = BRAND_TONES.find((t) => t.value === data.brandTone);
  const selectedEnergy = BRAND_ENERGIES.find(
    (e) => e.value === data.brandEnergy
  );

  return (
    <div className="space-y-8 px-6">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">Brand Personality</h3>
        <p className="text-sm text-muted-foreground">
          Define how your brand communicates and connects with your audience
        </p>
      </div>

      {/* Brand Voice */}
      <div className="space-y-4">
        <div>
          <Label className="text-base">Brand Voice</Label>
          <p className="text-xs text-muted-foreground mt-1">
            AI will match this tone when generating email copy
          </p>
        </div>

        {selectedVoice ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
              <selectedVoice.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{selectedVoice.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedVoice.description}
              </p>
            </div>
            <Popover open={voicePopoverOpen} onOpenChange={setVoicePopoverOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={disabled}>
                  Change
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <VoiceSelector
                  selectedValue={data.brandVoice}
                  onSelect={(value) => {
                    onUpdate({ brandVoice: value });
                    setVoicePopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="p-4 rounded-xl border-2 border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 shrink-0">
                  <MessageCircle className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No voice selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Choose how your brand speaks
                  </p>
                </div>
              </div>
              <Popover open={voicePopoverOpen} onOpenChange={setVoicePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Select Voice
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <VoiceSelector
                    selectedValue={data.brandVoice}
                    onSelect={(value) => {
                      onUpdate({ brandVoice: value });
                      setVoicePopoverOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Brand Tone */}
      <div className="space-y-4">
        <div>
          <Label className="text-base">Brand Tone</Label>
          <p className="text-xs text-muted-foreground mt-1">
            The overall style and feel of your brand communication
          </p>
        </div>

        {selectedTone ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
              <Palette className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{selectedTone.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedTone.description}
              </p>
            </div>
            <Popover open={tonePopoverOpen} onOpenChange={setTonePopoverOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={disabled}>
                  Change
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <ToneSelector
                  selectedValue={data.brandTone}
                  onSelect={(value) => {
                    onUpdate({ brandTone: value });
                    setTonePopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="p-4 rounded-xl border-2 border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 shrink-0">
                  <Palette className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No tone selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Choose your brand's communication style
                  </p>
                </div>
              </div>
              <Popover open={tonePopoverOpen} onOpenChange={setTonePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Select Tone
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <ToneSelector
                    selectedValue={data.brandTone}
                    onSelect={(value) => {
                      onUpdate({ brandTone: value });
                      setTonePopoverOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Brand Energy */}
      <div className="space-y-4">
        <div>
          <Label className="text-base">Brand Energy</Label>
          <p className="text-xs text-muted-foreground mt-1">
            The intensity and pace of your brand's communication style
          </p>
        </div>

        {selectedEnergy ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div
              className={`w-10 h-10 rounded-lg ${selectedEnergy.color} shrink-0`}
            />
            <div className="flex-1">
              <p className="font-semibold">{selectedEnergy.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedEnergy.description}
              </p>
            </div>
            <Popover open={energyPopoverOpen} onOpenChange={setEnergyPopoverOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={disabled}>
                  Change
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <EnergySelector
                  selectedValue={data.brandEnergy}
                  onSelect={(value) => {
                    onUpdate({ brandEnergy: value });
                    setEnergyPopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="p-4 rounded-xl border-2 border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
                  <Sparkles className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No energy level selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Set your brand's communication intensity
                  </p>
                </div>
              </div>
              <Popover open={energyPopoverOpen} onOpenChange={setEnergyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Select Energy
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <EnergySelector
                    selectedValue={data.brandEnergy}
                    onSelect={(value) => {
                      onUpdate({ brandEnergy: value });
                      setEnergyPopoverOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Personality Summary */}
      {(data.brandVoice || data.brandTone || data.brandEnergy) && (
        <div className="p-4 rounded-xl border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Your Brand Personality</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.companyName || "Your brand"} communicates with a{" "}
            <span className="font-medium text-foreground">
              {data.brandVoice || "professional"}
            </span>{" "}
            voice,{" "}
            <span className="font-medium text-foreground">
              {data.brandTone || "modern"}
            </span>{" "}
            tone, and{" "}
            <span className="font-medium text-foreground">
              {data.brandEnergy || "medium"}
            </span>{" "}
            energy.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function VoiceSelector({
  selectedValue,
  onSelect,
}: {
  selectedValue: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm p-2">Select Brand Voice</h4>
      <div className="space-y-1 border-t p-2">
        {BRAND_VOICES.map((voice) => {
          const Icon = voice.icon;
          return (
            <Button
              key={voice.value}
              type="button"
              variant={selectedValue === voice.value ? "secondary" : "ghost"}
              className="w-full justify-start h-auto "
              onClick={() => onSelect(voice.value)}
            >
              <div className="flex items-center gap-3 text-left w-full">
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 flex flex-col min-w-0">
                  <span className="font-semibold">{voice.label}</span>
                  <span className="text-xs text-muted-foreground/70">
                    {voice.description}
                  </span>
                  
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function ToneSelector({
  selectedValue,
  onSelect,
}: {
  selectedValue: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm p-2">Select Brand Tone</h4>
      <div className="space-y-1 border-t p-2">
        {BRAND_TONES.map((tone) => (
          <Button
            key={tone.value}
            type="button"
            variant={selectedValue === tone.value ? "secondary" : "ghost"}
            className="w-full justify-start h-auto"
            onClick={() => onSelect(tone.value)}
          >
            <div className="flex items-center gap-3 text-left w-full">
              <Palette className="h-4 w-4 shrink-0" />
              <div className="flex-1 flex flex-col min-w-0">
                <span className="font-semibold">{tone.label}</span>
                <span className="text-xs text-muted-foreground/70">
                  {tone.description}
                </span>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

function EnergySelector({
  selectedValue,
  onSelect,
}: {
  selectedValue: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm p-2">Select Brand Energy</h4>
      <div className="space-y-1 border-t p-2">
        {BRAND_ENERGIES.map((energy) => (
          <Button
            key={energy.value}
            type="button"
            variant={selectedValue === energy.value ? "secondary" : "ghost"}
            className="w-full justify-start h-auto"
            onClick={() => onSelect(energy.value)}
          >
            <div className="flex items-center gap-3 text-left w-full">
              <div
                className={`w-8 h-2 rounded-full ${energy.color} shrink-0`}
              />
              <div className="flex-1 flex flex-col min-w-0">
                <span className="font-semibold">{energy.label}</span>
                <span className="text-xs text-muted-foreground/70">
                  {energy.description}
                </span>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
