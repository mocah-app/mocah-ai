import { faker } from "@faker-js/faker";

/**
 * Create a test organization fixture
 */
export function createTestOrganization(overrides: Partial<TestOrganization> = {}): TestOrganization {
  const name = faker.company.name();
  return {
    id: faker.string.uuid(),
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
    logo: faker.image.url(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

/**
 * Create multiple test organizations
 */
export function createTestOrganizations(count: number, overrides: Partial<TestOrganization> = {}): TestOrganization[] {
  return Array.from({ length: count }, () => createTestOrganization(overrides));
}

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
}

/**
 * Create a test organization member fixture
 */
export function createTestOrgMember(
  organizationId: string,
  userId: string,
  overrides: Partial<TestOrgMember> = {}
): TestOrgMember {
  return {
    id: faker.string.uuid(),
    organizationId,
    userId,
    role: "member",
    createdAt: new Date(),
    ...overrides,
  };
}

export interface TestOrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
}

