import { NextRequest, NextResponse } from "next/server";
import { db, emailVerifications, users } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/verify-email?error=missing", req.url)
    );
  }

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.token, token))
    .limit(1);

  if (!record) {
    return NextResponse.redirect(
      new URL("/verify-email?error=invalid", req.url)
    );
  }

  if (record.expires < new Date()) {
    return NextResponse.redirect(
      new URL("/verify-email?error=expired", req.url)
    );
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, record.userId));

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.token, token));

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
