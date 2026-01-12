import { describe, it, expect } from "vitest";
import {
  isLightColor,
  isDarkColor,
  getContrastTextColor,
  getContrastTextColorCustom,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
} from "@/lib/color-utils";

describe("color-utils", () => {
  describe("isLightColor", () => {
    it("returns true for white", () => {
      expect(isLightColor("#FFFFFF")).toBe(true);
      expect(isLightColor("#fff")).toBe(true);
      expect(isLightColor("rgb(255, 255, 255)")).toBe(true);
    });

    it("returns true for light colors", () => {
      expect(isLightColor("#F0F0F0")).toBe(true);
      expect(isLightColor("#EEEEEE")).toBe(true);
      expect(isLightColor("#FFFF00")).toBe(true); // Yellow
    });

    it("returns false for dark colors", () => {
      expect(isLightColor("#000000")).toBe(false);
      expect(isLightColor("#333333")).toBe(false);
      expect(isLightColor("#000080")).toBe(false); // Navy
    });
  });

  describe("isDarkColor", () => {
    it("returns true for black", () => {
      expect(isDarkColor("#000000")).toBe(true);
      expect(isDarkColor("#000")).toBe(true);
      expect(isDarkColor("rgb(0, 0, 0)")).toBe(true);
    });

    it("returns true for dark colors", () => {
      expect(isDarkColor("#1a1a1a")).toBe(true);
      expect(isDarkColor("#333333")).toBe(true);
      expect(isDarkColor("#000080")).toBe(true); // Navy
    });

    it("returns false for light colors", () => {
      expect(isDarkColor("#FFFFFF")).toBe(false);
      expect(isDarkColor("#F0F0F0")).toBe(false);
    });
  });

  describe("getContrastTextColor", () => {
    it("returns black for light backgrounds", () => {
      expect(getContrastTextColor("#FFFFFF")).toBe("#000000");
      expect(getContrastTextColor("#F5F5F5")).toBe("#000000");
      expect(getContrastTextColor("#FFFF00")).toBe("#000000"); // Yellow
    });

    it("returns white for dark backgrounds", () => {
      expect(getContrastTextColor("#000000")).toBe("#FFFFFF");
      expect(getContrastTextColor("#333333")).toBe("#FFFFFF");
      expect(getContrastTextColor("#1a1a1a")).toBe("#FFFFFF");
    });
  });

  describe("getContrastTextColorCustom", () => {
    it("uses custom colors for light backgrounds", () => {
      expect(getContrastTextColorCustom("#FFFFFF", "#111111", "#EEEEEE")).toBe("#111111");
    });

    it("uses custom colors for dark backgrounds", () => {
      expect(getContrastTextColorCustom("#000000", "#111111", "#EEEEEE")).toBe("#EEEEEE");
    });

    it("uses default colors when not specified", () => {
      expect(getContrastTextColorCustom("#FFFFFF")).toBe("#000000");
      expect(getContrastTextColorCustom("#000000")).toBe("#FFFFFF");
    });
  });

  describe("getContrastRatio", () => {
    it("returns 21 for black on white", () => {
      const ratio = getContrastRatio("#000000", "#FFFFFF");
      expect(ratio).toBeCloseTo(21, 0);
    });

    it("returns 1 for same colors", () => {
      const ratio = getContrastRatio("#FFFFFF", "#FFFFFF");
      expect(ratio).toBe(1);
    });

    it("returns a value between 1 and 21", () => {
      const ratio = getContrastRatio("#666666", "#FFFFFF");
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(21);
    });
  });

  describe("meetsWCAGAA", () => {
    it("returns true for black on white (high contrast)", () => {
      expect(meetsWCAGAA("#000000", "#FFFFFF")).toBe(true);
    });

    it("returns false for low contrast colors", () => {
      expect(meetsWCAGAA("#CCCCCC", "#FFFFFF")).toBe(false);
    });
  });

  describe("meetsWCAGAAA", () => {
    it("returns true for black on white (highest contrast)", () => {
      expect(meetsWCAGAAA("#000000", "#FFFFFF")).toBe(true);
    });

    it("returns false for medium contrast colors", () => {
      expect(meetsWCAGAAA("#666666", "#FFFFFF")).toBe(false);
    });
  });
});

