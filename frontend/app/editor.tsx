import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import InviteCanvas from "@/src/components/InviteCanvas";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  TEMPLATE_IMAGES,
  TEXT_COLORS,
  type Category,
} from "@/src/constants/templates";
import { type Invite, FONT_OPTIONS, type FontChoice } from "@/src/types/invite";
import {
  getInvite,
  makeId,
  upsertInvite,
} from "@/src/store/invites";
import { suggestText, generateBackground } from "@/src/api/client";

type Tool = "text" | "background" | "color" | "ai";

export default function Editor() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    category?: Category;
    background?: string;
    title?: string;
    message?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<Tool>("text");
  const [busy, setBusy] = useState<"" | "ai-text" | "ai-bg" | "save">("");

  const [invite, setInvite] = useState<Invite>({
    id: "",
    category: "birthday",
    title: "",
    message: "",
    host: "",
    date: "",
    location: "",
    background: "",
    textColor: "#FFFFFF",
    titleFont: "playfair",
    textOffsetX: 0,
    textOffsetY: 0,
    paid: false,
    createdAt: 0,
    updatedAt: 0,
  });

  // Load existing or initialize from params
  useEffect(() => {
    (async () => {
      if (params.id) {
        const existing = await getInvite(String(params.id));
        if (existing) {
          setInvite(existing);
          setLoading(false);
          return;
        }
      }
      const cat = (params.category as Category) || "birthday";
      setInvite({
        id: makeId(),
        category: cat,
        title: String(params.title || "Let's celebrate!"),
        message: String(params.message || ""),
        host: "",
        date: "",
        location: "",
        background:
          String(params.background || "") || TEMPLATE_IMAGES[cat][0],
        textColor: "#FFFFFF",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback(<K extends keyof Invite>(k: K, v: Invite[K]) => {
    setInvite((prev) => ({ ...prev, [k]: v, updatedAt: Date.now() }));
  }, []);

  const onPickFromDevice = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        Alert.alert(
          "Permission required",
          "Photo library access is needed. Open Settings to enable it.",
        );
      } else {
        Alert.alert("Permission denied", "Photo library access was denied.");
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      const uri = a.base64
        ? `data:${a.mimeType || "image/jpeg"};base64,${a.base64}`
        : a.uri;
      set("background", uri);
    }
  };

  const onAiSuggestText = async () => {
    try {
      setBusy("ai-text");
      const res = await suggestText({
        category: invite.category,
        event_name: invite.title,
        host: invite.host,
        date: invite.date,
        location: invite.location,
      });
      setInvite((prev) => ({
        ...prev,
        title: res.title || prev.title,
        message: res.message || prev.message,
        updatedAt: Date.now(),
      }));
    } catch (e: any) {
      Alert.alert("AI suggestion failed", e?.message || "Please try again.");
    } finally {
      setBusy("");
    }
  };

  const onAiGenerateBg = async () => {
    try {
      setBusy("ai-bg");
      const promptText = `${invite.title || invite.category} — ${
        invite.message || "event invitation background"
      }`;
      const res = await generateBackground(promptText, invite.category);
      const uri = `data:${res.mime_type};base64,${res.image_base64}`;
      set("background", uri);
    } catch (e: any) {
      Alert.alert(
        "Image generation failed",
        e?.message || "Please try again.",
      );
    } finally {
      setBusy("");
    }
  };

  const onSave = async () => {
    if (!invite.title.trim()) {
      Alert.alert("Add a title", "Please enter an invitation title.");
      return;
    }
    setBusy("save");
    const toSave = { ...invite, updatedAt: Date.now() };
    await upsertInvite(toSave);
    setBusy("");
    router.replace({ pathname: "/preview/[id]", params: { id: toSave.id } });
  };

  const headerColor = useMemo(
    () => CATEGORY_COLORS[invite.category] || "#FAF9F6",
    [invite.category],
  );

  if (loading) {
    return (
      <View style={styles.center} testID="editor-loading">
        <ActivityIndicator size="large" color="#E26D5A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FAF9F6" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Canvas */}
          <View style={styles.canvasWrap} testID="editor-canvas-wrap">
            <InviteCanvas
              invite={invite}
              draggable
              onOffsetChange={(x, y) => {
                setInvite((prev) => ({
                  ...prev,
                  textOffsetX: x,
                  textOffsetY: y,
                  updatedAt: Date.now(),
                }));
              }}
            />
          </View>

          <Text style={styles.dragHint}>
            Tip: drag the text to reposition it
          </Text>

          {/* Category chip */}
          <View style={[styles.catChip, { backgroundColor: headerColor }]}>
            <Text style={styles.catChipText}>
              {CATEGORIES.find((c) => c.id === invite.category)?.emoji}{" "}
              {CATEGORIES.find((c) => c.id === invite.category)?.label}
            </Text>
          </View>

          {/* Tool panel */}
          {tool === "text" && (
            <View style={styles.panel} testID="panel-text">
              <FieldInput
                label="Title"
                value={invite.title}
                onChangeText={(v) => set("title", v)}
                testID="input-title"
              />
              <FieldInput
                label="Message"
                value={invite.message}
                onChangeText={(v) => set("message", v)}
                multiline
                testID="input-message"
              />
              <FieldInput
                label="Hosted by"
                value={invite.host}
                onChangeText={(v) => set("host", v)}
                placeholder="The Smith Family"
                testID="input-host"
              />
              <FieldInput
                label="Date & time"
                value={invite.date}
                onChangeText={(v) => set("date", v)}
                placeholder="Sat, Mar 14 · 7:00 PM"
                testID="input-date"
              />
              <FieldInput
                label="Location"
                value={invite.location}
                onChangeText={(v) => set("location", v)}
                placeholder="123 Garden Lane"
                testID="input-location"
              />
            </View>
          )}

          {tool === "background" && (
            <View style={styles.panel} testID="panel-background">
              <Text style={styles.panelTitle}>Choose a background</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={onPickFromDevice}
                  testID="pick-device-btn"
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={18} color="#1A1A1A" />
                  <Text style={styles.actionBtnText}>From device</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={onAiGenerateBg}
                  disabled={busy === "ai-bg"}
                  testID="ai-bg-btn"
                  activeOpacity={0.8}
                >
                  {busy === "ai-bg" ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  )}
                  <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
                    AI generate
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subLabel}>Or pick from a category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => set("category", c.id)}
                    style={[
                      styles.miniPill,
                      invite.category === c.id && {
                        backgroundColor: "#1A1A1A",
                      },
                    ]}
                    testID={`switch-category-${c.id}`}
                  >
                    <Text
                      style={[
                        styles.miniPillText,
                        invite.category === c.id && { color: "#FFFFFF" },
                      ]}
                    >
                      {c.emoji} {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bgRow}
              >
                {TEMPLATE_IMAGES[invite.category].map((uri, i) => (
                  <TouchableOpacity
                    key={uri}
                    onPress={() => set("background", uri)}
                    activeOpacity={0.85}
                    testID={`bg-option-${i}`}
                  >
                    <View
                      style={[
                        styles.bgThumbWrap,
                        invite.background === uri && styles.bgThumbActive,
                      ]}
                    >
                      <InviteCanvasThumb uri={uri} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {tool === "color" && (
            <View style={styles.panel} testID="panel-color">
              <Text style={styles.panelTitle}>Text color</Text>
              <View style={styles.colorRow}>
                {TEXT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => set("textColor", c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      invite.textColor === c && styles.colorDotActive,
                    ]}
                    testID={`color-${c}`}
                  />
                ))}
              </View>
            </View>
          )}

          {tool === "font" && (
            <View style={styles.panel} testID="panel-font">
              <Text style={styles.panelTitle}>Title font</Text>
              {FONT_OPTIONS.map((f) => {
                const active = invite.titleFont === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => set("titleFont", f.id as FontChoice)}
                    activeOpacity={0.7}
                    style={[
                      styles.fontRow,
                      active && styles.fontRowActive,
                    ]}
                    testID={`font-${f.id}`}
                  >
                    <Text
                      style={{
                        fontFamily: f.family,
                        fontSize: 24,
                        color: "#1A1A1A",
                      }}
                    >
                      {invite.title || "Sample title"}
                    </Text>
                    <Text style={styles.fontLabel}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.actionBtn, { marginTop: 12 }]}
                onPress={() => {
                  set("textOffsetX", 0);
                  set("textOffsetY", 0);
                }}
                testID="reset-position-btn"
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color="#1A1A1A" />
                <Text style={styles.actionBtnText}>Reset text position</Text>
              </TouchableOpacity>
            </View>
          )}

          {tool === "ai" && (
            <View style={styles.panel} testID="panel-ai">
              <Text style={styles.panelTitle}>AI helpers</Text>
              <Text style={styles.helpText}>
                Fill in event details above first for the best results.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, { marginTop: 12 }]}
                onPress={onAiSuggestText}
                disabled={busy === "ai-text"}
                testID="ai-text-btn"
                activeOpacity={0.8}
              >
                {busy === "ai-text" ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                )}
                <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
                  Suggest title & message
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { marginTop: 10 }]}
                onPress={onAiGenerateBg}
                disabled={busy === "ai-bg"}
                testID="ai-bg-btn-2"
                activeOpacity={0.8}
              >
                {busy === "ai-bg" ? (
                  <ActivityIndicator color="#1A1A1A" size="small" />
                ) : (
                  <Ionicons name="image-outline" size={18} color="#1A1A1A" />
                )}
                <Text style={styles.actionBtnText}>Generate background</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom toolbar */}
        <View style={styles.toolbar} testID="editor-toolbar">
          <ToolBtn
            icon="text"
            label="Text"
            active={tool === "text"}
            onPress={() => setTool("text")}
            testID="tool-text"
          />
          <ToolBtn
            icon="image-outline"
            label="Background"
            active={tool === "background"}
            onPress={() => setTool("background")}
            testID="tool-background"
          />
          <ToolBtn
            icon="color-palette-outline"
            label="Color"
            active={tool === "color"}
            onPress={() => setTool("color")}
            testID="tool-color"
          />
          <ToolBtn
            icon="text-outline"
            label="Font"
            active={tool === "font"}
            onPress={() => setTool("font")}
            testID="tool-font"
          />
          <ToolBtn
            icon="sparkles-outline"
            label="AI"
            active={tool === "ai"}
            onPress={() => setTool("ai")}
            testID="tool-ai"
          />
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={onSave}
            disabled={busy === "save"}
            testID="save-invite-btn"
            activeOpacity={0.85}
          >
            {busy === "save" ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function FieldInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  testID?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, props.multiline && styles.inputMultiline]}
        multiline={props.multiline}
        testID={props.testID}
      />
    </View>
  );
}

function ToolBtn(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.toolBtn, props.active && styles.toolBtnActive]}
      onPress={props.onPress}
      activeOpacity={0.7}
      testID={props.testID}
    >
      <Ionicons
        name={props.icon}
        size={20}
        color={props.active ? "#E26D5A" : "#6B7280"}
      />
      <Text
        style={[styles.toolLabel, props.active && { color: "#E26D5A" }]}
      >
        {props.label}
      </Text>
    </TouchableOpacity>
  );
}

function InviteCanvasThumb({ uri }: { uri: string }) {
  return (
    <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9F6" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F6",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  canvasWrap: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
    backgroundColor: "#EEE",
    marginBottom: 16,
  },
  catChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  catChipText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#1A1A1A",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  panelTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    color: "#1A1A1A",
    marginBottom: 12,
  },
  helpText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  subLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  fieldLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionBtnPrimary: {
    backgroundColor: "#E26D5A",
    borderColor: "#E26D5A",
  },
  actionBtnText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: "#1A1A1A",
  },
  miniPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  miniPillText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#1A1A1A",
  },
  bgRow: { gap: 10, paddingTop: 12, paddingRight: 8 },
  bgThumbWrap: {
    width: 84,
    height: 112,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  bgThumbActive: { borderColor: "#E26D5A" },
  thumbImg: { width: "100%", height: "100%" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  colorDotActive: { borderColor: "#1A1A1A", borderWidth: 3 },
  dragHint: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
    marginTop: -6,
  },
  fontRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  fontRowActive: {
    borderColor: "#E26D5A",
    backgroundColor: "#FFF4F1",
  },
  fontLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 4,
  },
  toolBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 12,
  },
  toolBtnActive: { backgroundColor: "#FFF4F1" },
  toolLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    marginLeft: 6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
});
