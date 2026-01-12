import { describe, it, expect } from "vitest";
import { convertDates } from "../convert-dates";

describe("convertDates", () => {
  it("converts ISO date strings to Date objects", () => {
    const input = "2024-01-15T10:30:00.000Z";
    const result = convertDates(input);
    
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe(input);
  });

  it("returns null for null input", () => {
    expect(convertDates(null)).toBeNull();
  });

  it("returns undefined for undefined input", () => {
    expect(convertDates(undefined)).toBeUndefined();
  });

  it("returns non-date strings unchanged", () => {
    expect(convertDates("hello")).toBe("hello");
    expect(convertDates("12345")).toBe("12345");
    expect(convertDates("not-a-date")).toBe("not-a-date");
  });

  it("returns numbers unchanged", () => {
    expect(convertDates(42)).toBe(42);
    expect(convertDates(0)).toBe(0);
    expect(convertDates(-1)).toBe(-1);
  });

  it("returns booleans unchanged", () => {
    expect(convertDates(true)).toBe(true);
    expect(convertDates(false)).toBe(false);
  });

  it("converts dates in arrays", () => {
    const input = ["2024-01-15T10:30:00.000Z", "hello", 42];
    const result = convertDates(input);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBeInstanceOf(Date);
    expect(result[1]).toBe("hello");
    expect(result[2]).toBe(42);
  });

  it("converts dates in nested arrays", () => {
    const input = [["2024-01-15T10:30:00.000Z"]];
    const result = convertDates(input);
    
    expect(result[0][0]).toBeInstanceOf(Date);
  });

  it("converts dates in objects", () => {
    const input = {
      createdAt: "2024-01-15T10:30:00.000Z",
      name: "Test",
      count: 5,
    };
    const result = convertDates(input);
    
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.name).toBe("Test");
    expect(result.count).toBe(5);
  });

  it("converts dates in nested objects", () => {
    const input = {
      user: {
        createdAt: "2024-01-15T10:30:00.000Z",
        profile: {
          updatedAt: "2024-02-20T15:45:00.000Z",
        },
      },
    };
    const result = convertDates(input);
    
    expect(result.user.createdAt).toBeInstanceOf(Date);
    expect(result.user.profile.updatedAt).toBeInstanceOf(Date);
  });

  it("handles complex mixed structures", () => {
    const input = {
      items: [
        {
          id: 1,
          timestamp: "2024-01-15T10:30:00.000Z",
        },
        {
          id: 2,
          timestamp: "2024-02-20T15:45:00.000Z",
        },
      ],
      metadata: {
        processedAt: "2024-03-01T00:00:00.000Z",
      },
    };
    const result = convertDates(input);
    
    expect(result.items[0].timestamp).toBeInstanceOf(Date);
    expect(result.items[1].timestamp).toBeInstanceOf(Date);
    expect(result.metadata.processedAt).toBeInstanceOf(Date);
    expect(result.items[0].id).toBe(1);
  });

  it("does not convert partial date-like strings", () => {
    expect(convertDates("2024-01-15")).toBe("2024-01-15"); // No time component
    expect(convertDates("01-15-2024T10:30:00")).toBe("01-15-2024T10:30:00"); // Wrong format
  });
});

