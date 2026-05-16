import React, { useRef } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  PanResponder,
  Animated,
} from "react-native";
import type { Invite } from "@/src/types/invite";
import { FONT_OPTIONS } from "@/src/types/invite";

type Props = {
  invite: Pick<
    Invite,
    | "title"
    | "message"
    | "host"
    | "date"
    | "location"
    | "background"
    | "textColor"
    | "titleFont"
    | "textOffsetX"
    | "textOffsetY"
    | "paid"
  >;
  rounded?: boolean;
  draggable?: boolean;
  onOffsetChange?: (x: number, y: number) => void;
  showAttribution?: boolean;
};

export default function InviteCanvas({
  invite,
  rounded = true,
  draggable = false,
  onOffsetChange,
  showAttribution = true,
}: Props) {
  const color = invite.textColor || "#FFFFFF";
  const isDark =
    color.toLowerCase() === "#1a1a1a" || color.toLowerCase() === "#000000";
  const overlay = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)";

  const fontFamily =
    FONT_OPTIONS.find((f) => f.id === invite.titleFont)?.family ||
    FONT_OPTIONS[0].family;

  // Drag state
  const startOffset = useRef({ x: invite.textOffsetX, y: invite.textOffsetY });
  const live = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const layout = useRef({ w: 1, h: 1 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggable,
      onMoveShouldSetPanResponder: (_e, g) =>
        draggable && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
      onPanResponderGrant: () => {
        startOffset.current = {
          x: invite.textOffsetX,
          y: invite.textOffsetY,
        };
      },
      onPanResponderMove: (_e, g) => {
        live.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_e, g) => {
        const w = layout.current.w || 1;
        const h = layout.current.h || 1;
        const nx = Math.max(
          -0.4,
          Math.min(0.4, startOffset.current.x + g.dx / w),
        );
        const ny = Math.max(
          -0.4,
          Math.min(0.4, startOffset.current.y + g.dy / h),
        );
        live.setValue({ x: 0, y: 0 });
        onOffsetChange?.(nx, ny);
      },
    }),
  ).current;

  return (
    <ImageBackground
      source={{ uri: invite.background }}
      style={[styles.canvas, rounded && styles.rounded]}
      imageStyle={rounded ? styles.rounded : undefined}
      onLayout={(e) => {
        layout.current = {
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        };
      }}
      testID="invite-canvas"
    >
      <View style={[styles.overlay, { backgroundColor: overlay }]} />
      <Animated.View
        {...(draggable ? pan.panHandlers : {})}
        style={[
          styles.contentWrap,
          {
            transform: [
              {
                translateX: Animated.add(
                  live.x,
                  new Animated.Value(invite.textOffsetX * (layout.current.w || 0)),
                ),
              },
              {
                translateY: Animated.add(
                  live.y,
                  new Animated.Value(invite.textOffsetY * (layout.current.h || 0)),
                ),
              },
            ],
          },
        ]}
        testID="invite-text-block"
      >
        <View style={styles.content}>
          {!!invite.host && (
            <Text style={[styles.host, { color }]} numberOfLines={1}>
              {invite.host}
            </Text>
          )}
          <Text style={[styles.title, { color, fontFamily }]}>
            {invite.title}
          </Text>
          {!!invite.message && (
            <Text style={[styles.message, { color }]}>{invite.message}</Text>
          )}
          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)" },
            ]}
          />
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
      </Animated.View>

      {showAttribution && (
        <View style={styles.attribution} testID="attribution-footer">
          <Text style={[styles.attributionText, { color }]}>
            Made with Invite Studio
          </Text>
        </View>
      )}
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
  contentWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
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
  divider: { width: 40, height: 1, marginVertical: 18 },
  meta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.95,
  },
  attribution: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  attributionText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.6,
  },
});
