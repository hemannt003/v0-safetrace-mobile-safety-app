import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import { useAuth } from "@/context/auth"

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut()
          router.replace("/(auth)/login")
        },
      },
    ])
  }

  const menuItems = [
    { icon: "👤", label: "Edit Profile", action: () => {} },
    { icon: "🔔", label: "Notifications", action: () => {} },
    { icon: "📍", label: "Safe Zones", action: () => {} },
    { icon: "🔒", label: "Privacy & Security", action: () => {} },
    { icon: "❓", label: "Help & Support", action: () => {} },
    { icon: "📄", label: "Terms of Service", action: () => {} },
    { icon: "🔐", label: "Privacy Policy", action: () => {} },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.full_name?.charAt(0) || "U"}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || "User"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile?.phone && <Text style={styles.phone}>{profile.phone}</Text>}
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.action}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutIcon}>🚪</Text>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>SafeTrace v1.0.0</Text>
        <Text style={styles.copyright}>Women&apos;s Safety System</Text>
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
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: "#6B7280",
  },
  menuSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  menuArrow: {
    fontSize: 20,
    color: "#9CA3AF",
  },
  signOutButton: {
    backgroundColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutIcon: {
    fontSize: 20,
  },
  signOutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 20,
  },
  version: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: "#9CA3AF",
  },
})
