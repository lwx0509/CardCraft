import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { type Invite } from "@/src/types/invite";
import { CATEGORIES, type Category } from "@/src/constants/templates";
import { deleteInvite, loadInvites } from "@/src/store/invites";

export default function MyInvites() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadInvites().then(setInvites);
    }, []),
  );

  const onDelete = (id: string) => {
    Alert.alert("Delete invite?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => setInvites(await deleteInvite(id)),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Invite }) => {
    const catLabel =
      CATEGORIES.find((c) => c.id === (item.category as Category))?.label ||
      item.category;
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={() =>
          router.push({ pathname: "/preview/[id]", params: { id: item.id } })
        }
        testID={`invite-row-${item.id}`}
      >
        <Image source={{ uri: item.background }} style={styles.thumb} />
        <View style={styles.rowMid}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title || "Untitled"}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {catLabel}
            {item.date ? ` · ${item.date}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            router.push({ pathname: "/editor", params: { id: item.id } })
          }
          testID={`edit-btn-${item.id}`}
        >
          <Ionicons name="create-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onDelete(item.id)}
          testID={`delete-btn-${item.id}`}
        >
          <Ionicons name="trash-outline" size={20} color="#E26D5A" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {invites.length === 0 ? (
        <View style={styles.empty} testID="my-invites-empty">
          <Ionicons name="mail-open-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No invites yet</Text>
          <Text style={styles.emptySub}>
            Create your first invitation from the home screen.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.replace("/")}
            testID="empty-cta"
          >
            <Text style={styles.emptyBtnText}>Browse templates</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          testID="my-invites-list"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9F6" },
  list: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  thumb: { width: 60, height: 80, borderRadius: 12, backgroundColor: "#EEE" },
  rowMid: { flex: 1, marginLeft: 14 },
  rowTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  rowMeta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F6",
    marginLeft: 6,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: "#1A1A1A",
    marginTop: 12,
  },
  emptySub: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
});
