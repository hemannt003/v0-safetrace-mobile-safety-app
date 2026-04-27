import Link from "next/link"
import { CheckCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Check Your Email</h1>
        <p className="mb-6 text-muted-foreground">
          We&apos;ve sent a confirmation link to your email address. Please click the link to verify your account.
        </p>
        <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-muted p-4">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Confirmation email sent</span>
        </div>
        <Button asChild variant="outline">
          <Link href="/auth/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  )
}
