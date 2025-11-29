import { protectedProcedure, publicProcedure, router } from "../index";
import { storageRouter } from "./storage";
import { organizationRouter } from "./organization";
import { brandKitRouter } from "./brand-kit";
import { templateRouter } from "./template";
import { chatRouter } from "./chat";

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
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
