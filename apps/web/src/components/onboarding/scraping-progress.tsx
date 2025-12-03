"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { 
  Globe, 
  Palette, 
  Type, 
  Image, 
  Building2, 
  Sparkles,
  Check 
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface ScrapingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  duration: number; // How long to show this step (ms)
}

interface ScrapingProgressProps {
  isActive: boolean;
  onComplete?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const SCRAPING_STEPS: ScrapingStep[] = [
  { id: "connect", label: "Connecting to website...", icon: Globe, duration: 3000 },
  { id: "colors", label: "Extracting brand colors...", icon: Palette, duration: 4000 },
  { id: "typography", label: "Analyzing typography...", icon: Type, duration: 3000 },
  { id: "images", label: "Finding logo & images...", icon: Image, duration: 2000 },
  { id: "company", label: "Reading company info...", icon: Building2, duration: 3000 },
  { id: "finalize", label: "Finalizing brand kit...", icon: Sparkles, duration: 2000 },
];

// ============================================================================
// Inline Button Variant (for smaller spaces)
// ============================================================================

export function ScrapingProgressInline({ isActive }: { isActive: boolean }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
      return;
    }

    const step = SCRAPING_STEPS[currentStepIndex];
    if (!step || currentStepIndex >= SCRAPING_STEPS.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, SCRAPING_STEPS.length - 1));
    }, step.duration);

    return () => clearTimeout(timer);
  }, [isActive, currentStepIndex]);

  const currentStep = SCRAPING_STEPS[currentStepIndex];
  if (!currentStep) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentStep.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
        className="inline-flex items-center"
      >
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="mr-2"
        >
          <currentStep.icon className="h-4 w-4" />
        </motion.span>
        {currentStep.label.replace("...", "")}
      </motion.span>
    </AnimatePresence>
  );
}

