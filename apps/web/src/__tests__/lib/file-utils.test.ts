import { describe, it, expect } from "vitest";
import { validateImageFile } from "@/lib/file-utils";

describe("file-utils", () => {
  describe("validateImageFile", () => {
    it("accepts valid PNG files", () => {
      const file = new File([""], "test.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 1024 }); // 1KB
      
      const result = validateImageFile(file);
      expect(result).toEqual({ valid: true });
    });

    it("accepts valid JPEG files", () => {
      const file = new File([""], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 1024 });
      
      const result = validateImageFile(file);
      expect(result).toEqual({ valid: true });
    });

    it("accepts valid SVG files", () => {
      const file = new File([""], "test.svg", { type: "image/svg+xml" });
      Object.defineProperty(file, "size", { value: 1024 });
      
      const result = validateImageFile(file);
      expect(result).toEqual({ valid: true });
    });

    it("rejects invalid file types", () => {
      const file = new File([""], "test.gif", { type: "image/gif" });
      Object.defineProperty(file, "size", { value: 1024 });
      
      const result = validateImageFile(file);
      expect(result).toEqual({
        valid: false,
        error: "Invalid file type. Only PNG, JPG, and SVG are allowed.",
      });
    });

    it("rejects PDF files", () => {
      const file = new File([""], "test.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "size", { value: 1024 });
      
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });

    it("rejects files larger than 10MB", () => {
      const file = new File([""], "test.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 }); // 11MB
      
      const result = validateImageFile(file);
      expect(result).toEqual({
        valid: false,
        error: "File too large. Maximum size is 10MB.",
      });
    });

    it("accepts files exactly at 10MB", () => {
      const file = new File([""], "test.png", { type: "image/png" });
      Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 }); // 10MB
      
      const result = validateImageFile(file);
      expect(result).toEqual({ valid: true });
    });
  });
});

