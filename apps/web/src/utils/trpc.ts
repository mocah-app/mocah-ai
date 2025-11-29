import { QueryCache, QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@mocah/api";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute before data is considered stale
      gcTime: 1000 * 60 * 5, // 5 minutes before unused data is garbage collected
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

// React hooks factory (for use in components)
export const trpc = createTRPCReact<AppRouter>();

// Raw tRPC client (for imperative calls)
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
