import { router } from "expo-router";
import { ArrowLeft, Camera, MapPin, Target, DollarSign, FileText, Check, Rocket, ChevronDown } from "lucide-react-native";
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
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useProjects } from "@/providers/ProjectsProvider";
import type { Project } from "@/mocks/projects";

const { width: SW } = Dimensions.get("window");

type Step = "details" | "funding" | "review" | "publishing" | "success";

const CATEGORIES: { value: Project["category"]; label: string; color: string }[] = [
  { value: "education", label: "Education", color: "#3B82F6" },
  { value: "health", label: "Health", color: "#EF4444" },
  { value: "water", label: "Water", color: "#06B6D4" },
  { value: "finance", label: "Finance", color: "#F59E0B" },
  { value: "agriculture", label: "Agriculture", color: "#10B981" },
  { value: "governance", label: "Governance", color: "#8B5CF6" },
];

const CURRENCIES = ["USDC", "ETH", "MATIC", "cUSD"];

const SDG_GOALS = [
  { id: 1, label: "No Poverty" },
  { id: 2, label: "Zero Hunger" },
  { id: 3, label: "Good Health" },
  { id: 4, label: "Quality Education" },
  { id: 6, label: "Clean Water" },
  { id: 8, label: "Decent Work" },
  { id: 10, label: "Reduced Inequalities" },
  { id: 11, label: "Sustainable Cities" },
  { id: 16, label: "Peace & Justice" },
  { id: 17, label: "Partnerships" },
];

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
  "https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=800",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800",
  "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
];

export default function CreateProjectScreen() {
  const insets = useSafeAreaInsets();
  const { createProject, publishProject } = useProjects();

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Project["category"] | null>(null);
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [goal, setGoal] = useState("");
  const [currency, setCurrency] = useState("USDC");
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);
  const [selectedImage, setSelectedImage] = useState(COVER_IMAGES[0]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const canProceedDetails = useMemo(
    () => name.trim().length > 3 && description.trim().length > 10 && category !== null && location.trim().length > 0,
    [name, description, category, location]
  );

  const canProceedFunding = useMemo(
    () => parseFloat(goal) > 0 && selectedSdgs.length > 0,
    [goal, selectedSdgs]
  );

  const toggleSdg = useCallback((id: number) => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSdgs((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }, []);

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === "details" && canProceedDetails) setStep("funding");
    else if (step === "funding" && canProceedFunding) setStep("review");
  }, [step, canProceedDetails, canProceedFunding]);

  const handleBack = useCallback(() => {
    if (step === "funding") setStep("details");
    else if (step === "review") setStep("funding");
    else router.back();
  }, [step]);

  const handleCreate = useCallback(async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const result = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category: category!,
        location: location.trim(),
        country: country.trim() || "XX",
        goal: parseFloat(goal),
        currency,
        imageUrl: selectedImage,
        sdgGoals: selectedSdgs,
      });
      setCreatedProjectId(result.id);
      setStep("publishing");
      console.log("[CreateProject] Project created:", result.id);
    } catch (err) {
      console.log("[CreateProject] Error:", err);
      Alert.alert("Error", "Failed to create project. Please try again.");
    }
  }, [name, description, category, location, country, goal, currency, selectedImage, selectedSdgs, createProject]);

  const handlePublish = useCallback(async () => {
    if (!createdProjectId) return;
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await publishProject.mutateAsync(createdProjectId);
      setStep("success");
      Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
      console.log("[CreateProject] Published:", createdProjectId);
    } catch (err) {
      Alert.alert("Error", "Failed to publish. Please try again.");
    }
  }, [createdProjectId, publishProject]);

  const stepIndicator = useMemo(() => {
    const steps = ["details", "funding", "review"];
    const currentIdx = steps.indexOf(step);
    return (
      <View style={st.stepRow}>
        {steps.map((s, i) => (
          <View key={s} style={st.stepDotRow}>
            <View style={[st.stepDot, i <= currentIdx && st.stepDotActive]}>
              {i < currentIdx ? <Check size={10} color="#fff" /> : <Text style={[st.stepDotText, i <= currentIdx && st.stepDotTextActive]}>{i + 1}</Text>}
            </View>
            {i < steps.length - 1 && <View style={[st.stepLine, i < currentIdx && st.stepLineActive]} />}
          </View>
        ))}
      </View>
    );
  }, [step]);

  if (step === "publishing") {
    return (
      <View style={[st.container, { paddingTop: insets.top }]}>
        <View style={st.publishingContainer}>
          <View style={st.publishCard}>
            <Image source={{ uri: selectedImage }} style={st.publishImage} contentFit="cover" />
            <View style={st.publishBody}>
              <Text style={st.publishName}>{name}</Text>
              <Text style={st.publishLocation}>{location}</Text>
              <View style={st.publishMeta}>
                <Text style={st.publishGoal}>{parseFloat(goal).toLocaleString()} {currency}</Text>
                <View style={[st.publishCatBadge, { backgroundColor: (CATEGORIES.find((c) => c.value === category)?.color ?? Colors.dark.accent) + "20" }]}>
                  <Text style={[st.publishCatText, { color: CATEGORIES.find((c) => c.value === category)?.color ?? Colors.dark.accent }]}>
                    {category ? category.charAt(0).toUpperCase() + category.slice(1) : ""}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={st.publishTitle}>Ready to Go Live?</Text>
          <Text style={st.publishDesc}>Publishing your project will make it visible to all users on ImpactChain. Donors can start funding immediately.</Text>
          <TouchableOpacity style={st.publishBtn} activeOpacity={0.8} onPress={handlePublish} disabled={publishProject.isPending} testID="publish-btn">
            {publishProject.isPending ? (
              <View style={st.sendingRow}><ActivityIndicator size="small" color="#fff" /><Text style={st.publishBtnText}>Publishing...</Text></View>
            ) : (
              <View style={st.sendingRow}><Rocket size={18} color="#fff" /><Text style={st.publishBtnText}>Publish Project</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={st.saveDraftBtn} onPress={() => { Alert.alert("Saved", "Project saved as draft"); router.back(); }}>
            <Text style={st.saveDraftText}>Save as Draft</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === "success") {
    return (
      <View style={[st.container, { paddingTop: insets.top }]}>
        <View style={st.successContainer}>
          <Animated.View style={[st.successContent, { transform: [{ scale: successScale }] }]}>
            <View style={st.successCheckWrap}>
              <View style={st.successCheckInner}><Check size={36} color="#fff" strokeWidth={3} /></View>
            </View>
            <Text style={st.successTitle}>Project Published!</Text>
            <Text style={st.successSubtitle}>Your project is now live and accepting donations on the blockchain.</Text>
            <View style={st.successStats}>
              <View style={st.successStat}><Text style={st.successStatValue}>{parseFloat(goal).toLocaleString()}</Text><Text style={st.successStatLabel}>{currency} Goal</Text></View>
              <View style={st.successStatDiv} />
              <View style={st.successStat}><Text style={st.successStatValue}>{selectedSdgs.length}</Text><Text style={st.successStatLabel}>SDG Goals</Text></View>
            </View>
            <TouchableOpacity style={st.successBtn} activeOpacity={0.8} onPress={() => router.back()} testID="done-btn">
              <Text style={st.successBtnText}>Go to Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.viewProjectBtn} onPress={() => { router.back(); router.push("/(tabs)/projects"); }}>
              <Text style={st.viewProjectText}>View My Projects</Text>
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
        <Text style={st.headerTitle}>
          {step === "details" ? "Project Details" : step === "funding" ? "Funding & SDGs" : "Review"}
        </Text>
        <View style={st.headerRight} />
      </View>
      {stepIndicator}

      <KeyboardAvoidingView style={st.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={st.flex} contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
            {step === "details" && (
              <>
                <Text style={st.label}>Cover Image</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.imageScroll}>
                  {COVER_IMAGES.map((img) => (
                    <TouchableOpacity key={img} onPress={() => { setSelectedImage(img); if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.8}>
                      <View style={[st.imageOption, selectedImage === img && st.imageOptionActive]}>
                        <Image source={{ uri: img }} style={st.imageThumb} contentFit="cover" />
                        {selectedImage === img && <View style={st.imageCheck}><Check size={14} color="#fff" /></View>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={st.label}>Project Name</Text>
                <TextInput style={st.input} placeholder="e.g. Clean Water for Rural Schools" placeholderTextColor={Colors.dark.textMuted} value={name} onChangeText={setName} maxLength={80} testID="name-input" />

                <Text style={st.label}>Description</Text>
                <TextInput style={[st.input, st.textArea]} placeholder="Describe your project, its goals, and the impact it will create..." placeholderTextColor={Colors.dark.textMuted} value={description} onChangeText={setDescription} multiline maxLength={500} testID="desc-input" />
                <Text style={st.charCount}>{description.length}/500</Text>

                <Text style={st.label}>Category</Text>
                <View style={st.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat.value} style={[st.categoryChip, category === cat.value && { backgroundColor: cat.color + "20", borderColor: cat.color + "60" }]} onPress={() => { setCategory(cat.value); if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                      <View style={[st.categoryDot, { backgroundColor: cat.color }]} />
                      <Text style={[st.categoryText, category === cat.value && { color: cat.color }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={st.label}>Location</Text>
                <View style={st.inputWithIcon}>
                  <MapPin size={16} color={Colors.dark.textMuted} />
                  <TextInput style={st.inputInner} placeholder="e.g. Nairobi, Kenya" placeholderTextColor={Colors.dark.textMuted} value={location} onChangeText={setLocation} testID="location-input" />
                </View>

                <Text style={st.label}>Country Code</Text>
                <TextInput style={st.input} placeholder="e.g. KE, IN, PH" placeholderTextColor={Colors.dark.textMuted} value={country} onChangeText={setCountry} maxLength={3} autoCapitalize="characters" testID="country-input" />
              </>
            )}

            {step === "funding" && (
              <>
                <Text style={st.label}>Funding Goal</Text>
                <View style={st.fundingRow}>
                  <View style={st.goalInputWrap}>
                    <DollarSign size={18} color={Colors.dark.textMuted} />
                    <TextInput style={st.goalInput} placeholder="0" placeholderTextColor={Colors.dark.textMuted} keyboardType="decimal-pad" value={goal} onChangeText={setGoal} testID="goal-input" />
                  </View>
                  <TouchableOpacity style={st.currencyBtn} onPress={() => setShowCurrencyPicker(!showCurrencyPicker)} activeOpacity={0.7}>
                    <Text style={st.currencyBtnText}>{currency}</Text>
                    <ChevronDown size={14} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                </View>

                {showCurrencyPicker && (
                  <View style={st.currencyPicker}>
                    {CURRENCIES.map((c) => (
                      <TouchableOpacity key={c} style={[st.currencyRow, currency === c && st.currencyRowActive]} onPress={() => { setCurrency(c); setShowCurrencyPicker(false); }}>
                        <Text style={[st.currencyRowText, currency === c && st.currencyRowTextActive]}>{c}</Text>
                        {currency === c && <Check size={14} color={Colors.dark.accent} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {parseFloat(goal) > 0 && (
                  <View style={st.goalPreview}>
                    <Text style={st.goalPreviewText}>You're aiming to raise</Text>
                    <Text style={st.goalPreviewAmount}>{parseFloat(goal).toLocaleString()} {currency}</Text>
                  </View>
                )}

                <Text style={[st.label, { marginTop: 28 }]}>UN Sustainable Development Goals</Text>
                <Text style={st.sublabel}>Select goals your project contributes to</Text>
                <View style={st.sdgGrid}>
                  {SDG_GOALS.map((sdg) => (
                    <TouchableOpacity key={sdg.id} style={[st.sdgChip, selectedSdgs.includes(sdg.id) && st.sdgChipActive]} onPress={() => toggleSdg(sdg.id)}>
                      <Text style={[st.sdgNumber, selectedSdgs.includes(sdg.id) && st.sdgNumberActive]}>SDG {sdg.id}</Text>
                      <Text style={[st.sdgLabel, selectedSdgs.includes(sdg.id) && st.sdgLabelActive]}>{sdg.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {step === "review" && (
              <>
                <View style={st.reviewCard}>
                  <Image source={{ uri: selectedImage }} style={st.reviewImage} contentFit="cover" />
                  <View style={st.reviewBody}>
                    <View style={st.reviewCatRow}>
                      <View style={[st.reviewCatBadge, { backgroundColor: (CATEGORIES.find((c) => c.value === category)?.color ?? Colors.dark.accent) + "20" }]}>
                        <Text style={[st.reviewCatText, { color: CATEGORIES.find((c) => c.value === category)?.color ?? Colors.dark.accent }]}>
                          {category ? category.charAt(0).toUpperCase() + category.slice(1) : ""}
                        </Text>
                      </View>
                    </View>
                    <Text style={st.reviewName}>{name}</Text>
                    <Text style={st.reviewDesc} numberOfLines={3}>{description}</Text>
                  </View>
                </View>

                <View style={st.reviewDetails}>
                  <View style={st.reviewRow}><Text style={st.reviewLabel}>Location</Text><Text style={st.reviewValue}>{location}</Text></View>
                  <View style={st.reviewDivider} />
                  <View style={st.reviewRow}><Text style={st.reviewLabel}>Funding Goal</Text><Text style={st.reviewValue}>{parseFloat(goal).toLocaleString()} {currency}</Text></View>
                  <View style={st.reviewDivider} />
                  <View style={st.reviewRow}><Text style={st.reviewLabel}>SDG Goals</Text><Text style={st.reviewValue}>{selectedSdgs.map((s) => `#${s}`).join(", ")}</Text></View>
                  <View style={st.reviewDivider} />
                  <View style={st.reviewRow}><Text style={st.reviewLabel}>Network</Text><Text style={st.reviewValue}>Multi-chain (ETH, Polygon, Celo)</Text></View>
                </View>

                <View style={st.reviewNote}>
                  <FileText size={16} color={Colors.dark.info} />
                  <Text style={st.reviewNoteText}>Your project will be deployed as a smart contract. All donations are tracked on-chain for full transparency.</Text>
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[st.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {step === "review" ? (
            <TouchableOpacity style={[st.primaryBtn, createProject.isPending && st.primaryBtnSending]} activeOpacity={0.8} onPress={handleCreate} disabled={createProject.isPending} testID="create-btn">
              {createProject.isPending ? (
                <View style={st.sendingRow}><ActivityIndicator size="small" color="#fff" /><Text style={st.primaryBtnText}>Creating...</Text></View>
              ) : (
                <View style={st.sendingRow}><Rocket size={18} color="#fff" /><Text style={st.primaryBtnText}>Create Project</Text></View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[st.primaryBtn, !(step === "details" ? canProceedDetails : canProceedFunding) && st.primaryBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={!(step === "details" ? canProceedDetails : canProceedFunding)}
              testID="next-btn"
            >
              <Text style={[st.primaryBtnText, !(step === "details" ? canProceedDetails : canProceedFunding) && st.primaryBtnTextDisabled]}>Continue</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.dark.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" as const, color: Colors.dark.text },
  headerRight: { width: 40 },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 40 },
  stepDotRow: { flexDirection: "row", alignItems: "center" },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
  stepDotText: { fontSize: 11, fontWeight: "700" as const, color: Colors.dark.textMuted },
  stepDotTextActive: { color: "#fff" },
  stepLine: { width: 50, height: 2, backgroundColor: Colors.dark.border, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: Colors.dark.accent },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  label: { fontSize: 13, fontWeight: "600" as const, color: Colors.dark.textMuted, marginBottom: 10, marginTop: 20 },
  sublabel: { fontSize: 12, color: Colors.dark.textMuted, marginBottom: 12, marginTop: -4 },
  input: { backgroundColor: Colors.dark.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
  textArea: { minHeight: 100, textAlignVertical: "top" as const },
  charCount: { fontSize: 11, color: Colors.dark.textMuted, textAlign: "right" as const, marginTop: 4 },
  inputWithIcon: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.dark.surface, borderRadius: 14, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: Colors.dark.border, gap: 10 },
  inputInner: { flex: 1, fontSize: 15, color: Colors.dark.text },
  imageScroll: { gap: 10, paddingRight: 20 },
  imageOption: { width: 100, height: 70, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  imageOptionActive: { borderColor: Colors.dark.accent },
  imageThumb: { width: "100%", height: "100%" },
  imageCheck: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.dark.accent, alignItems: "center", justifyContent: "center" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { fontSize: 13, fontWeight: "500" as const, color: Colors.dark.textSecondary },
  fundingRow: { flexDirection: "row", gap: 10 },
  goalInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: Colors.dark.surface, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.dark.border, gap: 8 },
  goalInput: { flex: 1, fontSize: 24, fontWeight: "700" as const, color: Colors.dark.text, paddingVertical: 14 },
  currencyBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.dark.surface, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border },
  currencyBtnText: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text },
  currencyPicker: { backgroundColor: Colors.dark.surface, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden" },
  currencyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  currencyRowActive: { backgroundColor: Colors.dark.accentMuted },
  currencyRowText: { fontSize: 15, fontWeight: "600" as const, color: Colors.dark.text },
  currencyRowTextActive: { color: Colors.dark.accent },
  goalPreview: { backgroundColor: Colors.dark.accentMuted, borderRadius: 14, padding: 16, marginTop: 14, alignItems: "center" },
  goalPreviewText: { fontSize: 13, color: Colors.dark.accent },
  goalPreviewAmount: { fontSize: 26, fontWeight: "800" as const, color: Colors.dark.accent, marginTop: 4, letterSpacing: -0.5 },
  sdgGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sdgChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border },
  sdgChipActive: { backgroundColor: Colors.dark.accentMuted, borderColor: Colors.dark.accent },
  sdgNumber: { fontSize: 10, fontWeight: "700" as const, color: Colors.dark.textMuted, marginBottom: 1 },
  sdgNumberActive: { color: Colors.dark.accent },
  sdgLabel: { fontSize: 12, fontWeight: "500" as const, color: Colors.dark.textSecondary },
  sdgLabelActive: { color: Colors.dark.accent },
  reviewCard: { backgroundColor: Colors.dark.surface, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.dark.border },
  reviewImage: { width: "100%", height: 160 },
  reviewBody: { padding: 18 },
  reviewCatRow: { marginBottom: 10 },
  reviewCatBadge: { alignSelf: "flex-start" as const, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  reviewCatText: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const },
  reviewName: { fontSize: 18, fontWeight: "700" as const, color: Colors.dark.text, marginBottom: 6 },
  reviewDesc: { fontSize: 14, color: Colors.dark.textSecondary, lineHeight: 20 },
  reviewDetails: { backgroundColor: Colors.dark.surface, borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.dark.border, overflow: "hidden" },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14 },
  reviewLabel: { fontSize: 14, color: Colors.dark.textMuted },
  reviewValue: { fontSize: 14, fontWeight: "600" as const, color: Colors.dark.text, maxWidth: SW * 0.5, textAlign: "right" as const },
  reviewDivider: { height: 1, backgroundColor: Colors.dark.border },
  reviewNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: Colors.dark.infoMuted, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.dark.info + "30" },
  reviewNoteText: { flex: 1, fontSize: 13, color: Colors.dark.info, lineHeight: 19 },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.dark.border, backgroundColor: Colors.dark.background },
  primaryBtn: { backgroundColor: Colors.dark.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" as const },
  primaryBtnDisabled: { backgroundColor: Colors.dark.surfaceLight },
  primaryBtnSending: { backgroundColor: Colors.dark.accentDark },
  primaryBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  primaryBtnTextDisabled: { color: Colors.dark.textMuted },
  sendingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  publishingContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  publishCard: { backgroundColor: Colors.dark.surface, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 28 },
  publishImage: { width: "100%", height: 140 },
  publishBody: { padding: 16 },
  publishName: { fontSize: 16, fontWeight: "700" as const, color: Colors.dark.text, marginBottom: 4 },
  publishLocation: { fontSize: 13, color: Colors.dark.textMuted, marginBottom: 10 },
  publishMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  publishGoal: { fontSize: 18, fontWeight: "800" as const, color: Colors.dark.accent },
  publishCatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  publishCatText: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const },
  publishTitle: { fontSize: 22, fontWeight: "800" as const, color: Colors.dark.text, textAlign: "center" as const, marginBottom: 8 },
  publishDesc: { fontSize: 14, color: Colors.dark.textSecondary, textAlign: "center" as const, lineHeight: 21, marginBottom: 28 },
  publishBtn: { backgroundColor: Colors.dark.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" as const, marginBottom: 12 },
  publishBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  saveDraftBtn: { alignItems: "center" as const, paddingVertical: 12 },
  saveDraftText: { fontSize: 15, color: Colors.dark.textSecondary, fontWeight: "600" as const },
  successContainer: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 28 },
  successContent: { alignItems: "center" as const, width: "100%" as const },
  successCheckWrap: { marginBottom: 24 },
  successCheckInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.dark.accent, alignItems: "center" as const, justifyContent: "center" as const },
  successTitle: { fontSize: 24, fontWeight: "800" as const, color: Colors.dark.text, marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: Colors.dark.textSecondary, textAlign: "center" as const, lineHeight: 21, marginBottom: 24 },
  successStats: { flexDirection: "row", backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.dark.border, width: "100%" as const, marginBottom: 24 },
  successStat: { flex: 1, alignItems: "center" as const },
  successStatValue: { fontSize: 20, fontWeight: "700" as const, color: Colors.dark.text },
  successStatLabel: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  successStatDiv: { width: 1, backgroundColor: Colors.dark.border },
  successBtn: { width: "100%" as const, backgroundColor: Colors.dark.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" as const },
  successBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  viewProjectBtn: { marginTop: 16 },
  viewProjectText: { fontSize: 14, color: Colors.dark.accent, fontWeight: "600" as const },
});
