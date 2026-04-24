import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const updateData: Record<string, unknown> = {}

  if (body.status) {
    updateData.status = body.status
    if (body.status === "resolved") {
      updateData.resolved_at = new Date().toISOString()
    }
    if (body.status === "responding") {
      updateData.responder_id = user.id
    }
  }

  if (body.notes !== undefined) {
    updateData.notes = body.notes
  }

  const { data, error } = await supabase
    .from("alerts")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      user:users(id, full_name, phone, profile_image_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
