import { router } from "expo-router";
import { MapPin, Users, ShieldCheck, Search, Filter } from "lucide-react-native";
import React, { useState, useMemo, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput } from "react-native";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { projects, categoryColors, type Project } from "@/mocks/projects";

const CATS = ["all", "education", "health", "water", "finance", "agriculture", "governance"] as const;

function ProjectCard({ project }: { project: Project }) {
  const prog = project.raised / project.goal;
  const cc = categoryColors[project.category] ?? Colors.dark.accent;
  const go = useCallback(() => { router.push(`/project/${project.id}`); }, [project.id]);
  return (
    <TouchableOpacity style={st.card} activeOpacity={0.8} onPress={go} testID={`project-${project.id}`}>
      <Image source={{ uri: project.imageUrl }} style={st.cardImage} contentFit="cover" />
      <View style={st.cardBody}>
        <View style={st.cardTopRow}>
          <View style={[st.categoryTag, { backgroundColor: cc + "20" }]}><View style={[st.catDot, { backgroundColor: cc }]} /><Text style={[st.categoryText, { color: cc }]}>{project.category.charAt(0).toUpperCase() + project.category.slice(1)}</Text></View>
          <View style={[st.statusTag, project.status === "completed" ? st.statusCompleted : project.status === "active" ? st.statusActive : st.statusUpcoming]}>
            <Text style={[st.statusText, project.status === "completed" ? st.statusCompletedText : project.status === "active" ? st.statusActiveText : st.statusUpcomingText]}>{project.status}</Text>
          </View>
        </View>
        <Text style={st.cardTitle} numberOfLines={2}>{project.name}</Text>
        <View style={st.cardMeta}><View style={st.metaItem}><MapPin size={12} color={Colors.dark.textMuted} /><Text style={st.metaText}>{project.location}</Text></View></View>
        <View style={st.progressSection}>
          <View style={st.progressBar}><View style={[st.progressFill, { width: `${Math.min(prog * 100, 100)}%`, backgroundColor: cc }]} /></View>
          <View style={st.progressLabels}><Text style={st.raisedText}>${project.raised.toLocaleString()}</Text><Text style={st.goalText}>of ${project.goal.toLocaleString()}</Text></View>
        </View>
        <View style={st.statsRow}>
          <View style={st.statItem}><Users size={12} color={Colors.dark.textMuted} /><Text style={st.statText}>{project.beneficiaries.toLocaleString()}</Text></View>
          <View style={st.statItem}><ShieldCheck size={12} color={Colors.dark.accent} /><Text style={st.statText}>{project.verifications} verified</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ImpactChainProjects() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const filtered = useMemo(() => projects.filter((p) => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
    const mc = cat === "all" || p.category === cat;
    return ms && mc;
  }), [search, cat]);
  const renderItem = useCallback(({ item }: { item: Project }) => <ProjectCard project={item} />, []);

  return (
    <View style={st.container}>
      <View style={st.searchRow}><View style={st.searchBox}><Search size={16} color={Colors.dark.textMuted} /><TextInput style={st.searchInput} placeholder="Search projects..." placeholderTextColor={Colors.dark.textMuted} value={search} onChangeText={setSearch} /></View></View>
      <View style={st.filterRow}>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={CATS} keyExtractor={(i) => i} contentContainerStyle={st.filterScroll}
          renderItem={({ item }) => (<TouchableOpacity style={[st.filterChip, cat === item && st.filterChipActive]} onPress={() => setCat(item)}><Text style={[st.filterChipText, cat === item && st.filterChipTextActive]}>{item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}</Text></TouchableOpacity>)} />
      </View>
      <FlatList data={filtered} renderItem={renderItem} keyExtractor={(i) => i.id} contentContainerStyle={st.listContent} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={st.emptyState}><Filter size={40} color={Colors.dark.textMuted} /><Text style={st.emptyTitle}>No projects found</Text><Text style={st.emptySubtitle}>Try adjusting your search or filters</Text></View>} />
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  searchRow: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.dark.surface, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: Colors.dark.border, gap: 10 },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 15 },
  filterRow: { paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.dark.accentMuted, borderColor: Colors.dark.accent },
  filterChipText: { fontSize: 13, color: Colors.dark.textSecondary, fontWeight: "500" as const },
  filterChipTextActive: { color: Colors.dark.accent, fontWeight: "600" as const },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { backgroundColor: Colors.dark.surface, borderRadius: 16, marginBottom: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.dark.border },
  cardImage: { width: "100%", height: 150 },
  cardBody: { padding: 16 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  categoryTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 5 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.3 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: Colors.dark.accentMuted },
  statusCompleted: { backgroundColor: Colors.dark.infoMuted },
  statusUpcoming: { backgroundColor: Colors.dark.warningMuted },
  statusText: { fontSize: 11, fontWeight: "600" as const, textTransform: "capitalize" as const },
  statusActiveText: { color: Colors.dark.accent },
  statusCompletedText: { color: Colors.dark.info },
  statusUpcomingText: { color: Colors.dark.warning },
  cardTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.dark.text, lineHeight: 22, marginBottom: 6 },
  cardMeta: { flexDirection: "row", gap: 12, marginBottom: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.dark.textMuted },
  progressSection: { marginBottom: 14 },
  progressBar: { height: 5, backgroundColor: Colors.dark.surfaceLight, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabels: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  raisedText: { fontSize: 15, fontWeight: "700" as const, color: Colors.dark.text },
  goalText: { fontSize: 12, color: Colors.dark.textMuted },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: Colors.dark.textSecondary },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "600" as const, color: Colors.dark.text, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.dark.textMuted },
});
