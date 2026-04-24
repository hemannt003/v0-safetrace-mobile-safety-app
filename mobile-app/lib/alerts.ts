import { supabase } from "./supabase"
import { getCurrentLocation } from "./location"
import type { Alert, AlertType, EmergencyContact } from "./types"

export async function triggerSOSAlert(userId: string, alertType: AlertType = "sos"): Promise<Alert | null> {
  const location = await getCurrentLocation()
  
  if (!location) {
    throw new Error("Could not get location")
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: userId,
      alert_type: alertType,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // Send notifications to emergency contacts
  await notifyEmergencyContacts(userId, data.id)

  return data
}

export async function cancelAlert(alertId: string): Promise<void> {
  await supabase
    .from("alerts")
    .update({ status: "cancelled" })
    .eq("id", alertId)
}

export async function getActiveAlerts(userId: string): Promise<Alert[]> {
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "responding"])
    .order("created_at", { ascending: false })

  return data || []
}

export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
  const { data } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })

  return data || []
}

export async function addEmergencyContact(
  userId: string,
  contact: Omit<EmergencyContact, "id" | "user_id" | "created_at">
): Promise<EmergencyContact | null> {
  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({
      user_id: userId,
      ...contact,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEmergencyContact(contactId: string): Promise<void> {
  await supabase.from("emergency_contacts").delete().eq("id", contactId)
}

async function notifyEmergencyContacts(userId: string, alertId: string): Promise<void> {
  const contacts = await getEmergencyContacts(userId)
  
  // Create notification records
  for (const contact of contacts) {
    await supabase.from("alert_notifications").insert({
      alert_id: alertId,
      contact_id: contact.id,
      notification_type: "sms",
      status: "pending",
    })
  }

  // In a real app, you would integrate with a service like Twilio here
  // to actually send SMS/push notifications
}
