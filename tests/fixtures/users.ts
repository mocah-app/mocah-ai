import { faker } from "@faker-js/faker";

/**
 * Create a test user fixture
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    emailVerified: true,
    image: faker.image.avatar(),
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple test users
 */
export function createTestUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
  return Array.from({ length: count }, () => createTestUser(overrides));
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a test session fixture
 */
export function createTestSession(userId: string, overrides: Partial<TestSession> = {}): TestSession {
  return {
    id: faker.string.uuid(),
    userId,
    token: faker.string.alphanumeric(64),
    expiresAt: faker.date.future(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface TestSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

