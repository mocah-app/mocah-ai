"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";
import type { Route } from "next";

/**
 * Client-side authentication utility
 *
 * Usage:
 * - Call at the top of client components that require authentication
 * - Automatically redirects to login if not authenticated
 * - Returns session data and auth utilities
 */
export function useAuth(options?: {
  /**
   * Redirect path if not authenticated
   * @default "/login"
   */
  redirectTo?: string;
  /**
   * If true, don't redirect - just return session state
   * @default false
   */
  optional?: boolean;
}) {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();

  const redirectTo = options?.redirectTo ?? "/login";
  const optional = options?.optional ?? false;

  useEffect(() => {
    // Don't redirect during loading or if auth is optional
    if (isPending || optional) return;

    // Redirect if no session
    if (!session) {
      router.push(redirectTo as Route);
    }
  }, [session, isPending, optional, redirectTo, router]);

  return {
    /**
     * Current session object (null if not authenticated)
     */
    session,
    /**
     * User object (shorthand for session?.user)
     */
    user: session?.user,
    /**
     * Whether the session is still loading
     */
    isLoading: isPending,
    /**
     * Error if session fetch failed
     */
    error,
    /**
     * Whether user is authenticated
     */
    isAuthenticated: !!session,
  };
}

/**
 * Get current user on the client
 * Returns null if not authenticated (without redirecting)
 *
 * Usage:
 * - Use when you need to check auth state but don't want to redirect
 * - Good for conditional rendering based on auth state
 */
export function useOptionalAuth() {
  return useAuth({ optional: true });
}
