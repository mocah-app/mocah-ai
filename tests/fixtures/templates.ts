import { faker } from "@faker-js/faker";

/**
 * Create a test template fixture
 */
export function createTestTemplate(overrides: Partial<TestTemplate> = {}): TestTemplate {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    name: faker.commerce.productName() + " Email",
    code: generateSampleEmailCode(),
    thumbnail: faker.image.url(),
    prompt: faker.lorem.sentence(),
    isPublished: false,
    publishedAt: null,
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple test templates
 */
export function createTestTemplates(count: number, overrides: Partial<TestTemplate> = {}): TestTemplate[] {
  return Array.from({ length: count }, () => createTestTemplate(overrides));
}

export interface TestTemplate {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  code: string;
  thumbnail: string | null;
  prompt: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate sample React Email code for testing
 */
function generateSampleEmailCode(): string {
  return `
import { Html, Head, Body, Container, Text, Button } from "@react-email/components";

export default function Email() {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#ffffff" }}>
        <Container>
          <Text>Hello World</Text>
          <Button href="https://example.com">Click Me</Button>
        </Container>
      </Body>
    </Html>
  );
}
`.trim();
}

