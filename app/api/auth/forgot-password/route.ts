import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db, users, passwordResets } from "@/db";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ success: true });
    }

    await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

    const token = nanoid(40);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResets).values({
      id: nanoid(),
      userId: user.id,
      token,
      expires,
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name ?? "there",
      resetUrl,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
