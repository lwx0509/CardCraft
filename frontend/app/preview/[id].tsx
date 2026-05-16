import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";

import InviteCanvas from "@/src/components/InviteCanvas";
import { getInvite } from "@/src/store/invites";
import { type Invite } from "@/src/types/invite";

export default function Preview() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState<"" | "share" | "save">("");
  const shotRef = useRef<ViewShot>(null);

  useEffect(() => {
    (async () => {
      if (id) {
        const i = await getInvite(String(id));
        if (i) setInvite(i);
      }
    })();
  }, [id]);

  const capture = async (): Promise<string | null> => {
    try {
      // @ts-ignore
      const uri = await shotRef.current?.capture?.();
      return uri || null;
    } catch (e) {
      console.warn("capture failed", e);
      return null;
    }
  };

  const onShare = async () => {
    setBusy("share");
    try {
      const uri = await capture();
      if (!uri) {
        Alert.alert("Could not prepare image", "Please try again.");
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your invitation",
      });
    } catch (e: any) {
      Alert.alert("Share failed", e?.message || "Please try again.");
    } finally {
      setBusy("");
    }
  };

  const onSaveToGallery = async () => {
    setBusy("save");
    try {
      if (Platform.OS === "web") {
        const uri = await capture();
        if (!uri) return;
        // On web, open in new tab so user can right-click save
        if (typeof window !== "undefined") {
          // @ts-ignore
          const win = window.open();
          if (win) win.document.write(`<img src="${uri}" style="max-width:100%" />`);
        }
        return;
      }
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        if (!perm.canAskAgain) {
          Alert.alert(
            "Permission required",
            "Photo library access is needed to save. Please enable it in Settings.",
          );
        } else {
          Alert.alert("Permission denied", "We need access to save the image.");
        }
        return;
      }
      const uri = await capture();
      if (!uri) {
        Alert.alert("Could not prepare image", "Please try again.");
        return;
      }
      // Ensure file path
      let fileUri = uri;
      if (uri.startsWith("data:")) {
        const base64 = uri.split(",")[1];
        const path = FileSystem.cacheDirectory + `invite_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(path, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileUri = path;
      }
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      try {
        await MediaLibrary.createAlbumAsync("Invite Studio", asset, false);
      } catch {
        /* album creation optional */
      }
      Alert.alert("Saved!", "Your invitation was saved to your gallery.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Please try again.");
    } finally {
      setBusy("");
    }
  };

  if (!invite) {
    return (
      <View style={styles.center} testID="preview-loading">
        <ActivityIndicator size="large" color="#E26D5A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ViewShot
          ref={shotRef}
          options={{ format: "png", quality: 1, result: "tmpfile" }}
          style={styles.shot}
        >
          <InviteCanvas invite={invite} rounded={false} />
        </ViewShot>

        <View style={styles.actions}>
          <ActionButton
            icon="share-social-outline"
            label="Share"
            primary
            loading={busy === "share"}
            onPress={onShare}
            testID="share-btn"
          />
          <ActionButton
            icon="download-outline"
            label="Save to gallery"
            loading={busy === "save"}
            onPress={onSaveToGallery}
            testID="save-gallery-btn"
          />
          <ActionButton
            icon="create-outline"
            label="Edit"
            onPress={() =>
              router.replace({ pathname: "/editor", params: { id: invite.id } })
            }
            testID="edit-from-preview-btn"
          />
        </View>

        <TouchableOpacity
          style={styles.homeLink}
          onPress={() => router.replace("/")}
          testID="back-home-btn"
        >
          <Text style={styles.homeLinkText}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, props.primary && styles.actionBtnPrimary]}
      onPress={props.onPress}
      disabled={!!props.loading}
      activeOpacity={0.85}
      testID={props.testID}
    >
      {props.loading ? (
        <ActivityIndicator
          color={props.primary ? "#FFFFFF" : "#1A1A1A"}
          size="small"
        />
      ) : (
        <Ionicons
          name={props.icon}
          size={20}
          color={props.primary ? "#FFFFFF" : "#1A1A1A"}
        />
      )}
      <Text
        style={[
          styles.actionLabel,
          props.primary && { color: "#FFFFFF" },
        ]}
      >
        {props.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9F6" },
  center: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, paddingBottom: 32 },
  shot: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#EEE",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
    marginBottom: 6,
  },
  actionBtnPrimary: {
    backgroundColor: "#E26D5A",
    borderColor: "#E26D5A",
  },
  actionLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    color: "#1A1A1A",
  },
  homeLink: {
    alignSelf: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  homeLinkText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
});
