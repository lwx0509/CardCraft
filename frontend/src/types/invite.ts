import type { Category } from "@/src/constants/templates";

export type FontChoice = "playfair" | "dm_serif" | "dancing";

export const FONT_OPTIONS: { id: FontChoice; label: string; family: string }[] = [
  { id: "playfair", label: "Elegant", family: "PlayfairDisplay_700Bold" },
  { id: "dm_serif", label: "Modern", family: "DMSerifDisplay_400Regular" },
  { id: "dancing", label: "Handwritten", family: "DancingScript_700Bold" },
];

export type Position = { x: number; y: number }; // normalized offsets, -0.45..0.45

export type MosaicLayout = "single" | "split_h" | "split_v" | "grid_2x2";

export const MOSAIC_LAYOUTS: { id: MosaicLayout; label: string; slots: number }[] = [
  { id: "single", label: "Single", slots: 1 },
  { id: "split_h", label: "Side by side", slots: 2 },
  { id: "split_v", label: "Top & bottom", slots: 2 },
  { id: "grid_2x2", label: "2 × 2 grid", slots: 4 },
];

export type BgFit = "cover" | "contain";

export type Invite = {
  id: string;
  category: Category;
  title: string;
  message: string;
  host: string;
  date: string;
  location: string;
  // Primary single background (used when mosaicLayout === 'single')
  background: string;
  // Mosaic background images (used when mosaicLayout !== 'single')
  mosaicImages: string[];
  mosaicLayout: MosaicLayout;
  // Image fit controls (applied to single background)
  bgFit: BgFit;
  bgZoom: number; // 1.0 .. 2.5
  bgOffsetX: number; // -0.5 .. 0.5
  bgOffsetY: number; // -0.5 .. 0.5
  textColor: string;
  titleFont: FontChoice;
  // Per-element positions
  positions: {
    title: Position;
    message: Position;
    meta: Position;
  };
  paid: boolean;
  createdAt: number;
  updatedAt: number;
};

export const INVITES_STORAGE_KEY = "invite-maker:invites:v3";

export function defaultPositions(): Invite["positions"] {
  return {
    title: { x: 0, y: -0.05 },
    message: { x: 0, y: 0.08 },
    meta: { x: 0, y: 0.28 },
  };
}
