import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-slate-200 dark:text-slate-800">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-200">Page not found</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Sorry, we couldn’t find the page you’re looking for.</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
