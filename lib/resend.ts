import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@ipcpms.app"
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function sendVerificationEmail(email: string, name: string): Promise<void> {
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Welcome to IPCPMS — Verify your email",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">IPCPMS</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Integrated Project Collaboration System</p>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="color: #475569; line-height: 1.6;">Your account has been created successfully. You can now log in and start collaborating with your team.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}/login" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Login</a>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "IPCPMS — Reset your password",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">IPCPMS</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Integrated Project Collaboration System</p>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.</p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendNotificationEmail(
  email: string,
  subject: string,
  title: string,
  body: string,
  actionUrl?: string
): Promise<void> {
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `IPCPMS — ${subject}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">IPCPMS</h1>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">${title}</h2>
          <p style="color: #475569; line-height: 1.6;">${body}</p>
          ${actionUrl ? `
          <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}${actionUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Details</a>
          </div>
          ` : ""}
        </div>
      </div>
    `,
  })
}
