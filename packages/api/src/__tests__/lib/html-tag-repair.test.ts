import { describe, it, expect } from "vitest";
import { repairHtmlTags } from "../../lib/html-tag-repair";

describe("html-tag-repair", () => {
  describe("repairHtmlTags", () => {
    it("returns unchanged code when no HTML tags present", () => {
      const code = `<Section><Text>Hello World</Text></Section>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(code);
      expect(result.changed).toBe(false);
      expect(result.changeCount).toBe(0);
    });

    it("converts <div> to <Section>", () => {
      const code = `<div>Hello World</div>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Section>Hello World</Section>`);
      expect(result.changed).toBe(true);
      expect(result.changeCount).toBe(2); // opening + closing
    });

    it("converts <span> to <Text>", () => {
      const code = `<span>Hello</span>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Text>Hello</Text>`);
      expect(result.changed).toBe(true);
    });

    it("converts <p> to <Text>", () => {
      const code = `<p>Paragraph text</p>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Text>Paragraph text</Text>`);
      expect(result.changed).toBe(true);
    });

    it("converts <a> to <Link>", () => {
      const code = `<a href="https://example.com">Click me</a>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Link href="https://example.com">Click me</Link>`);
      expect(result.changed).toBe(true);
    });

    it("preserves attributes when converting tags", () => {
      const code = `<div style={{ padding: 20 }} className="container">Content</div>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Section style={{ padding: 20 }} className="container">Content</Section>`);
      expect(result.changed).toBe(true);
    });

    it("handles self-closing tags like <img />", () => {
      const code = `<img src="test.png" alt="Test" />`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Img src="test.png" alt="Test" />`);
      expect(result.changed).toBe(true);
    });

    it("converts heading tags to <Heading>", () => {
      const code = `<h1>Title</h1><h2>Subtitle</h2>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Heading>Title</Heading><Heading>Subtitle</Heading>`);
      expect(result.changed).toBe(true);
      expect(result.changeCount).toBe(4); // 2 opening + 2 closing
    });

    it("converts <button> to <Button>", () => {
      const code = `<button onClick={handleClick}>Submit</button>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Button onClick={handleClick}>Submit</Button>`);
      expect(result.changed).toBe(true);
    });

    it("converts <hr> to <Hr>", () => {
      const code = `<hr />`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Hr />`);
      expect(result.changed).toBe(true);
    });

    it("preserves <strong> and <em> tags (valid inline formatting)", () => {
      const code = `<Text>This is <strong>bold</strong> and <em>italic</em></Text>`;
      const result = repairHtmlTags(code);

      // strong and em should NOT be converted
      expect(result.code).toBe(`<Text>This is <strong>bold</strong> and <em>italic</em></Text>`);
      expect(result.changed).toBe(false);
    });

    it("handles nested HTML tags", () => {
      const code = `<div><p>Nested <span>content</span></p></div>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Section><Text>Nested <Text>content</Text></Text></Section>`);
      expect(result.changed).toBe(true);
    });

    it("handles mixed case tags (case insensitive)", () => {
      const code = `<DIV><P>Content</P></DIV>`;
      const result = repairHtmlTags(code);

      expect(result.code).toBe(`<Section><Text>Content</Text></Section>`);
      expect(result.changed).toBe(true);
    });

    it("counts changes correctly for complex code", () => {
      const code = `
        <div>
          <h1>Welcome</h1>
          <p>This is a <span>test</span></p>
          <a href="#">Link</a>
        </div>
      `;
      const result = repairHtmlTags(code);

      expect(result.changed).toBe(true);
      // div(2) + h1(2) + p(2) + span(2) + a(2) = 10
      expect(result.changeCount).toBe(10);
    });
  });
});

