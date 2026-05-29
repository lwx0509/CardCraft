import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";

import InviteCanvas from "@/src/components/InviteCanvas";
import { getInvite, upsertInvite } from "@/src/store/invites";
import { type Invite } from "@/src/types/invite";
import {
  createCheckoutSession,
  getPaymentStatus,
  syncSession,
} from "@/src/api/client";

const PRICE_LABEL = "$9.99";
const IS_WEB = Platform.OS === "web";

export default function Preview() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    session_id?: string;
    invite_id?: string;
  }>();
  const id = String(params.id || "");
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState<"" | "pay" | "share" | "save">("");
  const shotRef = useRef<ViewShot>(null);

  const refreshInvite = useCallback(async () => {
    if (!id) return;
    const i = await getInvite(id);
    if (i) setInvite(i);
  }, [id]);

  useEffect(() => {
    refreshInvite();
  }, [refreshInvite]);

  useFocusEffect(
    useCallback(() => {
      const sid = params.session_id ? String(params.session_id) : "";
      if (!sid) return;
      (async () => {
        try {
          const status = await syncSession(sid);
          if (status.paid && id) {
            const i = await getInvite(id);
            if (i && !i.paid) {
              await upsertInvite({ ...i, paid: true, updatedAt: Date.now() });
              setInvite({ ...i, paid: true });
            }
          }
        } catch {
          try {
            const s = await getPaymentStatus(id);
            if (s.paid) {
              const i = await getInvite(id);
              if (i && !i.paid) {
                await upsertInvite({ ...i, paid: true, updatedAt: Date.now() });
                setInvite({ ...i, paid: true });
              }
            }
          } catch {
            /* ignore */
          }
        }
      })();
    }, [params.session_id, id]),
  );

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

  const onPay = async () => {
    if (!invite) return;
    setBusy("pay");
    try {
      const base = process.env.EXPO_PUBLIC_BACKEND_URL || "";
      const successUrl = `${base}/preview/${invite.id}`;
      const cancelUrl = `${base}/preview/${invite.id}`;
      const res = await createCheckoutSession({
        invite_id: invite.id,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      if (IS_WEB) {
        // @ts-ignore
        window.location.href = res.checkout_url;
        return;
      }
      const result = await WebBrowser.openBrowserAsync(res.checkout_url);
      try {
        const s = await syncSession(res.session_id);
        if (s.paid) {
          await upsertInvite({ ...invite, paid: true, updatedAt: Date.now() });
          setInvite({ ...invite, paid: true });
          Alert.alert("Payment received", "Save & share are now unlocked.");
          return;
        }
      } catch {
        /* ignore */
      }
      const s2 = await getPaymentStatus(invite.id);
      if (s2.paid) {
        await upsertInvite({ ...invite, paid: true, updatedAt: Date.now() });
        setInvite({ ...invite, paid: true });
        Alert.alert("Payment received", "Save & share are now unlocked.");
      } else if (result.type === "cancel") {
        Alert.alert("Checkout closed", "Payment was not completed.");
      }
    } catch (e: any) {
      Alert.alert("Checkout failed", e?.message || "Please try again.");
    } finally {
      setBusy("");
    }
  };

  const ensurePaid = (): boolean => {
    if (invite?.paid) return true;
    Alert.alert(
      "Unlock to save & share",
      `Pay ${PRICE_LABEL} once for this invite to download and share it.`,
    );
    return false;
  };

  const slug = (s: string) =>
    s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() ||
    "invite";

  // ---------- Web-native share & download ----------
  const dataUriToBlob = (dataUri: string): Blob => {
    const [header, base64] = dataUri.split(",");
    const mime =
      header.match(/data:([^;]+);base64/)?.[1] || "application/octet-stream";
    const bin = atob(base64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const webDownload = async (uri: string, filename: string) => {
    let url = uri;
    let cleanup: (() => void) | null = null;
    if (uri.startsWith("data:")) {
      const blob = dataUriToBlob(uri);
      url = URL.createObjectURL(blob);
      cleanup = () => URL.revokeObjectURL(url);
    }
    // @ts-ignore
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => cleanup?.(), 1000);
  };

  const webShare = async (uri: string, filename: string): Promise<boolean> => {
    try {
      const blob = uri.startsWith("data:")
        ? dataUriToBlob(uri)
        : await (await fetch(uri)).blob();
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      // @ts-ignore
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // @ts-ignore
        await navigator.share({
          files: [file],
          title: "My event invitation",
          text: "Check out this invite I made with Invite Studio!",
        });
        return true;
      }
    } catch {
      /* fall through */
    }
    return false;
  };

  const onShare = async () => {
    if (!ensurePaid()) return;
    setBusy("share");
    try {
      const uri = await capture();
      if (!uri) {
        Alert.alert("Could not prepare image", "Please try again.");
        return;
      }
      const filename = `${slug(invite!.title)}.png`;
      if (IS_WEB) {
        const shared = await webShare(uri, filename);
        if (!shared) {
          // Browser doesn't support file share → download instead
          await webDownload(uri, filename);
          Alert.alert(
            "Downloaded",
            "Your browser doesn't support direct sharing. The invite was downloaded — share it from your Files / Photos.",
          );
        }
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

  const onSave = async () => {
    if (!ensurePaid()) return;
    setBusy("save");
    try {
      const uri = await capture();
      if (!uri) {
        Alert.alert("Could not prepare image", "Please try again.");
        return;
      }
      const filename = `${slug(invite!.title)}.png`;
      if (IS_WEB) {
        await webDownload(uri, filename);
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
        /* ignore */
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

  const paid = !!invite.paid;
  const saveLabel = IS_WEB ? "Download" : "Save to gallery";

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
        <View style={[styles.shotWrap, isWide && styles.shotWrapWide]}>
          <ViewShot
            ref={shotRef}
            options={{ format: "png", quality: 1, result: "tmpfile" }}
            style={styles.shot}
          >
            <InviteCanvas invite={invite} rounded={false} showAttribution />
          </ViewShot>
        </View>

        <View style={[styles.sidePanel, isWide && styles.sidePanelWide]}>
          {!paid && (
            <View style={styles.lockedBanner} testID="locked-banner">
              <Ionicons name="lock-closed" size={16} color="#1A1A1A" />
              <Text style={styles.lockedText}>
                Unlock download & share for this invite — {PRICE_LABEL}
              </Text>
            </View>
          )}

          {paid && (
            <View style={[styles.lockedBanner, styles.unlockedBanner]} testID="unlocked-banner">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.lockedText, { color: "#065F46" }]}>
                Unlocked — download and share away!
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {!paid ? (
              <ActionButton
                icon="card-outline"
                label={`Unlock for ${PRICE_LABEL}`}
                primary
                loading={busy === "pay"}
                onPress={onPay}
                testID="pay-btn"
              />
            ) : (
              <>
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
                  label={saveLabel}
                  loading={busy === "save"}
                  onPress={onSave}
                  testID="save-gallery-btn"
                />
              </>
            )}
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
        </View>
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
      <Text style={[styles.actionLabel, props.primary && { color: "#FFFFFF" }]}>
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
  contentWide: {
    flexDirection: "row",
    gap: 32,
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
    paddingTop: 36,
    paddingHorizontal: 40,
  },
  shotWrap: { marginBottom: 18 },
  shotWrapWide: { flex: 1.2, maxWidth: 560, marginBottom: 0 },
  shot: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#EEE",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  sidePanel: {},
  sidePanelWide: { flex: 1, justifyContent: "center" },
  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  unlockedBanner: { backgroundColor: "#D1FAE5" },
  lockedText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    color: "#1A1A1A",
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
  actionBtnPrimary: { backgroundColor: "#E26D5A", borderColor: "#E26D5A" },
  actionLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    color: "#1A1A1A",
  },
  homeLink: { alignSelf: "center", paddingVertical: 12, marginTop: 8 },
  homeLinkText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#6B7280",
  },
});
