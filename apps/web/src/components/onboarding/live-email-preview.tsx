"use client";

import { Card } from "@/components/ui/card";
import { getContrastTextColor, isLightColor } from "@/lib/color-utils";

interface BrandPreview {
  brandName?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  logo?: string;
  brandVoice?: string;
}

export function LiveEmailPreview({ brand }: { brand: BrandPreview }) {
  const {
    brandName = "Your Brand",
    primaryColor = "#3B82F6",
    accentColor = "#10B981",
    backgroundColor = "#FFFFFF",
    textColor = "#374151",
    borderRadius = "8px",
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
  const accentTextColor = getContrastTextColor(accentColor || primaryColor);
  const buttonBgColor = accentColor || primaryColor;
  const buttonTextColor = getContrastTextColor(buttonBgColor);
  
  // Determine text colors based on backgroundColor for proper contrast
  const bgIsLight = isLightColor(backgroundColor);
  const primaryIsLight = isLightColor(primaryColor);
  const textIsLight = isLightColor(textColor);
  
  // Greeting: use primaryColor if it contrasts with bg, otherwise use black/white
  const greetingTextColor = bgIsLight === primaryIsLight 
    ? (bgIsLight ? "#000000" : "#FFFFFF")
    : primaryColor;
  
  // Body text: use textColor if it contrasts with bg, otherwise use black/white
  const bodyTextColor = bgIsLight === textIsLight
    ? (bgIsLight ? "#374151" : "#E5E7EB") // Fallback gray tones for contrast
    : textColor;

  return (
    <div className=" flex flex-col space-y-4 bg-card dark:bg-white/35 max-w-md mx-auto p-2 rounded-3xl shadow-2xl">
      {/* Email Client Mockup */}
      <Card className="flex-1 overflow-hidden p-0 relative border border-gray-200">
        <div className="h-full overflow-auto relative">
          <div className="flex gap-2 p-2 px-4 border-b bg-white border-gray-200">
            <div className="bg-red-500 h-3 w-3 rounded-full" />
            <div className="bg-green-500 h-3 w-3 rounded-full" />
            <div className="bg-blue-500 h-3 w-3 rounded-full" />
          </div>
          {/* Email Header */}
          <div className="border-b border-gray-200 px-4 py-2 bg-white">
            <div className="space-y-1 text-sm ">
              <div className="flex gap-2">
                <span className="text-muted-foreground">From:</span>
                <span className="text-gray-700">{brandName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Subject:</span>
                <span className="text-gray-700">{content.subject}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-0 h-full" style={{ fontFamily, backgroundColor }}>
            {/* Email Container */}
            <div className="max-w-[600px] mx-auto">
              {/* Header */}
              <div
                className="p-4 text-left"
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={brandName}
                    width={100}
                    height={100}
                    className="h-12 mx-auto object-contain"
                  />
                ) : (
                  <div className="h-12 flex items-center justify-center">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: greetingTextColor }}
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
                <p className="text-base leading-relaxed" style={{ color: bodyTextColor }}>
                  {content.body}
                </p>

                {/* CTA Button */}
                <div className="pt-4">
                  <button
                    className="px-8 py-3 font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                      borderRadius,
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
                        backgroundColor: accentColor || primaryColor,
                      }}
                    />
                    <p className="text-sm" style={{ color: bodyTextColor, opacity: 0.8 }}>
                      AI-powered template generation
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2"
                      style={{
                        backgroundColor: accentColor || primaryColor,
                      }}
                    />
                    <p className="text-sm" style={{ color: bodyTextColor, opacity: 0.8 }}>
                      Beautiful, responsive designs
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2"
                      style={{
                        backgroundColor: accentColor || primaryColor,
                      }}
                    />
                    <p className="text-sm" style={{ color: bodyTextColor, opacity: 0.8 }}>
                      Export to any platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 text-center text-sm space-y-2" style={{ backgroundColor: `${primaryColor}10`, color: bodyTextColor, opacity: 0.7 }}>
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
