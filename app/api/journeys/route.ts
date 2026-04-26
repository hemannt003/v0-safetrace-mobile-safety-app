import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  let query = supabase
    .from("journeys")
    .select(`
      *,
      user:users!user_id(id, full_name, phone, profile_image_url)
    `)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.limit(50)

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
    .from("journeys")
    .insert({
      user_id: user.id,
      destination_name: body.destination_name,
      destination_latitude: body.destination_latitude,
      destination_longitude: body.destination_longitude,
      expected_arrival: body.expected_arrival,
      check_in_interval_minutes: body.check_in_interval_minutes || 15,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
