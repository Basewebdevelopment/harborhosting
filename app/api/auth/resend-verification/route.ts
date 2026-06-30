import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db, users, emailVerifications } from "@/db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/email";

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
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing verification tokens for this user
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.userId, user.id));

    const token = nanoid(40);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerifications).values({
      id: nanoid(),
      userId: user.id,
      token,
      expires,
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;
    await sendVerificationEmail({ to: user.email!, name: user.name ?? "there", verifyUrl });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
