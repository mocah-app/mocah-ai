import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server for mocking external API calls in tests
 * 
 * Usage:
 * ```ts
 * import { server } from "./test-utils/mocks/server";
 * 
 * beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 */
export const server = setupServer(...handlers);

