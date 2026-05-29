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
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showAttribution?: boolean;
};

export default function InviteCanvas({
  invite,
  rounded = true,
  draggable = false,
  onPositionChange,
  onDragStart,
  onDragEnd,
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
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
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
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
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
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
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
  onDragStart,
  onDragEnd,
  children,
  testID,
}: {
  size: { w: number; h: number };
  position: Position;
  draggable: boolean;
  onEnd: (p: Position) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
  testID?: string;
}) {
  const [ownSize, setOwnSize] = useState({ w: 0, h: 0 });

  // Pixel-level animated position driving the transform
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const startPx = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  // Refs that the long-lived PanResponder closure reads from. We MUST use refs
  // here instead of closure variables because the PanResponder is created once
  // (via useRef below) and would otherwise capture the stale initial values of
  // size / ownSize / position / draggable from the first render.
  const sizeRef = useRef(size);
  const ownSizeRef = useRef(ownSize);
  const positionRef = useRef(position);
  const draggableRef = useRef(draggable);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  useEffect(() => {
    ownSizeRef.current = ownSize;
  }, [ownSize]);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  useEffect(() => {
    draggableRef.current = draggable;
  }, [draggable]);
  useEffect(() => {
    onDragStartRef.current = onDragStart;
  }, [onDragStart]);
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  // Compute the pixel position from the latest props/measurements
  const computePx = () => {
    const s = sizeRef.current;
    const os = ownSizeRef.current;
    const p = positionRef.current;
    return {
      x: s.w / 2 + p.x * s.w - os.w / 2,
      y: s.h / 2 + p.y * s.h - os.h / 2,
    };
  };

  // Whenever the externally-controlled position/size changes (and we're not
  // actively dragging), snap the pan to the new computed pixel position.
  useEffect(() => {
    if (draggingRef.current) return;
    const px = computePx();
    pan.setValue(px);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, ownSize.w, ownSize.h, position.x, position.y]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggableRef.current,
      onStartShouldSetPanResponderCapture: () => draggableRef.current,
      onMoveShouldSetPanResponder: () => draggableRef.current,
      onMoveShouldSetPanResponderCapture: () => draggableRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        draggingRef.current = true;
        const px = computePx();
        startPx.current = px;
        pan.setValue(px);
        onDragStartRef.current?.();
      },
      onPanResponderMove: (_e, g) => {
        pan.setValue({
          x: startPx.current.x + g.dx,
          y: startPx.current.y + g.dy,
        });
      },
      onPanResponderRelease: (_e, g) => {
        draggingRef.current = false;
        const s = sizeRef.current;
        const os = ownSizeRef.current;
        const finalPxX = startPx.current.x + g.dx;
        const finalPxY = startPx.current.y + g.dy;
        const w = s.w || 1;
        const h = s.h || 1;
        const nx = Math.max(
          -0.45,
          Math.min(0.45, (finalPxX + os.w / 2 - w / 2) / w),
        );
        const ny = Math.max(
          -0.45,
          Math.min(0.45, (finalPxY + os.h / 2 - h / 2) / h),
        );
        pan.setValue({ x: finalPxX, y: finalPxY });
        onDragEndRef.current?.();
        onEndRef.current?.({ x: nx, y: ny });
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
        onDragEndRef.current?.();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      onLayout={(e) =>
        setOwnSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
      style={[
        styles.draggable,
        {
          opacity: ownSize.w > 0 ? 1 : 0,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
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
  const [bgSize, setBgSize] = useState({ w: 0, h: 0 });
  const layout = invite.mosaicLayout;
  const imgs = invite.mosaicImages || [];

  if (layout === "single" || imgs.length === 0) {
    const uri = invite.background || imgs[0];
    if (!uri) return <View style={styles.bgPlaceholder} />;
    return (
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(e) =>
          setBgSize({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        <Image
          source={{ uri }}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: (invite.bgOffsetX || 0) * bgSize.w },
                { translateY: (invite.bgOffsetY || 0) * bgSize.h },
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
    top: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 60,
    minHeight: 36,
    // Mouse cursor hint on web only — silently ignored on native
    // @ts-ignore
    cursor: "grab",
    // @ts-ignore
    userSelect: "none",
    // @ts-ignore
    touchAction: "none",
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
