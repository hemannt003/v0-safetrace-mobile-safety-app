export type UserRole = "user" | "admin" | "responder"

export interface User {
  id: string
  full_name: string
  phone: string | null
  profile_image_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface EmergencyContact {
  id: string
  user_id: string
  name: string
  phone: string
  relationship: string | null
  is_primary: boolean
  created_at: string
}

export interface Location {
  id: string
  user_id: string
  latitude: number
  longitude: number
  accuracy: number | null
  speed: number | null
  heading: number | null
  battery_level: number | null
  recorded_at: string
}

export type AlertType = "sos" | "shake" | "scheduled" | "geofence"
export type AlertStatus = "active" | "responding" | "resolved" | "cancelled"

export interface Alert {
  id: string
  user_id: string
  alert_type: AlertType
  status: AlertStatus
  latitude: number
  longitude: number
  address: string | null
  notes: string | null
  audio_recording_url: string | null
  video_recording_url: string | null
  responder_id: string | null
  created_at: string
  resolved_at: string | null
  updated_at: string
}

export interface SafeZone {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at: string
}

export type JourneyStatus = "active" | "completed" | "alert_triggered"

export interface Journey {
  id: string
  user_id: string
  destination_name: string
  destination_latitude: number
  destination_longitude: number
  expected_arrival: string | null
  status: JourneyStatus
  check_in_interval_minutes: number
  last_check_in: string | null
  created_at: string
  completed_at: string | null
}
