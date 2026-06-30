import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, passwordResets, users } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const [record] = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, token))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await db.delete(passwordResets).where(eq(passwordResets.token, token));
      return NextResponse.json({ error: "This reset link has expired." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ hashedPassword })
      .where(eq(users.id, record.userId));

    await db.delete(passwordResets).where(eq(passwordResets.token, token));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
