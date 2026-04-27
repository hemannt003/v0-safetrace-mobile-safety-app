import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native"
import { useAuth } from "@/context/auth"
import { supabase } from "@/lib/supabase"
import { getCurrentLocation } from "@/lib/location"
import type { Journey } from "@/lib/types"

export default function JourneyScreen() {
  const { user } = useAuth()
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null)
  const [destination, setDestination] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    loadActiveJourney()
  }, [user])

  const loadActiveJourney = async () => {
    if (!user) return

    const { data } = await supabase
      .from("journeys")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    setActiveJourney(data)
  }

  const startJourney = async () => {
    if (!user || !destination.trim()) {
      Alert.alert("Error", "Please enter a destination")
      return
    }

    setLoading(true)
    try {
      const location = await getCurrentLocation()
      if (!location) {
        Alert.alert("Error", "Could not get your location")
        return
      }

      const { data, error } = await supabase
        .from("journeys")
        .insert({
          user_id: user.id,
          destination_name: destination.trim(),
          destination_latitude: location.coords.latitude + 0.01, // Simulated destination
          destination_longitude: location.coords.longitude + 0.01,
          check_in_interval_minutes: 15,
        })
        .select()
        .single()

      if (error) throw error

      setActiveJourney(data)
      setDestination("")
      Alert.alert("Journey Started", "Your emergency contacts will be notified if you miss a check-in.")
    } catch (error) {
      Alert.alert("Error", "Failed to start journey")
    }
    setLoading(false)
  }

  const checkIn = async () => {
    if (!activeJourney) return

    setChecking(true)
    await supabase
      .from("journeys")
      .update({ last_check_in: new Date().toISOString() })
      .eq("id", activeJourney.id)

    setActiveJourney({ ...activeJourney, last_check_in: new Date().toISOString() })
    setChecking(false)
    Alert.alert("Checked In", "Your contacts know you're safe!")
  }

  const endJourney = async () => {
    if (!activeJourney) return

    Alert.alert("End Journey", "Are you sure you want to end this journey?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Journey",
        onPress: async () => {
          await supabase
            .from("journeys")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("id", activeJourney.id)

          setActiveJourney(null)
          Alert.alert("Journey Ended", "Stay safe!")
        },
      },
    ])
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {activeJourney ? (
        <View style={styles.activeJourney}>
          <View style={styles.journeyHeader}>
            <Text style={styles.journeyIcon}>📍</Text>
            <View style={styles.journeyInfo}>
              <Text style={styles.journeyTitle}>Active Journey</Text>
              <Text style={styles.journeyDestination}>{activeJourney.destination_name}</Text>
            </View>
          </View>

          <View style={styles.journeyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Started</Text>
              <Text style={styles.statValue}>{formatTime(activeJourney.created_at)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Last Check-in</Text>
              <Text style={styles.statValue}>
                {activeJourney.last_check_in
                  ? formatTime(activeJourney.last_check_in)
                  : "Not yet"}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Interval</Text>
              <Text style={styles.statValue}>{activeJourney.check_in_interval_minutes} min</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkInButton}
            onPress={checkIn}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.checkInIcon}>✓</Text>
                <Text style={styles.checkInText}>Check In</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.endButton} onPress={endJourney}>
            <Text style={styles.endButtonText}>End Journey</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.newJourney}>
          <View style={styles.iconContainer}>
            <Text style={styles.bigIcon}>🗺️</Text>
          </View>
          <Text style={styles.title}>Start a Journey</Text>
          <Text style={styles.subtitle}>
            Share your trip with emergency contacts. They&apos;ll be notified if you miss a check-in.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Where are you going?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Home, Office, Gym"
              placeholderTextColor="#9CA3AF"
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          <TouchableOpacity
            style={[styles.startButton, loading && styles.buttonDisabled]}
            onPress={startJourney}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Start Journey</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>How Journey Tracking Works</Text>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Enter your destination and start the journey</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Check in periodically to confirm you&apos;re safe</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>Miss a check-in? Contacts are automatically notified</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 20,
  },
  activeJourney: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#DC2626",
  },
  journeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  journeyIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  journeyInfo: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
    marginBottom: 4,
  },
  journeyDestination: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  journeyStats: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  checkInButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  checkInIcon: {
    fontSize: 20,
    color: "#fff",
  },
  checkInText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  endButton: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  endButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  newJourney: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  bigIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  startButton: {
    backgroundColor: "#DC2626",
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  howItWorks: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  howTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
})
