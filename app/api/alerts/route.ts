import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server" 

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("alerts")
      .select(`
        *,
        user:users!user_id(id, full_name, phone, profile_image_url)
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error("[/api/alerts] Supabase query error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get latest location for each alert user (non-fatal if locations table missing)
    const alertsWithLocations = await Promise.all(
      (data || []).map(async (alert: {
        user_id: string;
        [key: string]: unknown;
      }) => {
        const { data: locationData } = await supabase
          .from("locations")
          .select("*")
          .eq("user_id", alert.user_id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle()   // returns null (not an error) when no row found

        return {
          ...alert,
          latest_location: locationData ?? null,
        }
      })
    )

    return NextResponse.json(alertsWithLocations)
  } catch (err) {
    console.error("[/api/alerts] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: user.id,
      alert_type: body.alert_type,
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      notes: body.notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
