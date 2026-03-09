import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronDown, Scan, Send, AlertCircle, Check, Wallet, ArrowUpRight } from "lucide-react-native";
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
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useAuth, shortenAddress } from "@/providers/AuthProvider";
import { walletBalances, type WalletBalance } from "@/mocks/metrics";
import { projects } from "@/mocks/projects";

const { width: SW } = Dimensions.get("window");

const QUICK_AMOUNTS = [10, 50, 100, 500];

type Step = "input" | "review" | "success";

interface Recipient {
  label: string;
  address: string;
  isProject: boolean;
}

const SUGGESTED_RECIPIENTS: Recipient[] = projects
  .filter((p) => p.status === "active")
  .slice(0, 4)
  .map((p) => ({
    label: p.name,
    address: `0x${p.id.replace("proj-", "")}...${p.team.slice(0, 4).toLowerCase()}`,
    isProject: true,
  }));

export default function SendPaymentScreen() {
  const insets = useSafeAreaInsets();
  const { wallet } = useAuth();
  const params = useLocalSearchParams<{ projectId?: string; projectName?: string; projectAddress?: string }>();

  const [step, setStep] = useState<Step>("input");
  const [amount, setAmount] = useState<string>("");
  const [recipientAddr, setRecipientAddr] = useState<string>(params.projectAddress ?? "");
  const [recipientLabel, setRecipientLabel] = useState<string>(params.projectName ?? "");
  const [selectedToken, setSelectedToken] = useState<WalletBalance>(walletBalances[1]);
  const [showTokenPicker, setShowTokenPicker] = useState<boolean>(false);
  const [memo, setMemo] = useState<string>(params.projectName ? `Donation to ${params.projectName}` : "");
  const isProjectFunding = !!params.projectId;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const parsedAmount = useMemo(() => parseFloat(amount) || 0, [amount]);
  const hasEnoughBalance = useMemo(() => parsedAmount <= selectedToken.balance, [parsedAmount, selectedToken]);
  const isValidRecipient = useMemo(() => recipientAddr.startsWith("0x") && recipientAddr.length >= 6, [recipientAddr]);
  const canProceed = useMemo(() => parsedAmount > 0 && hasEnoughBalance && isValidRecipient, [parsedAmount, hasEnoughBalance, isValidRecipient]);

  const estimatedGas = useMemo(() => {
    if (selectedToken.network === "Ethereum") return "~$2.40";
    if (selectedToken.network === "Polygon") return "~$0.01";
    if (selectedToken.network === "Celo") return "~$0.005";
    return "~$0.50";
  }, [selectedToken]);

  const usdValue = useMemo(() => {
    const rate = selectedToken.usdValue / selectedToken.balance;
    return (parsedAmount * rate).toFixed(2);
  }, [parsedAmount, selectedToken]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      console.log("[Send] Processing payment:", {
        amount: parsedAmount,
        token: selectedToken.symbol,
        to: recipientAddr,
        memo,
      });
      await new Promise((r) => setTimeout(r, 2500));
      return { txHash: `0x${Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")}` };
    },
    onSuccess: (data) => {
      console.log("[Send] Payment successful:", data.txHash);
      setStep("success");
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(successFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => {
      console.log("[Send] Payment failed:", err);
      Alert.alert("Transaction Failed", "Please try again or check your wallet connection.");
    },
  });

  const handleQuickAmount = useCallback((val: number) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(val.toString());
  }, []);

  const handleSelectRecipient = useCallback((r: Recipient) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecipientAddr(r.address);
    setRecipientLabel(r.label);
  }, []);

  const handleReview = useCallback(() => {
    if (!canProceed) return;
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("review");
  }, [canProceed]);

  const handleConfirm = useCallback(() => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    sendMutation.mutate();
  }, [sendMutation]);

  const handleBack = useCallback(() => {
    if (step === "review") {
      setStep("input");
    } else {
      router.back();
    }
  }, [step]);

  if (step === "success") {
    return (
      <View style={[st.container, { paddingTop: insets.top }]}>
        <View style={st.successContainer}>
          <Animated.View style={[st.successContent, { opacity: successFade, transform: [{ scale: successScale }] }]}>
            <View style={st.successCheckWrap}>
              <View style={st.successCheckInner}>
                <Check size={36} color="#fff" strokeWidth={3} />
              </View>
              <View style={st.successPulse} />
            </View>
            <Text style={st.successTitle}>Payment Sent</Text>
            <Text style={st.successAmount}>{parsedAmount.toLocaleString()} {selectedToken.symbol}</Text>
            <Text style={st.successUsd}>≈ ${usdValue}</Text>
            <View style={st.successDetailCard}>
              <View style={st.successRow}>
                <Text style={st.successLabel}>To</Text>
                <Text style={st.successValue} numberOfLines={1}>{recipientLabel || recipientAddr}</Text>
              </View>
              <View style={st.successDivider} />
              <View style={st.successRow}>
                <Text style={st.successLabel}>Network</Text>
                <Text style={st.successValue}>{selectedToken.network}</Text>
              </View>
              <View style={st.successDivider} />
              <View style={st.successRow}>
                <Text style={st.successLabel}>Status</Text>
                <View style={st.successStatusRow}>
                  <View style={st.successStatusDot} />
                  <Text style={st.successStatusText}>Broadcasting</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={st.successBtn} activeOpacity={0.8} onPress={() => router.back()} testID="done-btn">
              <Text style={st.successBtnText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.viewTxBtn} activeOpacity={0.7} onPress={() => { router.back(); router.push("/(tabs)/transactions"); }}>
              <Text style={st.viewTxText}>View in Activity</Text>
              <ArrowUpRight size={14} color={Colors.dark.accent} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={handleBack} testID="back-btn">
          <ArrowLeft size={22} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{step === "review" ? "Review Payment" : isProjectFunding ? "Fund Project" : "Send Payment"}</Text>
        <View style={st.headerRight} />
      </View>

      <KeyboardAvoidingView style={st.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={st.flex}
          contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === "input" && (
            <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
              <View style={st.amountSection}>
                <Text style={st.amountLabel}>Amount</Text>
                <View style={st.amountInputRow}>
                  <TextInput
                    style={st.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.dark.textMuted}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    testID="amount-input"
                  />
                  <TouchableOpacity
                    style={st.tokenSelector}
                    onPress={() => setShowTokenPicker(!showTokenPicker)}
                    activeOpacity={0.7}
                    testID="token-selector"
                  >
                    <View style={st.tokenSelectorIcon}>
                      <Text style={st.tokenSelectorLetter}>{selectedToken.symbol.charAt(0)}</Text>
                    </View>
                    <Text style={st.tokenSelectorText}>{selectedToken.symbol}</Text>
                    <ChevronDown size={14} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                </View>
                {parsedAmount > 0 && (
                  <Text style={st.usdEstimate}>≈ ${usdValue} USD</Text>
                )}
                {parsedAmount > 0 && !hasEnoughBalance && (
                  <View style={st.errorRow}>
                    <AlertCircle size={13} color={Colors.dark.error} />
                    <Text style={st.errorText}>Insufficient {selectedToken.symbol} balance</Text>
                  </View>
                )}
                <View style={st.balanceRow}>
                  <Text style={st.balanceLabel}>Available:</Text>
                  <Text style={st.balanceValue}>{selectedToken.balance.toLocaleString()} {selectedToken.symbol}</Text>
                  <TouchableOpacity onPress={() => setAmount(selectedToken.balance.toString())} activeOpacity={0.7}>
                    <Text style={st.maxBtn}>MAX</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showTokenPicker && (
                <View style={st.tokenPickerCard}>
                  {walletBalances.map((token) => (
                    <TouchableOpacity
                      key={token.symbol}
                      style={[st.tokenPickerRow, selectedToken.symbol === token.symbol && st.tokenPickerRowActive]}
                      onPress={() => { setSelectedToken(token); setShowTokenPicker(false); if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      activeOpacity={0.7}
                    >
                      <View style={st.tokenPickerIcon}>
                        <Text style={st.tokenPickerLetter}>{token.symbol.charAt(0)}</Text>
                      </View>
                      <View style={st.tokenPickerInfo}>
                        <Text style={st.tokenPickerName}>{token.currency}</Text>
                        <Text style={st.tokenPickerBal}>{token.balance.toLocaleString()} {token.symbol}</Text>
                      </View>
                      <Text style={st.tokenPickerNetwork}>{token.network}</Text>
                      {selectedToken.symbol === token.symbol && <Check size={16} color={Colors.dark.accent} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={st.quickAmountRow}>
                {QUICK_AMOUNTS.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[st.quickAmountChip, parsedAmount === val && st.quickAmountChipActive]}
                    onPress={() => handleQuickAmount(val)}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.quickAmountText, parsedAmount === val && st.quickAmountTextActive]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={st.recipientSection}>
                <Text style={st.sectionLabel}>Recipient</Text>
                <View style={st.recipientInputRow}>
                  <TextInput
                    style={st.recipientInput}
                    placeholder="0x... wallet address"
                    placeholderTextColor={Colors.dark.textMuted}
                    value={recipientAddr}
                    onChangeText={(t) => { setRecipientAddr(t); setRecipientLabel(""); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="recipient-input"
                  />
                  <TouchableOpacity style={st.scanBtn} activeOpacity={0.7} onPress={() => Alert.alert("QR Scanner", "Camera scanner would open here")}>
                    <Scan size={18} color={Colors.dark.accent} />
                  </TouchableOpacity>
                </View>
                {recipientLabel !== "" && (
                  <View style={st.recipientLabelRow}>
                    <Check size={12} color={Colors.dark.accent} />
                    <Text style={st.recipientLabelText}>{recipientLabel}</Text>
                  </View>
                )}
              </View>

              <View style={st.suggestedSection}>
                <Text style={st.suggestedTitle}>Donate to a Project</Text>
                {SUGGESTED_RECIPIENTS.map((r) => (
                  <TouchableOpacity
                    key={r.address}
                    style={[st.suggestedRow, recipientAddr === r.address && st.suggestedRowActive]}
                    onPress={() => handleSelectRecipient(r)}
                    activeOpacity={0.7}
                  >
                    <View style={st.suggestedIconWrap}>
                      <Text style={st.suggestedIconText}>{r.label.charAt(0)}</Text>
                    </View>
                    <View style={st.suggestedInfo}>
                      <Text style={st.suggestedName} numberOfLines={1}>{r.label}</Text>
                      <Text style={st.suggestedAddr}>{r.address}</Text>
                    </View>
                    {recipientAddr === r.address && <Check size={16} color={Colors.dark.accent} />}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={st.memoSection}>
                <Text style={st.sectionLabel}>Memo (optional)</Text>
                <TextInput
                  style={st.memoInput}
                  placeholder="What's this payment for?"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={memo}
                  onChangeText={setMemo}
                  multiline
                  maxLength={140}
                  testID="memo-input"
                />
              </View>
            </Animated.View>
          )}

          {step === "review" && (
            <Animated.View style={{ opacity: fadeIn }}>
              <View style={st.reviewCard}>
                <View style={st.reviewAmountSection}>
                  <Text style={st.reviewAmountLabel}>Sending</Text>
                  <Text style={st.reviewAmountValue}>{parsedAmount.toLocaleString()} {selectedToken.symbol}</Text>
                  <Text style={st.reviewUsd}>≈ ${usdValue} USD</Text>
                </View>

                <View style={st.reviewDivider} />

                <View style={st.reviewRow}>
                  <Text style={st.reviewLabel}>From</Text>
                  <View style={st.reviewValueRow}>
                    <Wallet size={14} color={Colors.dark.textSecondary} />
                    <Text style={st.reviewValue}>{wallet ? shortenAddress(wallet.address) : "..."}</Text>
                  </View>
                </View>
                <View style={st.reviewRow}>
                  <Text style={st.reviewLabel}>To</Text>
                  <Text style={st.reviewValue} numberOfLines={1}>{recipientLabel || recipientAddr}</Text>
                </View>
                <View style={st.reviewRow}>
                  <Text style={st.reviewLabel}>Network</Text>
                  <Text style={st.reviewValue}>{selectedToken.network}</Text>
                </View>
                <View style={st.reviewRow}>
                  <Text style={st.reviewLabel}>Est. Gas Fee</Text>
                  <Text style={st.reviewValue}>{estimatedGas}</Text>
                </View>
                {memo.length > 0 && (
                  <View style={st.reviewRow}>
                    <Text style={st.reviewLabel}>Memo</Text>
                    <Text style={st.reviewValue} numberOfLines={2}>{memo}</Text>
                  </View>
                )}
              </View>

              <View style={st.warningCard}>
                <AlertCircle size={16} color={Colors.dark.warning} />
                <Text style={st.warningText}>Please verify all details before confirming. Blockchain transactions are irreversible.</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View style={[st.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {step === "input" && (
            <TouchableOpacity
              style={[st.primaryBtn, !canProceed && st.primaryBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleReview}
              disabled={!canProceed}
              testID="review-btn"
            >
              <Text style={[st.primaryBtnText, !canProceed && st.primaryBtnTextDisabled]}>Review Payment</Text>
            </TouchableOpacity>
          )}
          {step === "review" && (
            <TouchableOpacity
              style={[st.confirmBtn, sendMutation.isPending && st.confirmBtnSending]}
              activeOpacity={0.8}
              onPress={handleConfirm}
              disabled={sendMutation.isPending}
              testID="confirm-btn"
            >
              {sendMutation.isPending ? (
                <View style={st.sendingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={st.confirmBtnText}>Signing Transaction...</Text>
                </View>
              ) : (
                <View style={st.sendingRow}>
                  <Send size={18} color="#fff" />
                  <Text style={st.confirmBtnText}>Confirm & Send</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.dark.text,
  },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  amountSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  amountLabel: { fontSize: 13, color: Colors.dark.textMuted, fontWeight: "600" as const, marginBottom: 12 },
  amountInputRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.dark.text,
    padding: 0,
    letterSpacing: -1,
  },
  tokenSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  tokenSelectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenSelectorLetter: { fontSize: 13, fontWeight: "700" as const, color: Colors.dark.accent },
  tokenSelectorText: { fontSize: 14, fontWeight: "700" as const, color: Colors.dark.text },
  usdEstimate: { fontSize: 14, color: Colors.dark.textSecondary, marginTop: 8 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  errorText: { fontSize: 13, color: Colors.dark.error, fontWeight: "500" as const },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.dark.border },
  balanceLabel: { fontSize: 12, color: Colors.dark.textMuted },
  balanceValue: { fontSize: 12, color: Colors.dark.textSecondary, fontWeight: "600" as const, flex: 1 },
  maxBtn: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.dark.accent,
    backgroundColor: Colors.dark.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    letterSpacing: 0.5,
  },

  tokenPickerCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  tokenPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tokenPickerRowActive: { backgroundColor: Colors.dark.accentMuted },
  tokenPickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tokenPickerLetter: { fontSize: 14, fontWeight: "700" as const, color: Colors.dark.textSecondary },
  tokenPickerInfo: { flex: 1 },
  tokenPickerName: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text },
  tokenPickerBal: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 1 },
  tokenPickerNetwork: { fontSize: 11, color: Colors.dark.textMuted, marginRight: 8 },

  quickAmountRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  quickAmountChip: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickAmountChipActive: { borderColor: Colors.dark.accent, backgroundColor: Colors.dark.accentMuted },
  quickAmountText: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.textSecondary },
  quickAmountTextActive: { color: Colors.dark.accent },

  recipientSection: { marginTop: 24 },
  sectionLabel: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.textMuted, marginBottom: 10 },
  recipientInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  recipientInput: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    fontFamily: "monospace",
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.accent + "30",
  },
  recipientLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingLeft: 4,
  },
  recipientLabelText: { fontSize: 13, color: Colors.dark.accent, fontWeight: "500" as const },

  suggestedSection: { marginTop: 24 },
  suggestedTitle: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.textMuted, marginBottom: 10 },
  suggestedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  suggestedRowActive: { borderColor: Colors.dark.accent + "60", backgroundColor: Colors.dark.accentMuted },
  suggestedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  suggestedIconText: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.textSecondary },
  suggestedInfo: { flex: 1 },
  suggestedName: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text, marginBottom: 2 },
  suggestedAddr: { fontSize: 12, color: Colors.dark.textMuted, fontFamily: "monospace" },

  memoSection: { marginTop: 24 },
  memoInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 60,
    textAlignVertical: "top" as const,
  },

  reviewCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  reviewAmountSection: { alignItems: "center" as const, paddingVertical: 28 },
  reviewAmountLabel: { fontSize: 13, color: Colors.dark.textMuted, marginBottom: 8 },
  reviewAmountValue: { fontSize: 34, fontWeight: "800" as const, color: Colors.dark.text, letterSpacing: -1 },
  reviewUsd: { fontSize: 15, color: Colors.dark.textSecondary, marginTop: 4 },
  reviewDivider: { height: 1, backgroundColor: Colors.dark.border },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  reviewLabel: { fontSize: 14, color: Colors.dark.textMuted },
  reviewValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewValue: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text, maxWidth: SW * 0.5, textAlign: "right" as const },

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.dark.warningMuted,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.dark.warning + "30",
  },
  warningText: { flex: 1, fontSize: 13, color: Colors.dark.warning, lineHeight: 19 },

  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  primaryBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center" as const,
  },
  primaryBtnDisabled: { backgroundColor: Colors.dark.surfaceLight },
  primaryBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  primaryBtnTextDisabled: { color: Colors.dark.textMuted },
  confirmBtn: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center" as const,
  },
  confirmBtnSending: { backgroundColor: Colors.dark.accentDark },
  confirmBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  sendingRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  successContainer: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 28 },
  successContent: { alignItems: "center" as const, width: "100%" as const },
  successCheckWrap: {
    width: 88,
    height: 88,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 24,
  },
  successCheckInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  successPulse: {
    position: "absolute" as const,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Colors.dark.accent + "40",
  },
  successTitle: { fontSize: 24, fontWeight: "800" as const, color: Colors.dark.text, marginBottom: 8 },
  successAmount: { fontSize: 32, fontWeight: "800" as const, color: Colors.dark.accent, letterSpacing: -1 },
  successUsd: { fontSize: 15, color: Colors.dark.textSecondary, marginTop: 4, marginBottom: 24 },
  successDetailCard: {
    width: "100%" as const,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: "hidden",
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  successLabel: { fontSize: 13, color: Colors.dark.textMuted },
  successValue: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.text, maxWidth: SW * 0.55 },
  successDivider: { height: 1, backgroundColor: Colors.dark.border },
  successStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  successStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.warning },
  successStatusText: { fontSize: 13, color: Colors.dark.warning, fontWeight: "600" as const },
  successBtn: {
    width: "100%" as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center" as const,
    marginTop: 24,
  },
  successBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  viewTxBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  viewTxText: { fontSize: 14, color: Colors.dark.accent, fontWeight: "600" as const },
});
