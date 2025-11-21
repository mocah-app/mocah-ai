import { protectedProcedure, publicProcedure, router } from "../index";
import { storageRouter } from "./storage";
import { organizationRouter } from "./organization";
import { brandKitRouter } from "./brand-kit";
import { templateRouter } from "./template";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  // Feature routers
  storage: storageRouter,
  organization: organizationRouter,
  brandKit: brandKitRouter,
  template: templateRouter,
});

export type AppRouter = typeof appRouter;
