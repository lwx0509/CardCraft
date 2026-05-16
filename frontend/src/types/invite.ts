import type { Category } from "@/src/constants/templates";

export type FontChoice = "playfair" | "dm_serif" | "dancing";

export const FONT_OPTIONS: { id: FontChoice; label: string; family: string }[] = [
  { id: "playfair", label: "Elegant", family: "PlayfairDisplay_700Bold" },
  { id: "dm_serif", label: "Modern", family: "DMSerifDisplay_400Regular" },
  { id: "dancing", label: "Handwritten", family: "DancingScript_700Bold" },
];

export type Invite = {
  id: string;
  category: Category;
  title: string;
  message: string;
  host: string;
  date: string;
  location: string;
  background: string;
  textColor: string;
  titleFont: FontChoice;
  // Normalized offsets (-1..1) for the text block position (0,0 = centered)
  textOffsetX: number;
  textOffsetY: number;
  // Cached paid state (synced from backend)
  paid: boolean;
  createdAt: number;
  updatedAt: number;
};

export const INVITES_STORAGE_KEY = "invite-maker:invites:v2";
