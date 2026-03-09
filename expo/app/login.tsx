import { router } from "expo-router";
import { Globe, Shield, ChevronRight, Zap, Link2 } from "lucide-react-native";
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth, WalletInfo } from "@/providers/AuthProvider";

const { width: SW, height: SH } = Dimensions.get("window");

interface WalletOption {
  id: WalletInfo["walletType"];
  name: string;
  network: WalletInfo["network"];
  tag: string;
  color: string;
  letter: string;
  description: string;
}

const EVM_WALLETS: WalletOption[] = [
  { id: "metamask", name: "MetaMask", network: "ethereum", tag: "EVM", color: "#F6851B", letter: "M", description: "Ethereum & EVM chains" },
  { id: "coinbase", name: "Coinbase Wallet", network: "ethereum", tag: "EVM", color: "#0052FF", letter: "C", description: "Multi-chain support" },
  { id: "walletconnect", name: "WalletConnect", network: "polygon", tag: "EVM", color: "#3B99FC", letter: "W", description: "200+ wallets supported" },
];

const STARKNET_WALLETS: WalletOption[] = [
  { id: "argent", name: "Argent", network: "starknet", tag: "StarkNet", color: "#FF875B", letter: "A", description: "Smart contract wallet" },
  { id: "braavos", name: "Braavos", network: "starknet", tag: "StarkNet", color: "#E6A946", letter: "B", description: "StarkNet native wallet" },
];

const FEATURES = [
  { icon: Shield, text: "Non-custodial — your keys, your funds" },
  { icon: Zap, text: "Gasless transactions on supported chains" },
  { icon: Link2, text: "Multi-chain: Ethereum, Polygon, Celo, StarkNet" },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { connect, isConnecting } = useAuth();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const logoScale = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(60)).current;
  const cardsFade = useRef(new Animated.Value(0)).current;
  const featuresFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(featuresFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(async (wallet: WalletOption) => {
    if (isConnecting) return;
    setConnectingId(wallet.id);
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await connect(wallet.id, wallet.network);
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e) {
      console.log("[Login] Connection failed:", e);
    } finally {
      setConnectingId(null);
    }
  }, [connect, isConnecting]);

  const renderWalletButton = useCallback((wallet: WalletOption) => {
    const isActive = connectingId === wallet.id;
    return (
      <TouchableOpacity
        key={wallet.id}
        style={[st.walletBtn, isActive && st.walletBtnActive]}
        activeOpacity={0.7}
        onPress={() => handleConnect(wallet)}
        disabled={isConnecting}
        testID={`wallet-${wallet.id}`}
      >
        <View style={[st.walletIcon, { backgroundColor: wallet.color + "20" }]}>
          {isActive ? (
            <ActivityIndicator size="small" color={wallet.color} />
          ) : (
            <Text style={[st.walletIconText, { color: wallet.color }]}>{wallet.letter}</Text>
          )}
        </View>
        <View style={st.walletInfo}>
          <View style={st.walletNameRow}>
            <Text style={st.walletName}>{wallet.name}</Text>
            <View style={[st.walletTag, { backgroundColor: wallet.color + "18" }]}>
              <Text style={[st.walletTagText, { color: wallet.color }]}>{wallet.tag}</Text>
            </View>
          </View>
          <Text style={st.walletDesc}>{wallet.description}</Text>
        </View>
        <ChevronRight size={16} color={Colors.dark.textMuted} />
      </TouchableOpacity>
    );
  }, [connectingId, isConnecting, handleConnect]);

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <View style={st.bgPattern}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              st.bgCircle,
              {
                width: 200 + i * 80,
                height: 200 + i * 80,
                borderRadius: 100 + i * 40,
                top: SH * 0.08 - (100 + i * 40),
                left: SW * 0.5 - (100 + i * 40),
                opacity: 0.04 - i * 0.005,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[st.logoSection, { transform: [{ scale: logoScale }] }]}>
          <View style={st.logoContainer}>
            <View style={st.logoInner}>
              <Globe size={32} color={Colors.dark.accent} />
            </View>
            <View style={st.logoPulse} />
          </View>
        </Animated.View>

        <Animated.View style={[st.titleSection, { opacity: titleFade, transform: [{ translateY: titleSlide }] }]}>
          <Text style={st.title}>ImpactChain</Text>
          <Text style={st.subtitle}>Connect your wallet to track transparent,{"\n"}blockchain-verified social impact</Text>
        </Animated.View>

        <Animated.View style={[st.walletsSection, { opacity: cardsFade, transform: [{ translateY: cardsSlide }] }]}>
          <View style={st.sectionLabelRow}>
            <View style={st.sectionDot} />
            <Text style={st.sectionLabel}>EVM WALLETS</Text>
          </View>
          {EVM_WALLETS.map(renderWalletButton)}

          <View style={[st.sectionLabelRow, { marginTop: 20 }]}>
            <View style={[st.sectionDot, { backgroundColor: "#E6A946" }]} />
            <Text style={st.sectionLabel}>STARKNET WALLETS</Text>
          </View>
          {STARKNET_WALLETS.map(renderWalletButton)}
        </Animated.View>

        <Animated.View style={[st.featuresSection, { opacity: featuresFade }]}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <View key={i} style={st.featureRow}>
                <View style={st.featureIconWrap}>
                  <Icon size={14} color={Colors.dark.accent} />
                </View>
                <Text style={st.featureText}>{f.text}</Text>
              </View>
            );
          })}
        </Animated.View>

        <Animated.View style={[st.footerSection, { opacity: featuresFade }]}>
          <Text style={st.footerText}>
            Built by Weza lab
          </Text>
          <View style={st.footerDivider} />
          <Text style={st.footerSub}>
            By connecting, you agree to our Terms of Service
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  bgPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgCircle: {
    position: "absolute",
    backgroundColor: Colors.dark.accent,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.dark.accent + "40",
  },
  logoPulse: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.dark.accent + "15",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: Colors.dark.text,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  walletsSection: {},
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.dark.textMuted,
    letterSpacing: 1.2,
  },
  walletBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  walletBtnActive: {
    borderColor: Colors.dark.accent + "60",
    backgroundColor: Colors.dark.surface + "ee",
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  walletIconText: {
    fontSize: 18,
    fontWeight: "800" as const,
  },
  walletInfo: {
    flex: 1,
  },
  walletNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  walletName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.dark.text,
  },
  walletTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  walletTagText: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  walletDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  featuresSection: {
    marginTop: 28,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  footerSection: {
    alignItems: "center",
    marginTop: 28,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "500" as const,
  },
  footerDivider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 12,
  },
  footerSub: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
});
