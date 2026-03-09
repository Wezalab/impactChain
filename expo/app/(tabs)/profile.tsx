import { Wallet, Shield, Bell, ExternalLink, ChevronRight, Copy, TrendingUp, TrendingDown, LogOut, Send, ArrowDownLeft, PiggyBank, Plus } from "lucide-react-native";
import React, { useCallback, useRef, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert, Animated, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { walletBalances } from "@/mocks/metrics";
import { useAuth, shortenAddress } from "@/providers/AuthProvider";

import { useProjects } from "@/providers/ProjectsProvider";

const MENU = [
  { id: "wallet", label: "Connected Wallets", sub: "Manage connections", icon: Wallet },
  { id: "security", label: "Security & Privacy", sub: "2FA, biometrics", icon: Shield },
  { id: "notifications", label: "Notifications", sub: "Alert preferences", icon: Bell },
  { id: "explorer", label: "Block Explorer", sub: "View on-chain data", icon: ExternalLink },
];

export default function ImpactChainProfile() {
  const { wallet, disconnect } = useAuth();
  const { userProjects, totalEarnings } = useProjects();
  const publishedCount = userProjects.filter((p) => p.published).length;
  const fade = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start(); }, []);
  const total = walletBalances.reduce((s, b) => s + b.usdValue, 0);
  const copyAddr = useCallback(() => { if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert("Copied", "Address copied"); }, []);

  const handleDisconnect = useCallback(() => {
    Alert.alert("Disconnect Wallet", "Are you sure you want to disconnect your wallet?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          await disconnect();
          router.replace("/login");
        },
      },
    ]);
  }, [disconnect]);

  const networkColors: Record<string, string> = {
    ethereum: "#627EEA",
    starknet: "#E6A946",
    polygon: "#8247E5",
    celo: "#FCFF52",
  };

  return (
    <Animated.ScrollView style={[st.container, { opacity: fade }]} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.profileCard}>
        <View style={st.avatarRow}>
          <View style={st.avatar}><Text style={st.avatarText}>{wallet?.displayName?.charAt(0) ?? "W"}</Text></View>
          <View style={st.profileInfo}>
            <Text style={st.profileName}>{wallet?.displayName ?? "Wallet"}</Text>
            <TouchableOpacity style={st.addressBtn} onPress={copyAddr}><Text style={st.addressText}>{wallet ? shortenAddress(wallet.address) : "Not connected"}</Text><Copy size={12} color={Colors.dark.textMuted} /></TouchableOpacity>
            {wallet && (
              <View style={st.walletBadgeRow}>
                <View style={[st.walletNetworkBadge, { backgroundColor: (networkColors[wallet.network] ?? Colors.dark.accent) + "20" }]}>
                  <View style={[st.walletNetworkDot, { backgroundColor: networkColors[wallet.network] ?? Colors.dark.accent }]} />
                  <Text style={[st.walletNetworkText, { color: networkColors[wallet.network] ?? Colors.dark.accent }]}>{wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <View style={st.profileStats}>
          <View style={st.profileStat}><Text style={st.profileStatValue}>5</Text><Text style={st.profileStatLabel}>Projects</Text></View>
          <View style={st.profileStatDiv} />
          <View style={st.profileStat}><Text style={st.profileStatValue}>28.4K</Text><Text style={st.profileStatLabel}>Beneficiaries</Text></View>
          <View style={st.profileStatDiv} />
          <View style={st.profileStat}><Text style={st.profileStatValue}>836</Text><Text style={st.profileStatLabel}>Verifications</Text></View>
        </View>
      </View>
      <Text style={st.sectionTitle}>Quick Actions</Text>
      <View style={st.actionsRow}>
        <TouchableOpacity style={st.actionCard} activeOpacity={0.8} onPress={() => router.push("/create-project")} testID="create-project-btn">
          <View style={st.actionIconWrap}><Plus size={20} color={Colors.dark.accent} /></View>
          <Text style={st.actionLabel}>Create{"\n"}Project</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.actionCard} activeOpacity={0.8} onPress={() => router.push("/receive")} testID="receive-btn">
          <View style={[st.actionIconWrap, { backgroundColor: Colors.dark.infoMuted }]}><ArrowDownLeft size={20} color={Colors.dark.info} /></View>
          <Text style={st.actionLabel}>Receive{"\n"}Funds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.actionCard} activeOpacity={0.8} onPress={() => router.push("/manage-funds")} testID="manage-funds-btn">
          <View style={[st.actionIconWrap, { backgroundColor: Colors.dark.warningMuted }]}><PiggyBank size={20} color={Colors.dark.warning} /></View>
          <Text style={st.actionLabel}>Manage{"\n"}Funds</Text>
        </TouchableOpacity>
      </View>

      {publishedCount > 0 && (
        <TouchableOpacity style={st.earningsCard} activeOpacity={0.8} onPress={() => router.push("/manage-funds")} testID="earnings-card">
          <View style={st.earningsLeft}>
            <Text style={st.earningsLabel}>Project Earnings</Text>
            <Text style={st.earningsValue}>${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
            <Text style={st.earningsSub}>{publishedCount} published project{publishedCount !== 1 ? "s" : ""}</Text>
          </View>
          <ChevronRight size={18} color={Colors.dark.textMuted} />
        </TouchableOpacity>
      )}

      <Text style={st.sectionTitle}>Portfolio</Text>
      <View style={st.portfolioCard}>
        <View style={st.portfolioHeader}>
          <View style={st.portfolioHeaderRow}>
            <View><Text style={st.portfolioLabel}>Total Balance</Text><Text style={st.portfolioTotal}>${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
            <TouchableOpacity style={st.sendBtn} activeOpacity={0.8} onPress={() => router.push("/send")} testID="send-btn"><Send size={16} color="#fff" /><Text style={st.sendBtnText}>Send</Text></TouchableOpacity>
          </View>
        </View>
        {walletBalances.map((b) => (
          <View key={b.symbol} style={st.balanceRow}>
            <View style={st.balanceLeft}><View style={st.tokenIcon}><Text style={st.tokenIconText}>{b.symbol.charAt(0)}</Text></View><View><Text style={st.tokenName}>{b.currency}</Text><Text style={st.tokenNetwork}>{b.network}</Text></View></View>
            <View style={st.balanceRight}>
              <Text style={st.tokenBalance}>{b.balance.toLocaleString()} {b.symbol}</Text>
              <View style={st.changeRow}>{b.change24h >= 0 ? <TrendingUp size={10} color={Colors.dark.accent} /> : <TrendingDown size={10} color={Colors.dark.error} />}<Text style={[st.changeText, b.change24h >= 0 ? { color: Colors.dark.accent } : { color: Colors.dark.error }]}>{b.change24h >= 0 ? "+" : ""}{b.change24h}%</Text></View>
            </View>
          </View>
        ))}
      </View>
      <Text style={st.sectionTitle}>Settings</Text>
      <View style={st.menuCard}>
        {MENU.map((item, idx) => { const IC = item.icon; return (
          <TouchableOpacity key={item.id} style={[st.menuRow, idx < MENU.length - 1 && st.menuRowBorder]} activeOpacity={0.7} onPress={() => console.log(item.id)}>
            <View style={st.menuIconWrap}><IC size={18} color={Colors.dark.accent} /></View>
            <View style={st.menuTextWrap}><Text style={st.menuLabel}>{item.label}</Text><Text style={st.menuSub}>{item.sub}</Text></View>
            <ChevronRight size={16} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        ); })}
      </View>
      <TouchableOpacity style={st.disconnectBtn} activeOpacity={0.7} onPress={handleDisconnect} testID="disconnect-btn">
        <LogOut size={18} color={Colors.dark.error} />
        <Text style={st.disconnectText}>Disconnect Wallet</Text>
      </TouchableOpacity>
      <View style={st.footer}><Text style={st.footerText}>ImpactChain v1.0.0</Text><Text style={st.footerSub}>Built by Weza lab </Text></View>
    </Animated.ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { paddingBottom: 40 },
  profileCard: { marginHorizontal: 20, marginTop: 8, backgroundColor: Colors.dark.surface, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: Colors.dark.border },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800" as const, color: Colors.dark.accent },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700" as const, color: Colors.dark.text, marginBottom: 4 },
  addressBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  addressText: { fontSize: 13, color: Colors.dark.textMuted, fontFamily: "monospace" },
  profileStats: { flexDirection: "row", backgroundColor: Colors.dark.surfaceLight, borderRadius: 14, padding: 14 },
  profileStat: { flex: 1, alignItems: "center" },
  profileStatValue: { fontSize: 18, fontWeight: "700" as const, color: Colors.dark.text },
  profileStatLabel: { fontSize: 11, color: Colors.dark.textMuted, marginTop: 2 },
  profileStatDiv: { width: 1, backgroundColor: Colors.dark.border },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, color: Colors.dark.text, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  portfolioCard: { marginHorizontal: 20, backgroundColor: Colors.dark.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden" },
  portfolioHeader: { padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  portfolioHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  portfolioLabel: { fontSize: 12, color: Colors.dark.textMuted, marginBottom: 4 },
  portfolioTotal: { fontSize: 26, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -0.5 },
  sendBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.dark.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  sendBtnText: { fontSize: 14, fontWeight: "700" as const, color: "#fff" },
  balanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  balanceLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  tokenIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.dark.surfaceLight, alignItems: "center", justifyContent: "center" },
  tokenIconText: { fontSize: 14, fontWeight: "700" as const, color: Colors.dark.textSecondary },
  tokenName: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  tokenNetwork: { fontSize: 11, color: Colors.dark.textMuted, marginTop: 1 },
  balanceRight: { alignItems: "flex-end" },
  tokenBalance: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  changeText: { fontSize: 11, fontWeight: "500" as const },
  menuCard: { marginHorizontal: 20, backgroundColor: Colors.dark.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden" },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  menuIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center", marginRight: 14 },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600" as const, color: Colors.dark.text },
  menuSub: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 1 },
  walletBadgeRow: { flexDirection: "row", marginTop: 6 },
  walletNetworkBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  walletNetworkDot: { width: 6, height: 6, borderRadius: 3 },
  walletNetworkText: { fontSize: 11, fontWeight: "600" as const },
  disconnectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 24, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.dark.errorMuted, borderWidth: 1, borderColor: Colors.dark.error + "30" },
  disconnectText: { fontSize: 15, fontWeight: "600" as const, color: Colors.dark.error },
  actionsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 4 },
  actionCard: { flex: 1, alignItems: "center", backgroundColor: Colors.dark.surface, borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: Colors.dark.border, gap: 8 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "600" as const, color: Colors.dark.textSecondary, textAlign: "center" as const, lineHeight: 16 },
  earningsCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 12, backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.accent + "30" },
  earningsLeft: { flex: 1 },
  earningsLabel: { fontSize: 12, color: Colors.dark.textMuted, marginBottom: 4 },
  earningsValue: { fontSize: 22, fontWeight: "800" as const, color: Colors.dark.accent, letterSpacing: -0.5 },
  earningsSub: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  footer: { alignItems: "center", marginTop: 24, paddingBottom: 20 },
  footerText: { fontSize: 13, color: Colors.dark.textMuted, fontWeight: "500" as const },
  footerSub: { fontSize: 11, color: Colors.dark.textMuted, marginTop: 2 },
});
