import { useLocalSearchParams, router } from "expo-router";
import { Stack } from "expo-router";
import { MapPin, Users, ShieldCheck, Target, ExternalLink, Send, TrendingUp, Clock, Coins } from "lucide-react-native";
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
          <View style={st.progressHeader}>
            <View style={st.progressTitleRow}>
              <View style={[st.progressIconWrap, { backgroundColor: cc + '20' }]}><TrendingUp size={16} color={cc} /></View>
              <Text style={st.progressLabel}>Funding Progress</Text>
            </View>
            <View style={[st.progressPctBadge, { backgroundColor: cc + '18' }]}>
              <Text style={[st.progressPct, { color: cc }]}>{Math.round(progress * 100)}%</Text>
            </View>
          </View>
          <View style={st.progressAmountRow}>
            <Text style={st.raisedAmt}>${project.raised.toLocaleString()}</Text>
            <Text style={st.goalAmt}>of ${project.goal.toLocaleString()} {project.currency}</Text>
          </View>
          <View style={st.progressBarOuter}>
            <View style={[st.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: cc }]} />
          </View>
          <View style={st.progressDetails}>
            <View style={st.progressDetailItem}>
              <Coins size={13} color={Colors.dark.textMuted} />
              <Text style={st.progressDetailText}>{project.currency}</Text>
            </View>
            <View style={st.progressDetailItem}>
              <Clock size={13} color={Colors.dark.textMuted} />
              <Text style={st.progressDetailText}>{new Date(project.endDate) > new Date() ? `${Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 'Ended'}</Text>
            </View>
            <View style={st.progressDetailItem}>
              <Text style={[st.progressRemaining, { color: cc }]}>${(project.goal - project.raised).toLocaleString()} to go</Text>
            </View>
          </View>
        </View>
        <View style={st.statsGrid}>
          <View style={st.statCard}><Users size={20} color={Colors.dark.accent} /><Text style={st.statValue}>{project.beneficiaries.toLocaleString()}</Text><Text style={st.statLabel}>Beneficiaries</Text></View>
          <View style={st.statCard}><ShieldCheck size={20} color={Colors.dark.accent} /><Text style={st.statValue}>{project.verifications}</Text><Text style={st.statLabel}>Verifications</Text></View>
          <View style={st.statCard}><Target size={20} color={Colors.dark.accent} /><Text style={st.statValue}>{project.milestonesCompleted}/{project.milestones}</Text><Text style={st.statLabel}>Milestones</Text></View>
        </View>
        {project.status === "active" && (
          <TouchableOpacity
            style={st.fundBtn}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: "/send", params: { projectId: project.id, projectName: project.name, projectAddress: `0x${project.id.replace("proj-", "")}...${project.team.slice(0, 4).toLowerCase()}` } })}
            testID="fund-project-btn"
          >
            <Send size={18} color="#fff" />
            <Text style={st.fundBtnText}>Fund this Project</Text>
          </TouchableOpacity>
        )}
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
  progressCard: { backgroundColor: Colors.dark.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 20 },
  progressHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginBottom: 16 },
  progressTitleRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  progressIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center" as const, justifyContent: "center" as const },
  progressLabel: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text },
  progressPctBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  progressPct: { fontSize: 14, fontWeight: "800" as const },
  progressAmountRow: { flexDirection: "row" as const, alignItems: "baseline" as const, gap: 6, marginBottom: 14 },
  raisedAmt: { fontSize: 26, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5 },
  goalAmt: { fontSize: 14, color: Colors.dark.textMuted, fontWeight: "500" as const },
  progressBarOuter: { height: 10, backgroundColor: Colors.dark.surfaceLight, borderRadius: 5, overflow: "hidden" as const, marginBottom: 16 },
  progressFill: { height: "100%" as const, borderRadius: 5 },
  progressDetails: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  progressDetailItem: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5 },
  progressDetailText: { fontSize: 12, color: Colors.dark.textMuted, fontWeight: "500" as const },
  progressRemaining: { fontSize: 12, fontWeight: "700" as const },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.dark.border, gap: 6 },
  statValue: { fontSize: 18, fontWeight: "700" as const, color: Colors.dark.text },
  statLabel: { fontSize: 11, color: Colors.dark.textMuted },
  fundBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.dark.accent, marginBottom: 12, shadowColor: Colors.dark.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  fundBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#FFFFFF" },
  explorerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.accent, backgroundColor: Colors.dark.accentMuted, marginBottom: 10 },
  explorerLabel: { fontSize: 15, color: Colors.dark.accent, fontWeight: "600" as const },
  verifyBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.dark.accent },
  verifyLabel: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" as const },
});
