import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Reset Password | IPCPMS",
  description: "Enter your new password",
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  if (!searchParams.token) {
    redirect("/login")
  }
  
  return <ResetPasswordForm token={searchParams.token} />
}
