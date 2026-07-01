import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, subscriptions } from "@/db";
import { eq } from "drizzle-orm";

const DOMAIN_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i;

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { domain } = await req.json();
    const trimmed = typeof domain === "string" ? domain.trim().toLowerCase() : "";

    if (trimmed && !DOMAIN_REGEX.test(trimmed)) {
      return NextResponse.json({ error: "Enter a valid domain, e.g. example.com" }, { status: 400 });
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "No subscription found." }, { status: 404 });
    }

    await db
      .update(subscriptions)
      .set({ domain: trimmed || null, updatedAt: new Date() })
      .where(eq(subscriptions.userId, session.user.id));

    return NextResponse.json({ success: true, domain: trimmed || null });
  } catch (err) {
    console.error("[subscription/update]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
