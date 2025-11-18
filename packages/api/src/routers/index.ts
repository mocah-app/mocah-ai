import { protectedProcedure, publicProcedure, router } from "../index";
import { storageRouter } from "./storage";
import { organizationRouter } from "./organization";
import { brandKitRouter } from "./brand-kit";

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
});

export type AppRouter = typeof appRouter;
