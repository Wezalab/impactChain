import { router } from "expo-router";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, ChevronRight, AlertCircle, Check, Clock, Ban } from "lucide-react-native";
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth, shortenAddress } from "@/providers/AuthProvider";
import { useProjects, type UserProject, type FundTransaction } from "@/providers/ProjectsProvider";

const { width: SW } = Dimensions.get("window");

type Tab = "overview" | "withdraw";

function FundTxRow({ tx }: { tx: FundTransaction }) {
  const isIncoming = tx.type === "incoming";
  const statusColors: Record<string, string> = {
    confirmed: Colors.dark.accent,
    pending: Colors.dark.warning,
    processing: Colors.dark.info,
  };
  return (
    <View style={st.txRow}>
      <View style={[st.txIconWrap, { backgroundColor: isIncoming ? Colors.dark.accentMuted : Colors.dark.infoMuted }]}>
        {isIncoming ? <ArrowDownLeft size={16} color={Colors.dark.accent} /> : <ArrowUpRight size={16} color={Colors.dark.info} />}
      </View>
      <View style={st.txInfo}>
        <Text style={st.txTitle} numberOfLines={1}>{tx.projectName ?? (isIncoming ? "Donation Received" : "Withdrawal")}</Text>
        <Text style={st.txMeta}>
          {new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      <View style={st.txRight}>
        <Text style={[st.txAmount, { color: isIncoming ? Colors.dark.accent : Colors.dark.text }]}>
          {isIncoming ? "+" : "-"}{tx.amount.toLocaleString()} {tx.currency}
        </Text>
        <View style={st.txStatusRow}>
          <View style={[st.txStatusDot, { backgroundColor: statusColors[tx.status] ?? Colors.dark.textMuted }]} />
          <Text style={[st.txStatusText, { color: statusColors[tx.status] ?? Colors.dark.textMuted }]}>{tx.status}</Text>
        </View>
      </View>
    </View>
  );
}

function ProjectFundCard({ project, onWithdraw }: { project: UserProject; onWithdraw: (p: UserProject) => void }) {
  const progress = project.goal > 0 ? project.raised / project.goal : 0;
  return (
    <View style={st.fundCard}>
      <View style={st.fundCardHeader}>
        <View style={st.fundCardIconWrap}>
          <Text style={st.fundCardIconText}>{project.name.charAt(0)}</Text>
        </View>
        <View style={st.fundCardInfo}>
          <Text style={st.fundCardName} numberOfLines={1}>{project.name}</Text>
          <Text style={st.fundCardMeta}>{project.donorsCount} donors · {project.location}</Text>
        </View>
      </View>
      <View style={st.fundCardStats}>
        <View style={st.fundStatItem}>
          <Text style={st.fundStatLabel}>Raised</Text>
          <Text style={st.fundStatValue}>${project.raised.toLocaleString()}</Text>
        </View>
        <View style={st.fundStatItem}>
          <Text style={st.fundStatLabel}>Available</Text>
          <Text style={[st.fundStatValue, { color: Colors.dark.accent }]}>${project.earnings.toLocaleString()}</Text>
        </View>
        <View style={st.fundStatItem}>
          <Text style={st.fundStatLabel}>Goal</Text>
          <Text style={st.fundStatValue}>${project.goal.toLocaleString()}</Text>
        </View>
      </View>
      <View style={st.fundProgressWrap}>
        <View style={st.fundProgressBar}>
          <View style={[st.fundProgressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
        <Text style={st.fundProgressText}>{Math.round(progress * 100)}%</Text>
      </View>
      {project.earnings > 0 && (
        <TouchableOpacity style={st.withdrawCardBtn} activeOpacity={0.8} onPress={() => onWithdraw(project)}>
          <ArrowUpRight size={14} color="#fff" />
          <Text style={st.withdrawCardBtnText}>Withdraw</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ManageFundsScreen() {
  const insets = useSafeAreaInsets();
  const { wallet } = useAuth();
  const { userProjects, fundTransactions, totalEarnings, totalRaised, withdraw } = useProjects();

  const [tab, setTab] = useState<Tab>("overview");
  const [withdrawProject, setWithdrawProject] = useState<UserProject | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (wallet?.address) setWithdrawAddress(wallet.address);
  }, [wallet]);

  const publishedProjects = useMemo(() => userProjects.filter((p) => p.published), [userProjects]);

  const handleWithdraw = useCallback(async () => {
    if (!withdrawProject || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }
    if (parseFloat(withdrawAmount) > withdrawProject.earnings) {
      Alert.alert("Error", "Amount exceeds available balance");
      return;
    }
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await withdraw.mutateAsync({
        projectId: withdrawProject.id,
        amount: parseFloat(withdrawAmount),
        toAddress: withdrawAddress || wallet?.address || "0x0",
      });
      Alert.alert("Success", `${withdrawAmount} ${withdrawProject.currency} withdrawn successfully`);
      setWithdrawAmount("");
      setWithdrawProject(null);
      setTab("overview");
    } catch (err) {
      Alert.alert("Error", "Withdrawal failed. Please try again.");
    }
  }, [withdrawProject, withdrawAmount, withdrawAddress, wallet, withdraw]);

  const startWithdraw = useCallback((project: UserProject) => {
    setWithdrawProject(project);
    setWithdrawAmount("");
    setTab("withdraw");
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => { if (tab === "withdraw") { setTab("overview"); } else { router.back(); } }} testID="back-btn">
          <ArrowLeft size={22} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{tab === "withdraw" ? "Withdraw Funds" : "Manage Funds"}</Text>
        <View style={st.headerRight} />
      </View>

      <ScrollView
        style={st.flex}
        contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeIn }}>
          {tab === "overview" && (
            <>
              <View style={st.balanceCard}>
                <View style={st.balanceTop}>
                  <View style={st.balanceIconWrap}>
                    <Wallet size={20} color={Colors.dark.accent} />
                  </View>
                  <View style={st.balanceBadge}>
                    <TrendingUp size={10} color={Colors.dark.accent} />
                    <Text style={st.balanceBadgeText}>Active</Text>
                  </View>
                </View>
                <Text style={st.balanceLabel}>Total Available</Text>
                <Text style={st.balanceValue}>${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
                <View style={st.balanceStats}>
                  <View style={st.balanceStat}>
                    <Text style={st.balanceStatLabel}>Total Raised</Text>
                    <Text style={st.balanceStatValue}>${totalRaised.toLocaleString()}</Text>
                  </View>
                  <View style={st.balanceStatDiv} />
                  <View style={st.balanceStat}>
                    <Text style={st.balanceStatLabel}>Projects</Text>
                    <Text style={st.balanceStatValue}>{publishedProjects.length}</Text>
                  </View>
                  <View style={st.balanceStatDiv} />
                  <View style={st.balanceStat}>
                    <Text style={st.balanceStatLabel}>Transactions</Text>
                    <Text style={st.balanceStatValue}>{fundTransactions.length}</Text>
                  </View>
                </View>
              </View>

              <View style={st.quickActions}>
                <TouchableOpacity style={st.quickAction} activeOpacity={0.8} onPress={() => router.push("/receive")} testID="receive-btn">
                  <View style={st.quickActionIcon}><ArrowDownLeft size={18} color={Colors.dark.accent} /></View>
                  <Text style={st.quickActionText}>Receive</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.quickAction} activeOpacity={0.8} onPress={() => router.push("/send")} testID="send-btn">
                  <View style={[st.quickActionIcon, { backgroundColor: Colors.dark.infoMuted }]}><ArrowUpRight size={18} color={Colors.dark.info} /></View>
                  <Text style={st.quickActionText}>Send</Text>
                </TouchableOpacity>
              </View>

              {publishedProjects.length > 0 && (
                <>
                  <Text style={st.sectionTitle}>Project Funds</Text>
                  {publishedProjects.map((p) => (
                    <ProjectFundCard key={p.id} project={p} onWithdraw={startWithdraw} />
                  ))}
                </>
              )}

              {publishedProjects.length === 0 && (
                <View style={st.emptyState}>
                  <Ban size={40} color={Colors.dark.textMuted} />
                  <Text style={st.emptyTitle}>No Published Projects</Text>
                  <Text style={st.emptySubtitle}>Create and publish a project to start receiving funds</Text>
                  <TouchableOpacity style={st.emptyBtn} onPress={() => router.push("/create-project")} testID="create-project-btn">
                    <Text style={st.emptyBtnText}>Create Project</Text>
                  </TouchableOpacity>
                </View>
              )}

              {fundTransactions.length > 0 && (
                <>
                  <Text style={st.sectionTitle}>Recent Transactions</Text>
                  <View style={st.txCard}>
                    {fundTransactions.slice(0, 10).map((tx) => (
                      <FundTxRow key={tx.id} tx={tx} />
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {tab === "withdraw" && withdrawProject && (
            <>
              <View style={st.withdrawHeader}>
                <View style={st.withdrawProjectRow}>
                  <View style={st.withdrawProjectIcon}>
                    <Text style={st.withdrawProjectIconText}>{withdrawProject.name.charAt(0)}</Text>
                  </View>
                  <View style={st.withdrawProjectInfo}>
                    <Text style={st.withdrawProjectName}>{withdrawProject.name}</Text>
                    <Text style={st.withdrawProjectBal}>
                      Available: {withdrawProject.earnings.toLocaleString()} {withdrawProject.currency}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={st.withdrawLabel}>Amount</Text>
              <View style={st.withdrawInputRow}>
                <TextInput
                  style={st.withdrawInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.dark.textMuted}
                  keyboardType="decimal-pad"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  testID="withdraw-amount"
                />
                <TouchableOpacity
                  style={st.maxBtn}
                  onPress={() => setWithdrawAmount(withdrawProject.earnings.toString())}
                >
                  <Text style={st.maxBtnText}>MAX</Text>
                </TouchableOpacity>
              </View>
              {parseFloat(withdrawAmount) > withdrawProject.earnings && (
                <View style={st.errorRow}>
                  <AlertCircle size={13} color={Colors.dark.error} />
                  <Text style={st.errorText}>Exceeds available balance</Text>
                </View>
              )}

              <Text style={st.withdrawLabel}>To Address</Text>
              <TextInput
                style={st.withdrawAddrInput}
                placeholder="0x... wallet address"
                placeholderTextColor={Colors.dark.textMuted}
                value={withdrawAddress}
                onChangeText={setWithdrawAddress}
                autoCapitalize="none"
                autoCorrect={false}
                testID="withdraw-address"
              />
              {wallet && (
                <Text style={st.withdrawAddrHint}>
                  Default: {shortenAddress(wallet.address)}
                </Text>
              )}

              {parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= withdrawProject.earnings && (
                <View style={st.withdrawPreview}>
                  <View style={st.withdrawPreviewRow}>
                    <Text style={st.withdrawPreviewLabel}>Amount</Text>
                    <Text style={st.withdrawPreviewValue}>{parseFloat(withdrawAmount).toLocaleString()} {withdrawProject.currency}</Text>
                  </View>
                  <View style={st.withdrawPreviewDivider} />
                  <View style={st.withdrawPreviewRow}>
                    <Text style={st.withdrawPreviewLabel}>Est. Gas</Text>
                    <Text style={st.withdrawPreviewValue}>~$0.50</Text>
                  </View>
                  <View style={st.withdrawPreviewDivider} />
                  <View style={st.withdrawPreviewRow}>
                    <Text style={st.withdrawPreviewLabel}>You Receive</Text>
                    <Text style={[st.withdrawPreviewValue, { color: Colors.dark.accent, fontWeight: "700" as const }]}>
                      {parseFloat(withdrawAmount).toLocaleString()} {withdrawProject.currency}
                    </Text>
                  </View>
                </View>
              )}

              <View style={st.warningCard}>
                <AlertCircle size={16} color={Colors.dark.warning} />
                <Text style={st.warningText}>Withdrawals are processed on-chain and may take a few minutes to confirm.</Text>
              </View>

              <TouchableOpacity
                style={[
                  st.withdrawBtn,
                  (withdraw.isPending || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > withdrawProject.earnings) && st.withdrawBtnDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handleWithdraw}
                disabled={withdraw.isPending || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > withdrawProject.earnings}
                testID="confirm-withdraw-btn"
              >
                {withdraw.isPending ? (
                  <View style={st.sendingRow}><ActivityIndicator size="small" color="#fff" /><Text style={st.withdrawBtnText}>Processing...</Text></View>
                ) : (
                  <View style={st.sendingRow}><ArrowUpRight size={18} color="#fff" /><Text style={st.withdrawBtnText}>Withdraw Funds</Text></View>
                )}
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.dark.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" as const, color: Colors.dark.text },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  balanceCard: { backgroundColor: Colors.dark.surface, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 20 },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  balanceIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center" },
  balanceBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.dark.accentMuted, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  balanceBadgeText: { fontSize: 12, color: Colors.dark.accent, fontWeight: "600" as const },
  balanceLabel: { fontSize: 13, color: Colors.dark.textMuted, marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -1 },
  balanceStats: { flexDirection: "row", marginTop: 18, backgroundColor: Colors.dark.surfaceLight, borderRadius: 14, padding: 14 },
  balanceStat: { flex: 1, alignItems: "center" },
  balanceStatLabel: { fontSize: 11, color: Colors.dark.textMuted, marginBottom: 3 },
  balanceStatValue: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text },
  balanceStatDiv: { width: 1, backgroundColor: Colors.dark.border },
  quickActions: { flexDirection: "row", gap: 12, marginBottom: 24 },
  quickAction: { flex: 1, alignItems: "center", backgroundColor: Colors.dark.surface, borderRadius: 16, paddingVertical: 18, borderWidth: 1, borderColor: Colors.dark.border, gap: 8 },
  quickActionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center" },
  quickActionText: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.text },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, color: Colors.dark.text, marginBottom: 14 },
  fundCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 12 },
  fundCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  fundCardIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.dark.surfaceLight, alignItems: "center", justifyContent: "center" },
  fundCardIconText: { fontSize: 18, fontWeight: "700" as const, color: Colors.dark.textSecondary },
  fundCardInfo: { flex: 1 },
  fundCardName: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text },
  fundCardMeta: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  fundCardStats: { flexDirection: "row", marginBottom: 12 },
  fundStatItem: { flex: 1 },
  fundStatLabel: { fontSize: 11, color: Colors.dark.textMuted, marginBottom: 2 },
  fundStatValue: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text },
  fundProgressWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  fundProgressBar: { flex: 1, height: 5, backgroundColor: Colors.dark.surfaceLight, borderRadius: 3, overflow: "hidden" },
  fundProgressFill: { height: "100%", backgroundColor: Colors.dark.accent, borderRadius: 3 },
  fundProgressText: { fontSize: 12, fontWeight: "700" as const, color: Colors.dark.accent },
  withdrawCardBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.dark.accent, borderRadius: 12, paddingVertical: 10 },
  withdrawCardBtnText: { fontSize: 14, fontWeight: "700" as const, color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "600" as const, color: Colors.dark.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.dark.textMuted, textAlign: "center" as const },
  emptyBtn: { backgroundColor: Colors.dark.accent, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 12 },
  emptyBtnText: { fontSize: 15, fontWeight: "700" as const, color: "#fff" },
  txCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  txIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text, marginBottom: 2 },
  txMeta: { fontSize: 12, color: Colors.dark.textMuted },
  txRight: { alignItems: "flex-end", marginLeft: 8 },
  txAmount: { fontSize: 14, fontWeight: "700" as const, marginBottom: 2 },
  txStatusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  txStatusDot: { width: 6, height: 6, borderRadius: 3 },
  txStatusText: { fontSize: 11, fontWeight: "500" as const, textTransform: "capitalize" as const },
  withdrawHeader: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 24 },
  withdrawProjectRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  withdrawProjectIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.dark.surfaceLight, alignItems: "center", justifyContent: "center" },
  withdrawProjectIconText: { fontSize: 20, fontWeight: "700" as const, color: Colors.dark.textSecondary },
  withdrawProjectInfo: { flex: 1 },
  withdrawProjectName: { fontSize: 16, fontWeight: "700" as const, color: Colors.dark.text, marginBottom: 4 },
  withdrawProjectBal: { fontSize: 14, color: Colors.dark.accent, fontWeight: "600" as const },
  withdrawLabel: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.textMuted, marginBottom: 10 },
  withdrawInputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  withdrawInput: { flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, fontWeight: "700" as const, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
  maxBtn: { backgroundColor: Colors.dark.accentMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  maxBtnText: { fontSize: 12, fontWeight: "700" as const, color: Colors.dark.accent, letterSpacing: 0.5 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, marginBottom: 10 },
  errorText: { fontSize: 13, color: Colors.dark.error, fontWeight: "500" as const },
  withdrawAddrInput: { backgroundColor: Colors.dark.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border, fontFamily: "monospace", marginBottom: 6 },
  withdrawAddrHint: { fontSize: 12, color: Colors.dark.textMuted, marginBottom: 20 },
  withdrawPreview: { backgroundColor: Colors.dark.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden", marginBottom: 16 },
  withdrawPreviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14 },
  withdrawPreviewLabel: { fontSize: 14, color: Colors.dark.textMuted },
  withdrawPreviewValue: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  withdrawPreviewDivider: { height: 1, backgroundColor: Colors.dark.border },
  warningCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: Colors.dark.warningMuted, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.dark.warning + "30" },
  warningText: { flex: 1, fontSize: 13, color: Colors.dark.warning, lineHeight: 19 },
  withdrawBtn: { backgroundColor: Colors.dark.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" as const },
  withdrawBtnDisabled: { backgroundColor: Colors.dark.surfaceLight },
  withdrawBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  sendingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
