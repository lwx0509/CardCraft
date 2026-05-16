const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type SuggestTextPayload = {
  category: string;
  event_name?: string;
  host?: string;
  date?: string;
  location?: string;
  tone?: string;
};

export type SuggestTextResponse = { title: string; message: string };

export async function suggestText(
  payload: SuggestTextPayload,
): Promise<SuggestTextResponse> {
  const res = await fetch(`${BASE}/api/ai/suggest-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`suggest-text failed: ${res.status} ${t}`);
  }
  return res.json();
}

export type GenerateBgResponse = { image_base64: string; mime_type: string };

export async function generateBackground(
  prompt: string,
  category: string,
): Promise<GenerateBgResponse> {
  const res = await fetch(`${BASE}/api/ai/generate-background`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, category }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`generate-background failed: ${res.status} ${t}`);
  }
  return res.json();
}
