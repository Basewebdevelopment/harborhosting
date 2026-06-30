import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (type === "profile") {
      const { name, company } = body;
      if (!name?.trim()) {
        return NextResponse.json({ error: "Name is required." }, { status: 400 });
      }
      await db
        .update(users)
        .set({ name: name.trim(), company: company?.trim() || null })
        .where(eq(users.id, user.id));
      return NextResponse.json({ success: true });
    }

    if (type === "password") {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Both current and new password are required." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
      }
      if (!user.hashedPassword) {
        return NextResponse.json({ error: "No password set on this account." }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 12);
      await db
        .update(users)
        .set({ hashedPassword: hashed })
        .where(eq(users.id, user.id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown update type." }, { status: 400 });
  } catch (err) {
    console.error("[account/update]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
