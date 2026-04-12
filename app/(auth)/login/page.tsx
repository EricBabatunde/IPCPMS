import { LoginForm } from "@/components/auth/LoginForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | IPCPMS",
  description: "Log in to your account",
}

export default function LoginPage() {
  return <LoginForm />
}
