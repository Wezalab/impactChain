import { router } from "expo-router";
import { ArrowLeft, Copy, QrCode, Share2, Check, ChevronDown, ArrowDownLeft } from "lucide-react-native";
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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth, shortenAddress } from "@/providers/AuthProvider";
import { useProjects, type UserProject } from "@/providers/ProjectsProvider";

const { width: SW } = Dimensions.get("window");

export default function ReceivePaymentScreen() {
  const insets = useSafeAreaInsets();
  const { wallet } = useAuth();
  const { userProjects } = useProjects();

  const [selectedProject, setSelectedProject] = useState<UserProject | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [copied, setCopied] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const publishedProjects = useMemo(
    () => userProjects.filter((p) => p.published),
    [userProjects]
  );

  const receiveAddress = useMemo(() => {
    if (selectedProject) return `0x${selectedProject.id.replace("proj-user-", "").slice(0, 8)}...contract`;
    return wallet?.address ?? "0x0000...0000";
  }, [selectedProject, wallet]);

  const handleCopy = useCallback(() => {
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    Alert.alert("Copied!", "Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShare = useCallback(() => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const addr = receiveAddress;
    const amount = requestAmount ? ` for ${requestAmount}` : "";
    const project = selectedProject ? ` (${selectedProject.name})` : "";
    Alert.alert("Share", `Send funds to ${addr}${amount}${project}`);
  }, [receiveAddress, requestAmount, selectedProject]);

  const handleSimulateDonation = useCallback(() => {
    if (!selectedProject || !requestAmount) return;
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Donation Request",
      `A request for ${requestAmount} ${selectedProject.currency} has been generated for "${selectedProject.name}". Share the payment link with donors.`,
      [{ text: "OK" }]
    );
  }, [selectedProject, requestAmount]);

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()} testID="back-btn">
          <ArrowLeft size={22} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Receive Funds</Text>
        <View style={st.headerRight} />
      </View>

      <ScrollView
        style={st.flex}
        contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
          <View style={st.qrSection}>
            <View style={st.qrPlaceholder}>
              <QrCode size={120} color={Colors.dark.accent} strokeWidth={1} />
            </View>
            <Text style={st.qrHint}>Scan to send funds</Text>
          </View>

          <View style={st.addressCard}>
            <Text style={st.addressLabel}>
              {selectedProject ? "Project Contract Address" : "Your Wallet Address"}
            </Text>
            <View style={st.addressRow}>
              <Text style={st.addressText} numberOfLines={1}>
                {receiveAddress}
              </Text>
              <TouchableOpacity style={st.copyBtn} onPress={handleCopy} testID="copy-btn">
                {copied ? <Check size={16} color={Colors.dark.accent} /> : <Copy size={16} color={Colors.dark.accent} />}
              </TouchableOpacity>
            </View>
            {wallet && (
              <Text style={st.networkLabel}>
                Network: {wallet.network.charAt(0).toUpperCase() + wallet.network.slice(1)}
              </Text>
            )}
          </View>

          {publishedProjects.length > 0 && (
            <>
              <Text style={st.sectionLabel}>Receive for Project</Text>
              <TouchableOpacity
                style={st.projectSelector}
                onPress={() => setShowProjectPicker(!showProjectPicker)}
                activeOpacity={0.7}
                testID="project-selector"
              >
                {selectedProject ? (
                  <View style={st.selectedProjectRow}>
                    <View style={st.projectIconWrap}>
                      <Text style={st.projectIconText}>{selectedProject.name.charAt(0)}</Text>
                    </View>
                    <View style={st.projectSelectInfo}>
                      <Text style={st.projectSelectName} numberOfLines={1}>{selectedProject.name}</Text>
                      <Text style={st.projectSelectMeta}>
                        ${selectedProject.raised.toLocaleString()} / ${selectedProject.goal.toLocaleString()} {selectedProject.currency}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={st.projectPlaceholder}>Select a project (optional)</Text>
                )}
                <ChevronDown size={16} color={Colors.dark.textMuted} />
              </TouchableOpacity>

              {showProjectPicker && (
                <View style={st.pickerCard}>
                  <TouchableOpacity
                    style={[st.pickerRow, !selectedProject && st.pickerRowActive]}
                    onPress={() => { setSelectedProject(null); setShowProjectPicker(false); }}
                  >
                    <Text style={st.pickerRowText}>Personal Wallet</Text>
                    {!selectedProject && <Check size={14} color={Colors.dark.accent} />}
                  </TouchableOpacity>
                  {publishedProjects.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[st.pickerRow, selectedProject?.id === p.id && st.pickerRowActive]}
                      onPress={() => { setSelectedProject(p); setShowProjectPicker(false); if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <View style={st.pickerProjectInfo}>
                        <Text style={st.pickerProjectName} numberOfLines={1}>{p.name}</Text>
                        <Text style={st.pickerProjectMeta}>${p.raised.toLocaleString()} raised</Text>
                      </View>
                      {selectedProject?.id === p.id && <Check size={14} color={Colors.dark.accent} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={st.sectionLabel}>Request Amount (Optional)</Text>
          <View style={st.amountInputRow}>
            <TextInput
              style={st.amountInput}
              placeholder="0.00"
              placeholderTextColor={Colors.dark.textMuted}
              keyboardType="decimal-pad"
              value={requestAmount}
              onChangeText={setRequestAmount}
              testID="amount-input"
            />
            <View style={st.currencyTag}>
              <Text style={st.currencyTagText}>{selectedProject?.currency ?? "USDC"}</Text>
            </View>
          </View>

          <View style={st.actionsRow}>
            <TouchableOpacity style={st.actionBtn} activeOpacity={0.8} onPress={handleShare} testID="share-btn">
              <Share2 size={18} color="#fff" />
              <Text style={st.actionBtnText}>Share Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtnSecondary} activeOpacity={0.8} onPress={handleCopy} testID="copy-address-btn">
              <Copy size={18} color={Colors.dark.accent} />
              <Text style={st.actionBtnSecondaryText}>Copy Address</Text>
            </TouchableOpacity>
          </View>

          {selectedProject && requestAmount && parseFloat(requestAmount) > 0 && (
            <TouchableOpacity style={st.generateBtn} activeOpacity={0.8} onPress={handleSimulateDonation} testID="generate-btn">
              <ArrowDownLeft size={18} color="#fff" />
              <Text style={st.generateBtnText}>Generate Payment Request</Text>
            </TouchableOpacity>
          )}

          <View style={st.infoCard}>
            <Text style={st.infoTitle}>How Receiving Works</Text>
            <View style={st.infoRow}>
              <View style={st.infoDot} />
              <Text style={st.infoText}>Share your address or QR code with the sender</Text>
            </View>
            <View style={st.infoRow}>
              <View style={st.infoDot} />
              <Text style={st.infoText}>Funds arrive directly to your wallet or project contract</Text>
            </View>
            <View style={st.infoRow}>
              <View style={st.infoDot} />
              <Text style={st.infoText}>All transactions are recorded on-chain for transparency</Text>
            </View>
            <View style={st.infoRow}>
              <View style={st.infoDot} />
              <Text style={st.infoText}>Withdraw project funds anytime from Manage Funds</Text>
            </View>
          </View>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  qrSection: { alignItems: "center", marginBottom: 24 },
  qrPlaceholder: { width: 200, height: 200, backgroundColor: Colors.dark.surface, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.dark.border },
  qrHint: { fontSize: 13, color: Colors.dark.textMuted, marginTop: 12 },
  addressCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 24 },
  addressLabel: { fontSize: 12, color: Colors.dark.textMuted, fontWeight: "500" as const, marginBottom: 10 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addressText: { flex: 1, fontSize: 14, color: Colors.dark.text, fontFamily: "monospace", fontWeight: "600" as const },
  copyBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.dark.accentMuted, alignItems: "center", justifyContent: "center" },
  networkLabel: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.textMuted, marginBottom: 10 },
  projectSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 20 },
  selectedProjectRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  projectIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.dark.surfaceLight, alignItems: "center", justifyContent: "center" },
  projectIconText: { fontSize: 16, fontWeight: "700" as const, color: Colors.dark.textSecondary },
  projectSelectInfo: { flex: 1 },
  projectSelectName: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  projectSelectMeta: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  projectPlaceholder: { fontSize: 14, color: Colors.dark.textMuted },
  pickerCard: { backgroundColor: Colors.dark.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden", marginBottom: 20, marginTop: -12 },
  pickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  pickerRowActive: { backgroundColor: Colors.dark.accentMuted },
  pickerRowText: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  pickerProjectInfo: { flex: 1 },
  pickerProjectName: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  pickerProjectMeta: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 1 },
  amountInputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  amountInput: { flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, fontWeight: "700" as const, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
  currencyTag: { backgroundColor: Colors.dark.surface, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border },
  currencyTagText: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.dark.accent, borderRadius: 14, paddingVertical: 14 },
  actionBtnText: { fontSize: 15, fontWeight: "700" as const, color: "#fff" },
  actionBtnSecondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: Colors.dark.accent, backgroundColor: Colors.dark.accentMuted },
  actionBtnSecondaryText: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.accent },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.dark.info, borderRadius: 14, paddingVertical: 14, marginBottom: 24 },
  generateBtnText: { fontSize: 15, fontWeight: "700" as const, color: "#fff" },
  infoCard: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border },
  infoTitle: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text, marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  infoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.dark.accent, marginTop: 6 },
  infoText: { flex: 1, fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 19 },
});
