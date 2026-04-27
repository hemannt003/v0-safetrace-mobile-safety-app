import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Alert,
  Animated,
} from "react-native"
import { useAuth } from "@/context/auth"
import { triggerSOSAlert, cancelAlert } from "@/lib/alerts"
import type { Alert as AlertType } from "@/lib/types"

export default function SOSScreen() {
  const { user } = useAuth()
  const [isTriggered, setIsTriggered] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [activeAlert, setActiveAlert] = useState<AlertType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isTriggered) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start()

      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            sendSOS()
            return 0
          }
          Vibration.vibrate(200)
          return prev - 1
        })
      }, 1000)

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current)
        }
        pulseAnim.stopAnimation()
      }
    }
  }, [isTriggered])

  const handleSOSPress = () => {
    Vibration.vibrate(500)
    setIsTriggered(true)
    setCountdown(5)
  }

  const handleCancel = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
    setIsTriggered(false)
    setCountdown(5)
    pulseAnim.setValue(1)

    if (activeAlert) {
      await cancelAlert(activeAlert.id)
      setActiveAlert(null)
    }
  }

  const sendSOS = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const alert = await triggerSOSAlert(user.id, "sos")
      setActiveAlert(alert)
      Vibration.vibrate([0, 200, 100, 200, 100, 200])
      Alert.alert(
        "SOS Sent!",
        "Your emergency contacts have been notified with your location.",
        [{ text: "OK" }]
      )
    } catch (error) {
      Alert.alert("Error", "Failed to send SOS. Please try again.")
      setIsTriggered(false)
      setCountdown(5)
    }
    setIsLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>
          {activeAlert
            ? "Alert is active. Help is on the way."
            : "Press and hold for emergency assistance"}
        </Text>
      </View>

      <View style={styles.sosContainer}>
        {!isTriggered && !activeAlert ? (
          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleSOSPress}
            activeOpacity={0.8}
          >
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosHint}>Tap to trigger</Text>
          </TouchableOpacity>
        ) : isTriggered && countdown > 0 ? (
          <View style={styles.countdownContainer}>
            <Animated.View
              style={[
                styles.countdownCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </Animated.View>
            <Text style={styles.countdownText}>Sending SOS in...</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            <View style={styles.activeIndicator}>
              <Text style={styles.activeIcon}>🆘</Text>
              <Text style={styles.activeText}>SOS Active</Text>
            </View>
            <Text style={styles.activeSubtext}>
              Emergency contacts have been notified
            </Text>
            <TouchableOpacity style={styles.resolveButton} onPress={handleCancel}>
              <Text style={styles.resolveButtonText}>Cancel Alert</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>What happens when you trigger SOS:</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📍</Text>
          <Text style={styles.tipText}>Your location is shared with emergency contacts</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📱</Text>
          <Text style={styles.tipText}>SMS and push notifications are sent</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🎤</Text>
          <Text style={styles.tipText}>Audio recording starts automatically</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  sosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  sosText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  sosHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  countdownContainer: {
    alignItems: "center",
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#fff",
  },
  countdownText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 24,
  },
  cancelButton: {
    backgroundColor: "#374151",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  activeContainer: {
    alignItems: "center",
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    marginBottom: 16,
    gap: 12,
  },
  activeIcon: {
    fontSize: 24,
  },
  activeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  activeSubtext: {
    color: "#9CA3AF",
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  resolveButton: {
    backgroundColor: "#374151",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  resolveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tips: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    color: "#9CA3AF",
    fontSize: 14,
    flex: 1,
  },
})
