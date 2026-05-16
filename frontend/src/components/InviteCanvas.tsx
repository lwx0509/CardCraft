import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import type { Invite, Position } from "@/src/types/invite";
import { FONT_OPTIONS } from "@/src/types/invite";

type Props = {
  invite: Invite;
  rounded?: boolean;
  draggable?: boolean;
  onPositionChange?: (key: keyof Invite["positions"], p: Position) => void;
  showAttribution?: boolean;
};

export default function InviteCanvas({
  invite,
  rounded = true,
  draggable = false,
  onPositionChange,
  showAttribution = true,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const color = invite.textColor || "#FFFFFF";
  const isDark =
    color.toLowerCase() === "#1a1a1a" || color.toLowerCase() === "#000000";
  const overlay = isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.30)";
  const fontFamily =
    FONT_OPTIONS.find((f) => f.id === invite.titleFont)?.family ||
    FONT_OPTIONS[0].family;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <View
      style={[styles.canvas, rounded && styles.rounded]}
      onLayout={onLayout}
      testID="invite-canvas"
    >
      <BackgroundLayer invite={invite} />
      <View style={[styles.overlay, { backgroundColor: overlay }]} />

      {!!invite.host && (
        <View style={styles.hostBar} pointerEvents="none">
          <Text style={[styles.host, { color }]} numberOfLines={1}>
            {invite.host}
          </Text>
        </View>
      )}

      <Draggable
        size={size}
        position={invite.positions.title}
        draggable={draggable && !!invite.title}
        onEnd={(p) => onPositionChange?.("title", p)}
        testID="text-title"
      >
        <Text
          style={[styles.title, { color, fontFamily }]}
          allowFontScaling={false}
        >
          {invite.title}
        </Text>
      </Draggable>

      <Draggable
        size={size}
        position={invite.positions.message}
        draggable={draggable && !!invite.message}
        onEnd={(p) => onPositionChange?.("message", p)}
        testID="text-message"
      >
        <Text style={[styles.message, { color }]} allowFontScaling={false}>
          {invite.message}
        </Text>
      </Draggable>

      <Draggable
        size={size}
        position={invite.positions.meta}
        draggable={draggable && (!!invite.date || !!invite.location)}
        onEnd={(p) => onPositionChange?.("meta", p)}
        testID="text-meta"
      >
        <View style={styles.metaWrap}>
          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark
                  ? "rgba(0,0,0,0.4)"
                  : "rgba(255,255,255,0.6)",
              },
            ]}
          />
          {!!invite.date && (
            <Text style={[styles.meta, { color }]} allowFontScaling={false}>
              {invite.date}
            </Text>
          )}
          {!!invite.location && (
            <Text style={[styles.meta, { color }]} allowFontScaling={false}>
              {invite.location}
            </Text>
          )}
        </View>
      </Draggable>

      {showAttribution && (
        <View style={styles.attribution} pointerEvents="none" testID="attribution-footer">
          <Text style={[styles.attributionText, { color }]}>
            Made with Invite Studio
          </Text>
        </View>
      )}
    </View>
  );
}

function Draggable({
  size,
  position,
  draggable,
  onEnd,
  children,
  testID,
}: {
  size: { w: number; h: number };
  position: Position;
  draggable: boolean;
  onEnd: (p: Position) => void;
  children: React.ReactNode;
  testID?: string;
}) {
  // Stored position (committed)
  const stored = useRef(position);
  useEffect(() => {
    stored.current = position;
  }, [position]);

  // Animated value for live drag delta
  const delta = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggable,
      onMoveShouldSetPanResponder: (_e, g) =>
        draggable && (Math.abs(g.dx) > 1 || Math.abs(g.dy) > 1),
      onPanResponderGrant: () => {
        delta.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: delta.x, dy: delta.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, g) => {
        const w = size.w || 1;
        const h = size.h || 1;
        const nx = Math.max(
          -0.45,
          Math.min(0.45, stored.current.x + g.dx / w),
        );
        const ny = Math.max(
          -0.45,
          Math.min(0.45, stored.current.y + g.dy / h),
        );
        delta.setValue({ x: 0, y: 0 });
        onEnd({ x: nx, y: ny });
      },
    }),
  ).current;

  const baseX = position.x * size.w;
  const baseY = position.y * size.h;

  return (
    <Animated.View
      {...(draggable ? panResponder.panHandlers : {})}
      style={[
        styles.draggable,
        {
          transform: [
            { translateX: Animated.add(delta.x, baseX) },
            { translateY: Animated.add(delta.y, baseY) },
          ],
        },
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}

function BackgroundLayer({ invite }: { invite: Invite }) {
  const layout = invite.mosaicLayout;
  const imgs = invite.mosaicImages || [];

  if (layout === "single" || imgs.length === 0) {
    const uri = invite.background || imgs[0];
    if (!uri) return <View style={styles.bgPlaceholder} />;
    return (
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri }}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: (invite.bgOffsetX || 0) * 200 },
                { translateY: (invite.bgOffsetY || 0) * 200 },
                { scale: invite.bgZoom || 1 },
              ],
            },
          ]}
          resizeMode={invite.bgFit || "cover"}
        />
      </View>
    );
  }

  if (layout === "split_h") {
    return (
      <View style={[StyleSheet.absoluteFill, styles.row]}>
        {imgs.slice(0, 2).map((u, i) => (
          <Image key={i} source={{ uri: u }} style={styles.tile} resizeMode="cover" />
        ))}
      </View>
    );
  }
  if (layout === "split_v") {
    return (
      <View style={[StyleSheet.absoluteFill, styles.col]}>
        {imgs.slice(0, 2).map((u, i) => (
          <Image key={i} source={{ uri: u }} style={styles.tile} resizeMode="cover" />
        ))}
      </View>
    );
  }
  // grid_2x2
  const four = [...imgs];
  while (four.length < 4) four.push(four[0] || "");
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.row, { flex: 1 }]}>
        <Image source={{ uri: four[0] }} style={styles.tile} resizeMode="cover" />
        <Image source={{ uri: four[1] }} style={styles.tile} resizeMode="cover" />
      </View>
      <View style={[styles.row, { flex: 1 }]}>
        <Image source={{ uri: four[2] }} style={styles.tile} resizeMode="cover" />
        <Image source={{ uri: four[3] }} style={styles.tile} resizeMode="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: "100%",
    aspectRatio: 3 / 4,
    overflow: "hidden",
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
  },
  rounded: { borderRadius: 20 },
  overlay: { ...StyleSheet.absoluteFillObject },
  bgPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: "#E5E7EB" },
  row: { flex: 1, flexDirection: "row" },
  col: { flex: 1, flexDirection: "column" },
  tile: { flex: 1, width: undefined, height: undefined },
  hostBar: {
    position: "absolute",
    top: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  host: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.9,
  },
  draggable: {
    position: "absolute",
    paddingHorizontal: 16,
    alignItems: "center",
    maxWidth: "90%",
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
    lineHeight: 22,
    opacity: 0.95,
  },
  metaWrap: { alignItems: "center" },
  divider: { width: 40, height: 1, marginBottom: 10 },
  meta: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
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
