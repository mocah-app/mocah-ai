import { NextRequest } from "next/server";
import { auth } from "@mocah/auth";
import { invalidateBrandKitCache } from "../../template/generate/cache";

/**
 * API endpoint to invalidate server-side caches
 * Used after brand kit updates to ensure AI generation uses fresh brand data
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { organizationId } = await req.json();

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: "organizationId required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await invalidateBrandKitCache(organizationId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
