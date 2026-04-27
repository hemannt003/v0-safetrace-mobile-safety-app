import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  MapPin,
  Bell,
  Phone,
  Users,
  Navigation,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

const features = [
  {
    icon: Bell,
    title: "One-Tap SOS",
    description: "Instantly alert emergency contacts with your location",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    description: "Share your real-time location with trusted contacts",
  },
  {
    icon: Navigation,
    title: "Journey Monitoring",
    description: "Automatic check-ins during trips with alerts if you don't respond",
  },
  {
    icon: Users,
    title: "Emergency Contacts",
    description: "Notify family and friends instantly during emergencies",
  },
  {
    icon: Phone,
    title: "Shake Detection",
    description: "Trigger alerts by shaking your phone in danger",
  },
  {
    icon: Shield,
    title: "Safe Zones",
    description: "Get alerts when leaving designated safe areas",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">SafeTrace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" />
                AI-Powered Safety System
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Your Safety, Our Priority
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground text-pretty">
                SafeTrace provides comprehensive safety features including real-time location sharing,
                emergency SOS alerts, journey monitoring, and instant notifications to keep you and
                your loved ones safe.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    View Dashboard Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">Safety Features</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Comprehensive protection with cutting-edge technology
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border bg-background">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">How It Works</h2>
              <p className="mb-12 text-muted-foreground">Simple setup, powerful protection</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: "1", title: "Download the App", description: "Get SafeTrace on your mobile device" },
                { step: "2", title: "Add Emergency Contacts", description: "Set up your trusted contacts for alerts" },
                { step: "3", title: "Stay Protected", description: "Access instant SOS and tracking features" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold">Ready to Feel Safer?</h2>
            <p className="mx-auto mb-8 max-w-2xl opacity-90">
              Join thousands of users who trust SafeTrace for their safety
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button size="lg" variant="secondary" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">SafeTrace</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 SafeTrace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
