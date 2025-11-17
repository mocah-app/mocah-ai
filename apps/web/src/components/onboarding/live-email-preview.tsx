"use client";

import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface BrandPreview {
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logo?: string;
  brandVoice?: string;
}

export function LiveEmailPreview({ brand }: { brand: BrandPreview }) {
  const {
    brandName = "Your Brand",
    primaryColor = "#3B82F6",
    secondaryColor = "#10B981",
    fontFamily = "Arial, sans-serif",
    logo,
    brandVoice = "professional",
  } = brand;

  // Sample email content based on brand voice
  const sampleContent = {
    professional: {
      subject: "Welcome to Our Platform",
      greeting: "Dear Valued Customer,",
      body: "Thank you for joining us. We look forward to serving you with excellence.",
      cta: "Get Started",
    },
    casual: {
      subject: "Hey there! Welcome aboard 👋",
      greeting: "Hi friend!",
      body: "We're so excited to have you here. Let's make something awesome together!",
      cta: "Let's Go",
    },
    playful: {
      subject: "🎉 Woohoo! You're in!",
      greeting: "Hey superstar!",
      body: "Get ready for an amazing adventure! We've got so many cool things in store for you.",
      cta: "Start the Fun",
    },
    luxury: {
      subject: "Welcome to Exclusivity",
      greeting: "Distinguished Guest,",
      body: "You have been granted access to our curated collection. Experience elegance redefined.",
      cta: "Explore Collection",
    },
  };

  const content =
    sampleContent[brandVoice as keyof typeof sampleContent] ||
    sampleContent.professional;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Preview Label */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>Live Preview</span>
      </div>

      {/* Email Client Mockup */}
      <Card className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* Email Header */}
          <div className="border-b p-4 bg-muted/50">
            <div className="space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold">From:</span>
                <span>{brandName}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Subject:</span>
                <span>{content.subject}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-8" style={{ fontFamily }}>
            {/* Email Container */}
            <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm border">
              {/* Header */}
              <div
                className="p-6 text-center"
                style={{ backgroundColor: primaryColor }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={brandName}
                    className="h-12 mx-auto object-contain"
                  />
                ) : (
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {brandName}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Greeting */}
                <h2
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {content.greeting}
                </h2>

                {/* Body Text */}
                <p className="text-base leading-relaxed text-gray-700">
                  {content.body}
                </p>

                {/* CTA Button */}
                <div className="pt-4">
                  <button
                    className="px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: secondaryColor || primaryColor }}
                  >
                    {content.cta}
                  </button>
                </div>

                {/* Feature Highlights */}
                <div className="pt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2"
                      style={{
                        backgroundColor: secondaryColor || primaryColor,
                      }}
                    />
                    <p className="text-sm text-gray-600">
                      AI-powered template generation
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2"
                      style={{
                        backgroundColor: secondaryColor || primaryColor,
                      }}
                    />
                    <p className="text-sm text-gray-600">
                      Beautiful, responsive designs
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2"
                      style={{
                        backgroundColor: secondaryColor || primaryColor,
                      }}
                    />
                    <p className="text-sm text-gray-600">
                      Export to any platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 text-center text-sm text-gray-500 space-y-2">
                <p>© 2025 {brandName}. All rights reserved.</p>
                <p className="text-xs">
                  This is a preview of how your brand will look in emails
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
