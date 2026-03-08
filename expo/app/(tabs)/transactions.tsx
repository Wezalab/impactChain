import { ArrowDownLeft, ArrowUpRight, ShieldCheck, Trophy, Clock, CheckCircle2, Loader, Copy } from "lucide-react-native";
import React, { useState, useMemo, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { transactions, type Transaction } from "@/mocks/transactions";

const TXC: Record<Transaction["type"], { icon: React.ElementType; color: string; label: string }> = {
  donation: { icon: ArrowDownLeft, color: Colors.dark.accent, label: "Donation" },
  disbursement: { icon: ArrowUpRight, color: Colors.dark.info, label: "Disbursement" },
  verification: { icon: ShieldCheck, color: Colors.dark.warning, label: "Verification" },
  milestone: { icon: Trophy, color: "#A855F7", label: "Milestone" },
};
const STC: Record<Transaction["status"], { icon: React.ElementType; color: string }> = {
  confirmed: { icon: CheckCircle2, color: Colors.dark.accent },
  processing: { icon: Loader, color: Colors.dark.warning },
  pending: { icon: Clock, color: Colors.dark.textMuted },
};
const FILTERS = ["all", "donation", "disbursement", "verification", "milestone"] as const;

function fmtTime(ts: string): string {
  const d = new Date(ts); const now = new Date(); const diff = now.getTime() - d.getTime(); const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now"; if (h < 24) return `${h}h ago`; const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`; return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TxRow({ tx }: { tx: Transaction }) {
  const cfg = TXC[tx.type]; const stc = STC[tx.status]; const IC = cfg.icon; const SI = stc.icon;
  const [exp, setExp] = useState(false);
  const cp = useCallback((t: string) => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert("Copied", t); }, []);
  return (
    <TouchableOpacity style={st.txCard} activeOpacity={0.85} onPress={() => setExp(!exp)} testID={`tx-row-${tx.id}`}>
      <View style={st.txMain}>
        <View style={[st.txIconWrap, { backgroundColor: cfg.color + "20" }]}><IC size={18} color={cfg.color} /></View>
        <View style={st.txInfo}><Text style={st.txTitle} numberOfLines={1}>{tx.title}</Text><View style={st.txSubRow}><Text style={st.txTypeLabel}>{cfg.label}</Text><Text style={st.txDiv}>{"\u00B7"}</Text><Text style={st.txTime}>{fmtTime(tx.timestamp)}</Text></View></View>
        <View style={st.txRight}>
          {tx.amount > 0 ? <Text style={[st.txAmount, tx.type === "disbursement" ? { color: Colors.dark.error } : { color: Colors.dark.accent }]}>{tx.type === "disbursement" ? "-" : "+"}{tx.amount.toLocaleString()} {tx.currency}</Text> : <Text style={st.txAmtN}>{tx.currency}</Text>}
          <View style={st.statusRow}><SI size={12} color={stc.color} /><Text style={[st.statusLabel, { color: stc.color }]}>{tx.status}</Text></View>
        </View>
      </View>
      {exp && (
        <View style={st.txDetails}>
          <Text style={st.txDesc}>{tx.description}</Text>
          <View style={st.detailRow}><Text style={st.detailLabel}>From</Text><TouchableOpacity style={st.addrRow} onPress={() => cp(tx.from)}><Text style={st.detailMono}>{tx.from}</Text><Copy size={12} color={Colors.dark.textMuted} /></TouchableOpacity></View>
          <View style={st.detailRow}><Text style={st.detailLabel}>To</Text><TouchableOpacity style={st.addrRow} onPress={() => cp(tx.to)}><Text style={st.detailMono}>{tx.to}</Text><Copy size={12} color={Colors.dark.textMuted} /></TouchableOpacity></View>
          {tx.blockNumber > 0 && (<View style={st.detailRow}><Text style={st.detailLabel}>Block</Text><Text style={st.detailValue}>#{tx.blockNumber.toLocaleString()}</Text></View>)}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ImpactChainActivity() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = useMemo(() => filter === "all" ? transactions : transactions.filter((t) => t.type === filter), [filter]);
  const renderTx = useCallback(({ item }: { item: Transaction }) => <TxRow tx={item} />, []);
  const vol = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), []);

  return (
    <View style={st.container}>
      <View style={st.summaryBar}>
        <View style={st.summaryItem}><Text style={st.summaryLabel}>Volume</Text><Text style={st.summaryValue}>${vol.toLocaleString()}</Text></View>
        <View style={st.summaryDiv} />
        <View style={st.summaryItem}><Text style={st.summaryLabel}>Count</Text><Text style={st.summaryValue}>{transactions.length}</Text></View>
        <View style={st.summaryDiv} />
        <View style={st.summaryItem}><Text style={st.summaryLabel}>Confirmed</Text><Text style={[st.summaryValue, { color: Colors.dark.accent }]}>{transactions.filter((t) => t.status === "confirmed").length}</Text></View>
      </View>
      <FlatList horizontal data={FILTERS} keyExtractor={(i) => i} showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterScroll} style={st.filterList}
        renderItem={({ item }) => { const c = item === "all" ? null : TXC[item as Transaction["type"]]; return (<TouchableOpacity style={[st.filterChip, filter === item && st.filterChipActive]} onPress={() => setFilter(item)}><Text style={[st.filterText, filter === item && st.filterTextActive]}>{item === "all" ? "All" : c?.label ?? item}</Text></TouchableOpacity>); }} />
      <FlatList data={filtered} renderItem={renderTx} keyExtractor={(i) => i.id} contentContainerStyle={st.listContent} showsVerticalScrollIndicator={false} />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  summaryBar: { flexDirection: "row", marginHorizontal: 20, marginTop: 8, backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, color: Colors.dark.textMuted, fontWeight: "500" as const, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700" as const, color: Colors.dark.text },
  summaryDiv: { width: 1, backgroundColor: Colors.dark.border, marginVertical: 2 },
  filterList: { flexGrow: 0, marginTop: 14, marginBottom: 8 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.dark.accentMuted, borderColor: Colors.dark.accent },
  filterText: { fontSize: 13, color: Colors.dark.textSecondary, fontWeight: "500" as const },
  filterTextActive: { color: Colors.dark.accent, fontWeight: "600" as const },
  listContent: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 6 },
  txCard: { backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.dark.border },
  txMain: { flexDirection: "row", alignItems: "center" },
  txIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text, marginBottom: 3 },
  txSubRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  txTypeLabel: { fontSize: 12, color: Colors.dark.textMuted, fontWeight: "500" as const },
  txDiv: { color: Colors.dark.textMuted, fontSize: 12 },
  txTime: { fontSize: 12, color: Colors.dark.textMuted },
  txRight: { alignItems: "flex-end", marginLeft: 8 },
  txAmount: { fontSize: 14, fontWeight: "700" as const, marginBottom: 3 },
  txAmtN: { fontSize: 13, color: Colors.dark.textSecondary, fontWeight: "500" as const, marginBottom: 3 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusLabel: { fontSize: 11, fontWeight: "500" as const, textTransform: "capitalize" as const },
  txDetails: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.dark.border },
  txDesc: { fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 19, marginBottom: 14 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  detailLabel: { fontSize: 12, color: Colors.dark.textMuted, fontWeight: "500" as const },
  detailValue: { fontSize: 13, color: Colors.dark.text, fontWeight: "500" as const },
  detailMono: { fontSize: 12, color: Colors.dark.textSecondary, fontFamily: "monospace" },
  addrRow: { flexDirection: "row", alignItems: "center", gap: 6 },
});
