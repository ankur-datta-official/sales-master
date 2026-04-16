import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expectedToken = process.env.HEALTHCHECK_TOKEN;
  if (expectedToken) {
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    const queryToken = new URL(request.url).searchParams.get("token");
    const providedToken = bearerToken ?? queryToken;
    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { status: "forbidden" },
        { status: 403, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }
  }

  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasPublicKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const healthy = hasUrl && hasPublicKey;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        env: healthy ? "ok" : "missing_required_values",
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
