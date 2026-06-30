"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#e7e9ec] bg-white p-8">
      <div className="mb-6">
        <h2 className="text-[17px] font-semibold text-[#15181c]">{title}</h2>
        <p className="mt-1 text-[13.5px] text-[#7a818a]">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function AccountPage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [name, setName] = useState(user?.name ?? "");
  const [company, setCompany] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "profile", name, company }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      await update({ name });
      toast.success("Profile updated.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
      <div className="mb-8">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#7a818a] hover:text-[#41474e]">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight text-[#15181c]">Account settings</h1>
        <p className="mt-1 text-[14px] text-[#7a818a]">Manage your profile and password.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Profile */}
        <Section title="Profile" description="Update your display name and company.">
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Full name</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Cooper"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">
                Company <span className="font-normal text-[#a8aeb6]">(optional)</span>
              </Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Cooper & Co."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Email</Label>
              <Input value={user?.email ?? ""} disabled className="cursor-not-allowed opacity-60" />
              <p className="text-[12px] text-[#9aa0a8]">Email cannot be changed. Contact support if needed.</p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="h-[40px] rounded-[10px] bg-[#0f9d77] px-5 text-[14px] font-semibold text-white hover:bg-[#0c8463] disabled:opacity-60 cursor-pointer"
              >
                {profileLoading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </Section>

        {/* Password */}
        <Section title="Change password" description="Use a strong password of at least 8 characters.">
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Current password</Label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">New password</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-[#3a4046]">Confirm new password</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="h-[40px] rounded-[10px] bg-[#15181c] px-5 text-[14px] font-semibold text-white hover:bg-[#2d3138] disabled:opacity-60 cursor-pointer"
              >
                {passwordLoading ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </Section>

        {/* Danger zone */}
        <Section title="Subscription" description="Manage or cancel your current plan.">
          <div className="flex items-center justify-between">
            <p className="text-[13.5px] text-[#5a616a]">
              To change or cancel your plan, use the Stripe billing portal.
            </p>
            <button
              onClick={async () => {
                const res = await fetch("/api/stripe/portal", { method: "POST" });
                const { url, error } = await res.json();
                if (error) { toast.error(error); return; }
                window.location.href = url;
              }}
              className="ml-4 shrink-0 h-[40px] rounded-[10px] border border-[#d8dce1] bg-white px-4 text-[13.5px] font-semibold text-[#15181c] hover:bg-[#f3f4f6] cursor-pointer"
            >
              Manage billing →
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
