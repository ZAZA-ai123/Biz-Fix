import { auth, clerkClient } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; logoDataUrl?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, logoDataUrl } = body;
  if (!name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  // Store companyName in Clerk publicMetadata (small, safe for metadata)
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { companyName: name.trim() },
  });

  // Store logo + company profile in Redis (logoDataUrl can be large base64)
  try {
    const { getRedis } = await import("@/lib/db/redis");
    const { keys } = await import("@/lib/db/redis-keys");
    const redis = getRedis();
    await redis.hset(keys.company(userId), {
      name: name.trim(),
      logoDataUrl: logoDataUrl ?? "",
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Redis write failure is non-fatal — Clerk metadata is the source of truth for companyName
  }

  return Response.json({ success: true });
}
