import { initTRPC, TRPCError } from "@trpc/server";
import type { ApiContext, Session } from "./types";

export const t = initTRPC.context<ApiContext>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      // Explicit cast to non-nullable session after null check
      session: ctx.session as Session,
    },
  });
});

// Export app router and types
export { appRouter, type AppRouter } from "./routers/index";
export { createContext } from "./context";
