import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { getRedis } = await import("@/lib/db/redis");
    const { keys } = await import("@/lib/db/redis-keys");
    const redis = getRedis();
    const data = await redis.hgetall<Record<string, string>>(keys.company(userId));
    if (!data) return Response.json({ name: null, logoDataUrl: null });
    return Response.json({ name: data.name ?? null, logoDataUrl: data.logoDataUrl ?? null });
  } catch {
    return Response.json({ name: null, logoDataUrl: null });
  }
}
