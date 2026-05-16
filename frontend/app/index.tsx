import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  TEMPLATE_IMAGES,
  PRESET_TITLES,
  PRESET_MESSAGES,
  type Category,
} from "@/src/constants/templates";

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState<Category>("birthday");

  const templates = useMemo(() => TEMPLATE_IMAGES[active], [active]);

  const startBlank = () => {
    router.push({
      pathname: "/editor",
      params: {
        category: active,
        background: templates[0],
        title: PRESET_TITLES[active],
        message: PRESET_MESSAGES[active],
      },
    });
  };

  const pickTemplate = (bg: string) => {
    router.push({
      pathname: "/editor",
      params: {
        category: active,
        background: bg,
        title: PRESET_TITLES[active],
        message: PRESET_MESSAGES[active],
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Welcome to</Text>
            <Text style={styles.appTitle}>Invite Studio</Text>
          </View>
          <TouchableOpacity
            style={styles.savedBtn}
            onPress={() => router.push("/my-invites")}
            testID="open-my-invites-btn"
            activeOpacity={0.7}
          >
            <Ionicons name="bookmark-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Choose an event</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {CATEGORIES.map((c) => {
            const isActive = c.id === active;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setActive(c.id)}
                activeOpacity={0.7}
                style={[
                  styles.pill,
                  isActive && {
                    backgroundColor: "#1A1A1A",
                  },
                ]}
                testID={`category-btn-${c.id}`}
              >
                <Text style={styles.pillEmoji}>{c.emoji}</Text>
                <Text
                  style={[
                    styles.pillText,
                    isActive && { color: "#FFFFFF" },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.ctaCard,
            { backgroundColor: CATEGORY_COLORS[active] },
          ]}
          activeOpacity={0.85}
          onPress={startBlank}
          testID="start-blank-btn"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Start a new invite</Text>
            <Text style={styles.ctaSub}>
              Tap a template below or design from scratch.
            </Text>
          </View>
          <View style={styles.ctaIcon}>
            <Ionicons name="add" size={26} color="#1A1A1A" />
          </View>
        </TouchableOpacity>

        <Text style={styles.section}>Templates</Text>
        <View style={styles.grid}>
          {templates.map((uri, idx) => (
            <TouchableOpacity
              key={uri}
              activeOpacity={0.85}
              style={styles.tplCardWrap}
              onPress={() => pickTemplate(uri)}
              testID={`template-card-${idx}`}
            >
              <ImageBackground
                source={{ uri }}
                style={styles.tplCard}
                imageStyle={styles.tplImg}
              >
                <View style={styles.tplOverlay} />
                <Text style={styles.tplTitle} numberOfLines={2}>
                  {PRESET_TITLES[active]}
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9F6" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: "#6B7280",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  appTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 34,
    color: "#1A1A1A",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  savedBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  section: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#6B7280",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 14,
  },
  pillsRow: { gap: 10, paddingRight: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  pillEmoji: { fontSize: 16, marginRight: 8 },
  pillText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: "#1A1A1A",
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  ctaTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  ctaSub: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "#1A1A1A",
    opacity: 0.7,
    marginTop: 4,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tplCardWrap: {
    width: "48.5%",
    aspectRatio: 3 / 4,
    marginBottom: 14,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#EEE",
  },
  tplCard: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    padding: 14,
  },
  tplImg: { borderRadius: 20 },
  tplOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  tplTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 20,
  },
});
