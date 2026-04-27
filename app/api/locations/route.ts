import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  const limit = parseInt(searchParams.get("limit") || "50")

  let query = supabase
    .from("locations")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(limit)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      user_id: user.id,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy,
      speed: body.speed,
      heading: body.heading,
      battery_level: body.battery_level,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
