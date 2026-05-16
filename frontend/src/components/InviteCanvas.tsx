import React from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import type { Invite } from "@/src/types/invite";

type Props = {
  invite: Pick<
    Invite,
    "title" | "message" | "host" | "date" | "location" | "background" | "textColor"
  >;
  rounded?: boolean;
};

export default function InviteCanvas({ invite, rounded = true }: Props) {
  const color = invite.textColor || "#FFFFFF";
  const isDark = color.toLowerCase() === "#1a1a1a" || color.toLowerCase() === "#000000";
  const overlay = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)";

  return (
    <ImageBackground
      source={{ uri: invite.background }}
      style={[styles.canvas, rounded && styles.rounded]}
      imageStyle={rounded ? styles.rounded : undefined}
      testID="invite-canvas"
    >
      <View style={[styles.overlay, { backgroundColor: overlay }]} />
      <View style={styles.content}>
        {!!invite.host && (
          <Text style={[styles.host, { color }]} numberOfLines={1}>
            {invite.host}
          </Text>
        )}
        <Text style={[styles.title, { color }]}>{invite.title}</Text>
        {!!invite.message && (
          <Text style={[styles.message, { color }]}>{invite.message}</Text>
        )}
        <View style={styles.divider} />
        {!!invite.date && (
          <Text style={[styles.meta, { color }]} numberOfLines={1}>
            {invite.date}
          </Text>
        )}
        {!!invite.location && (
          <Text style={[styles.meta, { color }]} numberOfLines={2}>
            {invite.location}
          </Text>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: "100%",
    aspectRatio: 3 / 4,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "#EEE",
  },
  rounded: { borderRadius: 20 },
  overlay: { ...StyleSheet.absoluteFillObject },
  content: { padding: 28, alignItems: "center" },
  host: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    opacity: 0.9,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 32,
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  message: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 22,
    opacity: 0.95,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginVertical: 18,
  },
  meta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.95,
  },
});
