import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native"
import { Link } from "expo-router"
import { useAuth } from "@/context/auth"
import { getActiveAlerts, getEmergencyContacts } from "@/lib/alerts"
import { requestLocationPermission, getCurrentLocation } from "@/lib/location"
import type { Alert, EmergencyContact } from "@/lib/types"

export default function HomeScreen() {
  const { user, profile } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkPermissions()
    loadData()
  }, [user])

  const checkPermissions = async () => {
    const granted = await requestLocationPermission()
    setLocationEnabled(granted)
  }

  const loadData = async () => {
    if (!user) return
    
    const [alertsData, contactsData] = await Promise.all([
      getActiveAlerts(user.id),
      getEmergencyContacts(user.id),
    ])
    
    setAlerts(alertsData)
    setContacts(contactsData)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DC2626"]} />
      }
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Hello,</Text>
        <Text style={styles.userName}>{profile?.full_name || "User"}</Text>
      </View>

      {/* Status Cards */}
      <View style={styles.statusSection}>
        <View style={[styles.statusCard, locationEnabled ? styles.statusOk : styles.statusWarning]}>
          <Text style={styles.statusIcon}>{locationEnabled ? "✓" : "!"}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Location</Text>
            <Text style={styles.statusValue}>
              {locationEnabled ? "Enabled" : "Enable for safety"}
            </Text>
          </View>
        </View>

        <View style={[styles.statusCard, alerts.length === 0 ? styles.statusOk : styles.statusAlert]}>
          <Text style={styles.statusIcon}>{alerts.length === 0 ? "✓" : "⚠"}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Active Alerts</Text>
            <Text style={styles.statusValue}>
              {alerts.length === 0 ? "All clear" : `${alerts.length} active`}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <Link href="/(tabs)/sos" asChild>
          <TouchableOpacity style={styles.sosButton}>
            <Text style={styles.sosButtonIcon}>🆘</Text>
            <Text style={styles.sosButtonText}>Emergency SOS</Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.actionRow}>
          <Link href="/(tabs)/journey" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionText}>Start Journey</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/contacts" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Contacts</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Emergency Contacts */}
      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      {contacts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No emergency contacts</Text>
          <Link href="/(tabs)/contacts" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <View style={styles.contactsList}>
          {contacts.slice(0, 3).map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              {contact.is_primary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
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
  greeting: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  statusSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  statusOk: {
    backgroundColor: "#ECFDF5",
  },
  statusWarning: {
    backgroundColor: "#FEF3C7",
  },
  statusAlert: {
    backgroundColor: "#FEE2E2",
  },
  statusIcon: {
    fontSize: 24,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  quickActions: {
    gap: 12,
    marginBottom: 24,
  },
  sosButton: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 16,
    gap: 12,
  },
  sosButtonIcon: {
    fontSize: 28,
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  contactsList: {
    gap: 8,
  },
  contactCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  contactPhone: {
    fontSize: 14,
    color: "#6B7280",
  },
  primaryBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "500",
  },
})
