import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db, users, emailVerifications } from "@/db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, company } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = nanoid();

    await db.insert(users).values({
      id: userId,
      name,
      email: email.toLowerCase(),
      hashedPassword,
      company: company ?? null,
    });

    const token = nanoid(40);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await db.insert(emailVerifications).values({
      id: nanoid(),
      userId,
      token,
      expires,
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

    await sendVerificationEmail({ to: email, name, verifyUrl });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
