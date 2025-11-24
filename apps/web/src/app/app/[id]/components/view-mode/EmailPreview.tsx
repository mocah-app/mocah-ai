import React from "react";
import { EditableElement } from "./EditableElement";
import { cn } from "@/lib/utils";

interface EmailPreviewProps {
  template: {
    subject?: string;
    previewText?: string;
    sections: any[];
  };
}

export const EmailPreview = ({ template }: EmailPreviewProps) => {
  return (
    <div className="w-full min-h-[600px] font-sans text-foreground flex flex-col">


      {/* Email Canvas */}
      <div className="flex-1 dark:*:bg-zinc-900 bg-zinc-50 p-8 overflow-y-auto">
        <div className="max-w-[600px] mx-auto shadow-lg min-h-[800px] flex flex-col">
          {template.sections && template.sections.length > 0 ? (
            template.sections.map((section, index) => (
              <SectionRenderer
                key={section.id || index}
                section={section}
                index={index}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground italic p-10">
              Empty template. Add sections to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionRenderer = ({
  section,
  index,
}: {
  section: any;
  index: number;
}) => {
  const sectionPath = `sections.${index}`;

  switch (section.type) {
    case "header":
      return <HeaderSection section={section} path={sectionPath} />;
    case "hero":
      return <HeroSection section={section} path={sectionPath} />;
    case "text":
      return <TextSection section={section} path={sectionPath} />;
    case "button":
      return <ButtonSection section={section} path={sectionPath} />;
    case "footer":
      return <FooterSection section={section} path={sectionPath} />;
    default:
      return (
        <div className="p-4 border-2 border-dashed border-border m-4 rounded text-muted-foreground text-center text-sm">
          Unknown Section Type: {section.type}
        </div>
      );
  }
};

// --- Section Components ---

const HeaderSection = ({ section, path }: { section: any; path: string }) => {
  return (
    <div className="p-6 border-b border-border" style={section.styles}>
      <div className="flex justify-between items-center">
        <EditableElement
          path={`${path}.logo`}
          type="image"
          className="inline-block"
        >
          {section.logo ? (
            <img
              src={section.logo}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div className="h-8 w-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              LOGO
            </div>
          )}
        </EditableElement>

        {section.showNav && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            {["Home", "Shop", "About"].map((item, i) => (
              <EditableElement key={i} path={`${path}.nav.${i}`} type="link">
                <span>{item}</span>
              </EditableElement>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HeroSection = ({ section, path }: { section: any; path: string }) => {
  return (
    <div className="relative text-center" style={section.styles}>
      <EditableElement path={`${path}.image`} type="image" className="w-full">
        {section.image ? (
          <img
            src={section.image}
            alt="Hero"
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-muted flex items-center justify-center text-muted-foreground">
            Hero Image Placeholder
          </div>
        )}
      </EditableElement>

      <div className="p-8">
        <EditableElement path={`${path}.headline`} type="text" className="mb-4">
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            {section.headline || "Your Main Headline Here"}
          </h1>
        </EditableElement>

        <EditableElement
          path={`${path}.subheadline`}
          type="text"
          className="mb-6"
        >
          <p className="text-lg text-muted-foreground">
            {section.subheadline ||
              "A compelling subheadline goes here to support the main message."}
          </p>
        </EditableElement>

        <EditableElement
          path={`${path}.cta`}
          type="button"
          className="inline-block"
        >
          <span className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded font-medium">
            {section.ctaText || "Call to Action"}
          </span>
        </EditableElement>
      </div>
    </div>
  );
};

const TextSection = ({ section, path }: { section: any; path: string }) => {
  return (
    <div className="p-8" style={section.styles}>
      <EditableElement path={`${path}.content`} type="text">
        <div className="prose max-w-none text-foreground">
          {section.content || (
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          )}
        </div>
      </EditableElement>
    </div>
  );
};

const ButtonSection = ({ section, path }: { section: any; path: string }) => {
  return (
    <div className="p-6 text-center" style={section.styles}>
      <EditableElement
        path={`${path}.button`}
        type="button"
        className="inline-block"
      >
        <span className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors">
          {section.text || "Click Here"}
        </span>
      </EditableElement>
    </div>
  );
};

const FooterSection = ({ section, path }: { section: any; path: string }) => {
  return (
    <div
      className="bg-muted p-8 text-center text-sm text-muted-foreground mt-auto"
      style={section.styles}
    >
      <EditableElement
        path={`${path}.social`}
        type="container"
        className="flex justify-center gap-4 mb-6"
      >
        <div className="w-8 h-8 bg-muted rounded-full"></div>
        <div className="w-8 h-8 bg-muted rounded-full"></div>
        <div className="w-8 h-8 bg-muted rounded-full"></div>
      </EditableElement>

      <EditableElement path={`${path}.address`} type="text" className="mb-4">
        <p>{section.address || "123 Company St, City, Country"}</p>
      </EditableElement>

      <EditableElement path={`${path}.links`} type="link">
        <div className="flex justify-center gap-4 text-xs underline">
          <span>Unsubscribe</span>
          <span>Privacy Policy</span>
          <span>Terms</span>
        </div>
      </EditableElement>
    </div>
  );
};
