import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn (className merge utility)", () => {
    it("merges class names correctly", () => {
      const result = cn("px-4", "py-2");
      expect(result).toBe("px-4 py-2");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class active-class");
    });

    it("handles false conditional classes", () => {
      const isActive = false;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class");
    });

    it("handles undefined values", () => {
      const result = cn("base-class", undefined, "another-class");
      expect(result).toBe("base-class another-class");
    });

    it("handles null values", () => {
      const result = cn("base-class", null, "another-class");
      expect(result).toBe("base-class another-class");
    });

    it("merges tailwind conflicting classes correctly", () => {
      // twMerge should resolve conflicts
      const result = cn("px-4", "px-6");
      expect(result).toBe("px-6");
    });

    it("merges tailwind padding conflicts", () => {
      const result = cn("p-4", "px-2");
      expect(result).toBe("p-4 px-2");
    });

    it("handles array of classes", () => {
      const result = cn(["class1", "class2"]);
      expect(result).toBe("class1 class2");
    });

    it("handles empty string", () => {
      const result = cn("");
      expect(result).toBe("");
    });

    it("handles no arguments", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("handles object syntax for conditional classes", () => {
      const result = cn({
        "base-class": true,
        "active-class": true,
        "disabled-class": false,
      });
      expect(result).toBe("base-class active-class");
    });
  });
});

