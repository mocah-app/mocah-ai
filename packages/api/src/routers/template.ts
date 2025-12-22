import { router } from "../index";
import { templateCoreRouter } from "./template-core";
import { templateVersionsRouter } from "./template-versions";
import { templateLibraryRouter } from "./template-library";

/**
 * Template router aggregating core, versions, and library operations
 * All endpoints are available at template.* level (flat structure)
 */
export const templateRouter = router({
  // Core template operations (CRUD + generation)
  ...(templateCoreRouter as any),
  // Version management operations
  ...(templateVersionsRouter as any),
  // Library/publishing operations
  ...(templateLibraryRouter as any),
});
