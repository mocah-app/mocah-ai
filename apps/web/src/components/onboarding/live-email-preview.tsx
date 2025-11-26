"use client";

import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { getContrastTextColor, isLightColor } from "@/lib/color-utils";

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

  // Calculate appropriate text colors for accessibility
  const primaryTextColor = getContrastTextColor(primaryColor);
  const secondaryTextColor = getContrastTextColor(secondaryColor || primaryColor);
  const buttonBgColor = secondaryColor || primaryColor;
  const buttonTextColor = getContrastTextColor(buttonBgColor);
  
  // For text on white background: use black if primaryColor is light, otherwise use primaryColor
  const greetingTextColor = isLightColor(primaryColor) ? "#000000" : primaryColor;

  return (
    <div className="h-full flex flex-col space-y-4 bg-secondary ">
      {/* Email Client Mockup */}
      <Card className="flex-1 overflow-hidden p-0 -rotate-3 rounded-none">
        <div className="h-full overflow-auto">
          <div className="flex gap-2 p-1 px-4">
            <div className="bg-red-500 h-3 w-3 rounded-full" />
            <div className="bg-green-500 h-3 w-3 rounded-full" />
            <div className="bg-blue-500 h-3 w-3 rounded-full" />
          </div>
          {/* Email Header */}
          <div className="border-b p-4 bg-muted/50">
            <div className="space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground">From:</span>
                <span className="text-foreground">{brandName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Subject:</span>
                <span className="text-foreground">{content.subject}</span>
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
                    <span
                      className="text-2xl font-bold"
                      style={{ color: primaryTextColor }}
                    >
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
                  style={{ color: greetingTextColor }}
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
                    className="px-8 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                    }}
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
