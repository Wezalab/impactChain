import { router } from "expo-router";
import { DollarSign, Users, ArrowUpDown, ShieldCheck, TrendingUp, ChevronRight, Zap, Globe, Send } from "lucide-react-native";
import React, { useCallback, useRef, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Dimensions } from "react-native";
import Colors from "@/constants/colors";
import { dashboardMetrics } from "@/mocks/metrics";
import { projects } from "@/mocks/projects";
import { transactions } from "@/mocks/transactions";

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.floor((SW - 52) / 2);
const ICONS: Record<string, React.ElementType> = { "total-funded": DollarSign, beneficiaries: Users, transactions: ArrowUpDown, verifications: ShieldCheck };

function MetricCard({ metric, index }: { metric: (typeof dashboardMetrics)[0]; index: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  useEffect(() => { Animated.parallel([Animated.timing(fade, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }), Animated.timing(slide, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true })]).start(); }, []);
  const Icon = ICONS[metric.id] || Zap;
  return (
    <Animated.View style={[st.metricCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={st.metricIconRow}>
        <View style={st.metricIconWrap}><Icon size={16} color={Colors.dark.accent} /></View>
        <View style={st.changeBadge}><TrendingUp size={10} color={Colors.dark.accentLight} /><Text style={st.changeText}>+{metric.change}%</Text></View>
      </View>
      <Text style={st.metricValue}>{metric.value}</Text>
      <Text style={st.metricLabel}>{metric.label}</Text>
    </Animated.View>
  );
}

function RecentTx({ tx }: { tx: (typeof transactions)[0] }) {
  const tc: Record<string, string> = { donation: Colors.dark.accent, disbursement: Colors.dark.info, verification: Colors.dark.warning, milestone: "#A855F7" };
  const sc: Record<string, string> = { confirmed: Colors.dark.accent, processing: Colors.dark.warning, pending: Colors.dark.textMuted };
  return (
    <TouchableOpacity style={st.txRow} activeOpacity={0.7} onPress={() => router.push("/(tabs)/transactions")} testID={`tx-${tx.id}`}>
      <View style={[st.txDot, { backgroundColor: tc[tx.type] ?? Colors.dark.accent }]} />
      <View style={st.txInfo}>
        <Text style={st.txTitle} numberOfLines={1}>{tx.title}</Text>
        <Text style={st.txMeta}>{tx.network} {"\u00B7"} {tx.currency}</Text>
      </View>
      <View style={st.txRight}>
        {tx.amount > 0 && <Text style={st.txAmount}>{tx.type === "disbursement" ? "-" : "+"}{tx.amount.toLocaleString()} {tx.currency}</Text>}
        <Text style={[st.txStatus, { color: sc[tx.status] ?? Colors.dark.textMuted }]}>{tx.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ImpactChainDashboard() {
  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);
  const topProjects = projects.filter((p) => p.status === "active").slice(0, 3);
  const recentTxs = transactions.slice(0, 4);
  const goProjects = useCallback(() => { router.push("/(tabs)/projects"); }, []);
  const goTxs = useCallback(() => { router.push("/(tabs)/transactions"); }, []);

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false} testID="dashboard-scroll">
      <Animated.View style={[st.heroSection, { opacity: headerFade }]}>
        <View style={st.heroTop}>
          <View style={st.heroIconWrap}><Globe size={20} color={Colors.dark.accent} /></View>
          <View><Text style={st.heroTitle}>ImpactChain</Text><Text style={st.heroSubtitle}>Blockchain for Social Good</Text></View>
        </View>
        <View style={st.heroBanner}>
          <Text style={st.heroBannerText}>Transparent, accountable aid tracking powered by distributed ledger technology</Text>
          <View style={st.networkBadges}>
            {["Ethereum", "Polygon", "Celo"].map((n) => (<View key={n} style={st.networkBadge}><Text style={st.networkBadgeText}>{n}</Text></View>))}
          </View>
        </View>
      </Animated.View>
      <View style={st.metricsGrid}>{dashboardMetrics.map((m, i) => <MetricCard key={m.id} metric={m} index={i} />)}</View>
      <View style={st.sectionHeader}>
        <Text style={st.sectionTitle}>Active Projects</Text>
        <TouchableOpacity onPress={goProjects} style={st.viewAllBtn}><Text style={st.viewAllText}>View All</Text><ChevronRight size={14} color={Colors.dark.accent} /></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.projectsScroll}>
        {topProjects.map((p) => {
          const prog = p.raised / p.goal;
          const catCol = p.category === "education" ? "#3B82F6" : p.category === "water" ? "#06B6D4" : p.category === "health" ? "#EF4444" : p.category === "agriculture" ? "#10B981" : "#8B5CF6";
          return (
            <TouchableOpacity key={p.id} style={st.projectCard} activeOpacity={0.8} onPress={() => router.push(`/project/${p.id}`)} testID={`pcard-${p.id}`}>
              <View style={st.projectHeader}><View style={[st.projectCatDot, { backgroundColor: catCol }]} /><Text style={st.projectCategory}>{p.category.charAt(0).toUpperCase() + p.category.slice(1)}</Text></View>
              <Text style={st.projectName} numberOfLines={2}>{p.name}</Text>
              <Text style={st.projectLocation}>{p.location}</Text>
              <View style={st.projectProgWrap}><View style={st.projectProgBar}><View style={[st.projectProgFill, { width: `${Math.min(prog * 100, 100)}%` }]} /></View><Text style={st.projectProgText}>{Math.round(prog * 100)}%</Text></View>
              <View style={st.projectFooter}><Text style={st.projectRaised}>${p.raised.toLocaleString()}</Text><Text style={st.projectGoal}>/ ${p.goal.toLocaleString()}</Text></View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={st.sectionHeader}>
        <Text style={st.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={goTxs} style={st.viewAllBtn}><Text style={st.viewAllText}>View All</Text><ChevronRight size={14} color={Colors.dark.accent} /></TouchableOpacity>
      </View>
      <View style={st.txContainer}>{recentTxs.map((tx) => <RecentTx key={tx.id} tx={tx} />)}</View>
      <View style={{ height: 20 }} />
    </ScrollView>
    <TouchableOpacity style={st.fab} activeOpacity={0.85} onPress={() => router.push("/send")} testID="send-fab">
      <Send size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { paddingBottom: 40 },
  heroSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 22, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 13, color: Colors.dark.textSecondary, marginTop: 1 },
  heroBanner: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border },
  heroBannerText: { fontSize: 14, color: Colors.dark.textSecondary, lineHeight: 21, marginBottom: 14 },
  networkBadges: { flexDirection: "row", gap: 8 },
  networkBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: Colors.dark.surfaceLight, borderWidth: 1, borderColor: Colors.dark.borderLight },
  networkBadgeText: { fontSize: 12, color: Colors.dark.textSecondary, fontWeight: "500" as const },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12, marginTop: 20 },
  metricCard: { width: CARD_W, backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  metricIconRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  metricIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center" },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.dark.accentMuted, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  changeText: { fontSize: 11, color: Colors.dark.accentLight, fontWeight: "600" as const },
  metricValue: { fontSize: 22, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5 },
  metricLabel: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 4, fontWeight: "500" as const },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 28, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, color: Colors.dark.text },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: 13, color: Colors.dark.accent, fontWeight: "600" as const },
  projectsScroll: { paddingHorizontal: 20, gap: 12 },
  projectCard: { width: 240, backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginRight: 12 },
  projectHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  projectCatDot: { width: 8, height: 8, borderRadius: 4 },
  projectCategory: { fontSize: 12, color: Colors.dark.textMuted, fontWeight: "500" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  projectName: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text, lineHeight: 21, marginBottom: 4 },
  projectLocation: { fontSize: 12, color: Colors.dark.textSecondary, marginBottom: 14 },
  projectProgWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  projectProgBar: { flex: 1, height: 5, backgroundColor: Colors.dark.surfaceLight, borderRadius: 3, overflow: "hidden" },
  projectProgFill: { height: "100%", backgroundColor: Colors.dark.accent, borderRadius: 3 },
  projectProgText: { fontSize: 12, fontWeight: "700" as const, color: Colors.dark.accent },
  projectFooter: { flexDirection: "row", alignItems: "baseline", marginTop: 10 },
  projectRaised: { fontSize: 16, fontWeight: "700" as const, color: Colors.dark.text },
  projectGoal: { fontSize: 12, color: Colors.dark.textMuted, marginLeft: 2 },
  txContainer: { paddingHorizontal: 20, backgroundColor: Colors.dark.surface, marginHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  txDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  txMeta: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.text },
  txStatus: { fontSize: 11, fontWeight: "500" as const, marginTop: 2, textTransform: "capitalize" as const },
  fab: { position: "absolute" as const, bottom: 24, right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.dark.accent, alignItems: "center" as const, justifyContent: "center" as const, shadowColor: Colors.dark.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
