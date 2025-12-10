import { protectedProcedure, publicProcedure, router } from "../index";
import { storageRouter } from "./storage";
import { organizationRouter } from "./organization";
import { brandKitRouter } from "./brand-kit";
import { brandBuilderRouter } from "./brandkit-builder";
import { brandGuideRouter } from "./brand-guide";
import { templateRouter } from "./template";
import { chatRouter } from "./chat";
import { imageAssetRouter } from "./image-asset";

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
  brandBuilder: brandBuilderRouter,
  brandGuide: brandGuideRouter,
  template: templateRouter,
  chat: chatRouter,
  imageAsset: imageAssetRouter,
});

export type AppRouter = typeof appRouter;
