import { router } from "../index";
import { templateCoreRouter } from "./template-core";
import { templateVersionsRouter } from "./template-versions";
import { templateLibraryRouter } from "./template-library";

/**
 * Template router aggregating core, versions, and library operations
 * Properly typed nested structure for type safety
 */
export const templateRouter = router({
  // Core template operations (CRUD + generation)
  core: templateCoreRouter,
  // Version management operations
  versions: templateVersionsRouter,
  // Library/publishing operations
  library: templateLibraryRouter,
});
