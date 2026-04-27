import * as Location from "expo-location"
import { supabase } from "./supabase"

export async function requestLocationPermission(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync()
  if (foregroundStatus !== "granted") {
    return false
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync()
  return backgroundStatus === "granted"
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })
    return location
  } catch {
    return null
  }
}

export async function saveLocationToDatabase(
  userId: string,
  location: Location.LocationObject,
  batteryLevel?: number
): Promise<void> {
  await supabase.from("locations").insert({
    user_id: userId,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    speed: location.coords.speed,
    heading: location.coords.heading,
    battery_level: batteryLevel,
  })
}

export async function startBackgroundLocationTracking(
  userId: string,
  intervalMs: number = 30000
): Promise<void> {
  await Location.startLocationUpdatesAsync("background-location-task", {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: intervalMs,
    distanceInterval: 50,
    foregroundService: {
      notificationTitle: "SafeTrace",
      notificationBody: "Tracking your location for safety",
      notificationColor: "#DC2626",
    },
  })
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  const isTracking = await Location.hasStartedLocationUpdatesAsync("background-location-task")
  if (isTracking) {
    await Location.stopLocationUpdatesAsync("background-location-task")
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
