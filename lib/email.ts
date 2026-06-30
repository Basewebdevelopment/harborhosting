import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Harbor Hosting <noreply@harborhosting.com>";

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Confirm your Harbor Hosting account",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e7e9ec;overflow:hidden;">
        <tr>
          <td style="padding:28px 40px 24px;border-bottom:1px solid #f0f1f3;">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/harbor-logo.png" alt="Harbor Hosting" height="36" style="display:block;height:36px;width:auto;">
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#15181c;letter-spacing:-0.01em;">Verify your email address</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5a616a;">Hi ${opts.name.split(" ")[0]}, thanks for signing up! Click the button below to confirm your email and activate your account.</p>
            <a href="${opts.verifyUrl}" style="display:inline-block;background:#0f9d77;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:10px;">Confirm email address</a>
            <p style="margin:24px 0 0;font-size:13px;color:#9aa0a8;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f0f1f3;">
            <p style="margin:0;font-size:12px;color:#b0b7c0;">Harbor Hosting &mdash; Fast, secure managed hosting.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
