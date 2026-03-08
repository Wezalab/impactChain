import { router } from "expo-router";
import { X, ShieldCheck, ExternalLink } from "lucide-react-native";
import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";

const MC = { surface: "#111D32", surfaceLight: "#1A2740", border: "#1E2D4A", text: "#F1F5F9", textSec: "#94A3B8", textMuted: "#64748B", accent: "#10B981", accentMuted: "rgba(16, 185, 129, 0.15)", overlay: "rgba(10, 22, 40, 0.85)" };

export default function VerificationModal() {
  return (
    <Modal animationType="fade" transparent={true} visible={true} onRequestClose={() => router.back()}>
      <Pressable style={ms.overlay} onPress={() => router.back()}>
        <View style={ms.card} onStartShouldSetResponder={() => true}>
          <View style={ms.header}><Text style={ms.headerTitle}>Transaction Verified</Text><TouchableOpacity style={ms.closeBtn} onPress={() => router.back()}><X size={18} color={MC.textMuted} /></TouchableOpacity></View>
          <View style={ms.iconCenter}><ShieldCheck size={48} color={MC.accent} /></View>
          <Text style={ms.verifiedHeading}>On-Chain Verified</Text>
          <Text style={ms.verifiedBody}>This transaction has been permanently recorded on the blockchain.</Text>
          <TouchableOpacity style={ms.doneBtn} onPress={() => router.back()}><Text style={ms.doneLabel}>Done</Text></TouchableOpacity>
        </View>
      </Pressable>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: MC.overlay, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: MC.surface, borderRadius: 24, padding: 28, marginHorizontal: 24, width: "90%", maxWidth: 400, borderWidth: 1, borderColor: MC.border },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, color: MC.text },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: MC.surfaceLight, alignItems: "center", justifyContent: "center" },
  iconCenter: { alignItems: "center", marginBottom: 16 },
  verifiedHeading: { fontSize: 20, fontWeight: "700" as const, color: MC.text, textAlign: "center", marginBottom: 8 },
  verifiedBody: { fontSize: 14, color: MC.textSec, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  doneBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: MC.accent },
  doneLabel: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" as const },
});
