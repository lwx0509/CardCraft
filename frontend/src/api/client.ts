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

// ---------- Payments ----------
export type CreateSessionResponse = {
  checkout_url: string;
  session_id: string;
};

export async function createCheckoutSession(args: {
  invite_id: string;
  success_url: string;
  cancel_url: string;
}): Promise<CreateSessionResponse> {
  const res = await fetch(`${BASE}/api/payments/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`create-session failed: ${res.status} ${t}`);
  }
  return res.json();
}

export type PaymentStatus = {
  invite_id: string;
  paid: boolean;
  status: string;
  session_id?: string;
};

export async function getPaymentStatus(invite_id: string): Promise<PaymentStatus> {
  const res = await fetch(`${BASE}/api/payments/status/${encodeURIComponent(invite_id)}`);
  if (!res.ok) throw new Error(`status failed: ${res.status}`);
  return res.json();
}

export async function syncSession(session_id: string): Promise<PaymentStatus> {
  const res = await fetch(`${BASE}/api/payments/sync/${encodeURIComponent(session_id)}`);
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
  return res.json();
}
