import { useEffect } from "react"
import { Redirect } from "expo-router"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { useAuth } from "@/context/auth"

export default function Index() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    )
  }

  if (session) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
})
