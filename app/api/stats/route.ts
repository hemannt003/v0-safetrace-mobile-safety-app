import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get active alerts count
  const { count: activeAlerts } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "responding"])

  // Get total users count
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })

  // Get active journeys count
  const { count: activeJourneys } = await supabase
    .from("journeys")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Get alerts resolved today
  const { count: resolvedToday } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("status", "resolved")
    .gte("resolved_at", today.toISOString())

  return NextResponse.json({
    activeAlerts: activeAlerts || 0,
    totalUsers: totalUsers || 0,
    activeJourneys: activeJourneys || 0,
    resolvedToday: resolvedToday || 0,
  })
}
