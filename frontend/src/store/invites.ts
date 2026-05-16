import { storage } from "@/src/utils/storage";
import { INVITES_STORAGE_KEY, type Invite } from "@/src/types/invite";

export async function loadInvites(): Promise<Invite[]> {
  const raw = await storage.getItem<string>(INVITES_STORAGE_KEY, "");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Invite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveInvites(invites: Invite[]): Promise<boolean> {
  return storage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites));
}

export async function upsertInvite(invite: Invite): Promise<Invite[]> {
  const all = await loadInvites();
  const idx = all.findIndex((i) => i.id === invite.id);
  if (idx >= 0) all[idx] = invite;
  else all.unshift(invite);
  await saveInvites(all);
  return all;
}

export async function deleteInvite(id: string): Promise<Invite[]> {
  const all = await loadInvites();
  const next = all.filter((i) => i.id !== id);
  await saveInvites(next);
  return next;
}

export async function getInvite(id: string): Promise<Invite | undefined> {
  const all = await loadInvites();
  return all.find((i) => i.id === id);
}

export function makeId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
