import { useLocalSearchParams, router } from "expo-router";
import { Stack } from "expo-router";
import { MapPin, Users, ShieldCheck, Target, ExternalLink } from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { projects, categoryColors } from "@/mocks/projects";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useMemo(() => projects.find((p) => p.id === id), [id]);
  if (!project) return (<View style={st.container}><Stack.Screen options={{ title: "Not Found" }} /><View style={st.center}><Text style={st.notFound}>Project not found</Text></View></View>);
  const progress = project.raised / project.goal;
  const cc = categoryColors[project.category] ?? Colors.dark.accent;
  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: project.name }} />
      <Image source={{ uri: project.imageUrl }} style={st.hero} contentFit="cover" />
      <View style={st.body}>
        <Text style={st.title}>{project.name}</Text>
        <View style={st.metaRow}><MapPin size={14} color={Colors.dark.textMuted} /><Text style={st.metaText}>{project.location}</Text></View>
        <Text style={st.desc}>{project.description}</Text>
        <View style={st.progressCard}>
          <View style={st.progressHeader}><Text style={st.progressLabel}>Funding Progress</Text><Text style={st.progressPct}>{Math.round(progress * 100)}%</Text></View>
          <View style={st.progressBar}><View style={[st.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: cc }]} /></View>
          <View style={st.progressFooter}><Text style={st.raisedAmt}>${project.raised.toLocaleString()}</Text><Text style={st.goalAmt}>of ${project.goal.toLocaleString()} {project.currency}</Text></View>
        </View>
        <View style={st.statsGrid}>
          <View style={st.statCard}><Users size={20} color={Colors.dark.accent} /><Text style={st.statValue}>{project.beneficiaries.toLocaleString()}</Text><Text style={st.statLabel}>Beneficiaries</Text></View>
          <View style={st.statCard}><ShieldCheck size={20} color={Colors.dark.accent} /><Text style={st.statValue}>{project.verifications}</Text><Text style={st.statLabel}>Verifications</Text></View>
          <View style={st.statCard}><Target size={20} color={Colors.dark.accent} /><Text style={st.statValue}>{project.milestonesCompleted}/{project.milestones}</Text><Text style={st.statLabel}>Milestones</Text></View>
        </View>
        <TouchableOpacity style={st.explorerBtn} onPress={() => Linking.openURL("https://etherscan.io")}><ExternalLink size={16} color={Colors.dark.accent} /><Text style={st.explorerLabel}>View on Block Explorer</Text></TouchableOpacity>
        <TouchableOpacity style={st.verifyBtn} onPress={() => router.push("/modal")}><Text style={st.verifyLabel}>Verify Transaction</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, color: Colors.dark.textMuted },
  hero: { width: "100%", height: 220 },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: "800" as const, color: Colors.dark.text, lineHeight: 30, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  metaText: { fontSize: 14, color: Colors.dark.textSecondary },
  desc: { fontSize: 15, color: Colors.dark.textSecondary, lineHeight: 23, marginBottom: 24 },
  progressCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  progressLabel: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  progressPct: { fontSize: 14, fontWeight: "700" as const, color: Colors.dark.accent },
  progressBar: { height: 8, backgroundColor: Colors.dark.surfaceLight, borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 4 },
  progressFooter: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  raisedAmt: { fontSize: 20, fontWeight: "800" as const, color: Colors.dark.text },
  goalAmt: { fontSize: 14, color: Colors.dark.textMuted },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.dark.border, gap: 6 },
  statValue: { fontSize: 18, fontWeight: "700" as const, color: Colors.dark.text },
  statLabel: { fontSize: 11, color: Colors.dark.textMuted },
  explorerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.accent, backgroundColor: Colors.dark.accentMuted, marginBottom: 10 },
  explorerLabel: { fontSize: 15, color: Colors.dark.accent, fontWeight: "600" as const },
  verifyBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.dark.accent },
  verifyLabel: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" as const },
});
