import { Link, Stack } from "expo-router";
import { LinkIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ImpactChainNotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerStyle: { backgroundColor: "#0A1628" }, headerTintColor: "#F1F5F9" }} />
      <View style={nf.container}>
        <View style={nf.iconWrap}><LinkIcon size={32} color="#64748B" /></View>
        <Text style={nf.heading}>Page not found</Text>
        <Link href="/" style={nf.link}><Text style={nf.linkLabel}>Back to Dashboard</Text></Link>
      </View>
    </>
  );
}

const nf = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0A1628" },
  iconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#111D32", borderWidth: 1, borderColor: "#1E2D4A", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: "700" as const, color: "#F1F5F9", marginBottom: 8 },
  link: { marginTop: 28, paddingVertical: 14, paddingHorizontal: 28, backgroundColor: "#10B981", borderRadius: 14 },
  linkLabel: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" as const },
});
