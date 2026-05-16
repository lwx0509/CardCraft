import type { Category } from "@/src/constants/templates";

export type Invite = {
  id: string;
  category: Category;
  title: string;
  message: string;
  host: string;
  date: string;
  location: string;
  // background can be a remote URL, a local file uri, or a data URI (base64)
  background: string;
  textColor: string;
  createdAt: number;
  updatedAt: number;
};

export const INVITES_STORAGE_KEY = "invite-maker:invites:v1";
