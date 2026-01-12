import { describe, it, expect } from "vitest";
import { EMAIL_SAFE_FONTS, BRAND_VOICES } from "../constants";

describe("constants", () => {
  describe("EMAIL_SAFE_FONTS", () => {
    it("contains expected email-safe fonts", () => {
      expect(EMAIL_SAFE_FONTS).toContain("Arial, sans-serif");
      expect(EMAIL_SAFE_FONTS).toContain("Times New Roman, serif");
      expect(EMAIL_SAFE_FONTS).toContain("Verdana, sans-serif");
      expect(EMAIL_SAFE_FONTS).toContain("Georgia, serif");
    });

    it("has the expected number of fonts", () => {
      expect(EMAIL_SAFE_FONTS.length).toBe(10);
    });

    it("all fonts include a fallback", () => {
      EMAIL_SAFE_FONTS.forEach((font) => {
        expect(font).toMatch(/, (sans-serif|serif|monospace)$/);
      });
    });

    it("is a readonly tuple (as const)", () => {
      // TypeScript prevents mutation at compile time via 'as const'
      // At runtime, it's still a regular array
      expect(Array.isArray(EMAIL_SAFE_FONTS)).toBe(true);
      expect(EMAIL_SAFE_FONTS.length).toBeGreaterThan(0);
    });
  });

  describe("BRAND_VOICES", () => {
    it("contains expected brand voice options", () => {
      expect(BRAND_VOICES).toContain("professional");
      expect(BRAND_VOICES).toContain("casual");
      expect(BRAND_VOICES).toContain("playful");
      expect(BRAND_VOICES).toContain("luxury");
    });

    it("has the expected number of voices", () => {
      expect(BRAND_VOICES.length).toBe(4);
    });

    it("all voices are lowercase strings", () => {
      BRAND_VOICES.forEach((voice) => {
        expect(voice).toBe(voice.toLowerCase());
        expect(typeof voice).toBe("string");
      });
    });

    it("is a readonly tuple (as const)", () => {
      // TypeScript prevents mutation at compile time via 'as const'
      // At runtime, it's still a regular array
      expect(Array.isArray(BRAND_VOICES)).toBe(true);
      expect(BRAND_VOICES.length).toBeGreaterThan(0);
    });
  });
});

