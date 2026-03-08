import { Tabs } from "expo-router";
import { LayoutDashboard, FolderKanban, ArrowLeftRight, User } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet } from "react-native";

const TC = { active: "#10B981", inactive: "#4B5E7A", bg: "#0D1B2E", border: "#1E2D4A" };

export default function ImpactChainTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#0A1628" },
        headerTintColor: "#F1F5F9",
        headerTitleStyle: { fontWeight: "700" as const, fontSize: 18 },
        headerShadowVisible: false,
        tabBarActiveTintColor: TC.active,
        tabBarInactiveTintColor: TC.inactive,
        tabBarStyle: ts.bar,
        tabBarLabelStyle: ts.label,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "ImpactChain", tabBarLabel: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: ({ color, size }) => <FolderKanban color={color} size={size} /> }} />
      <Tabs.Screen name="transactions" options={{ title: "Activity", tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}

const ts = StyleSheet.create({
  bar: { backgroundColor: TC.bg, borderTopColor: TC.border, borderTopWidth: 1, elevation: 0, shadowOpacity: 0, ...(Platform.OS === "web" ? { height: 60 } : {}) },
  label: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.2 },
});
