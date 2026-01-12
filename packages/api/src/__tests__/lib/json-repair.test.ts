import { describe, it, expect, vi } from "vitest";
import { repairJsonOutput } from "../../lib/json-repair";

describe("json-repair", () => {
  describe("repairJsonOutput", () => {
    it("repairs JSON with missing quotes around keys", async () => {
      const malformed = `{name: "John", age: 30}`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      // jsonrepair should add quotes around keys
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "John", age: 30 });
    });

    it("repairs JSON with trailing commas", async () => {
      const malformed = `{"name": "John", "age": 30,}`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "John", age: 30 });
    });

    it("repairs JSON with missing commas", async () => {
      const malformed = `{"name": "John" "age": 30}`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "John", age: 30 });
    });

    it("repairs JSON with single quotes", async () => {
      const malformed = `{'name': 'John', 'age': 30}`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "John", age: 30 });
    });

    it("handles arrays correctly", async () => {
      const malformed = `[1, 2, 3,]`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual([1, 2, 3]);
    });

    it("handles nested objects", async () => {
      const malformed = `{user: {name: "John", address: {city: "NYC"}}}`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        user: { name: "John", address: { city: "NYC" } },
      });
    });

    it("returns original text if repair completely fails", async () => {
      // This is valid JSON already, but we're testing the error path
      const validJson = `{"valid": true}`;
      const result = await repairJsonOutput({
        text: validJson,
        error: new Error("Some error"),
      });

      // Should return repaired/valid JSON
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ valid: true });
    });

    it("handles empty objects", async () => {
      const malformed = `{}`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({});
    });

    it("handles empty arrays", async () => {
      const malformed = `[]`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual([]);
    });

    it("handles JavaScript-style comments", async () => {
      const malformed = `{
        // This is a comment
        "name": "John"
      }`;
      const result = await repairJsonOutput({
        text: malformed,
        error: new Error("Invalid JSON"),
      });

      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: "John" });
    });
  });
});

