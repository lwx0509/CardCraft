# Invite Studio — PRD

## Overview
A React Native Expo mobile app that lets users craft custom event invitations from beautiful templates, customize text + colors + backgrounds, optionally import device images, get AI-generated wording, generate AI background images, and save/share the result.

## Architecture
- Expo Router (SDK 54) file-based routes
- FastAPI backend with two AI endpoints (Emergent Universal LLM Key)
- Local-only storage via `@/src/utils/storage` (AsyncStorage under the hood)

## Routes
- `/` — Home (categories + template gallery)
- `/editor` — Editor (template/id params, with text/background/color/font/AI tools)
- `/preview/[id]` — Preview, payment gate ($9.99), share & save once paid
- `/my-invites` — Saved invites list

## Backend Endpoints
- `GET /api/health`
- `POST /api/ai/suggest-text` (Gemini 2.5 Flash)
- `POST /api/ai/generate-background` (Gemini Nano Banana)
- `POST /api/payments/create-checkout-session` — creates Stripe Checkout session via Emergent proxy ($9.99 USD)
- `GET /api/payments/status/{invite_id}` — current paid status (Mongo `paid_invites` collection)
- `GET /api/payments/sync/{session_id}` — fallback to mark paid by querying Stripe directly
- `POST /api/webhooks/stripe` — webhook receiver (uses STRIPE_WEBHOOK_SECRET if configured)

## Editor capabilities
- Edit title, message, host, date, location
- Background: stock per category, device gallery, AI generate
- 8 text colors
- **Font picker** — Playfair Display, DM Serif Display, Dancing Script
- **Per-element drag** — title, message, and meta (date+location) blocks are independently draggable on the canvas (PanResponder + Animated, normalized −0.45..0.45 offsets persisted in `positions`)
- **Photo mosaic** — pick 2–4 device photos and arrange as: single, side-by-side (split_h), top/bottom (split_v), or 2×2 grid
- **Background image fit** — cover/contain toggle, zoom 1×–2.5×, X/Y nudge (with reset)
- AI suggest text + AI generate background

## Web / PWA

The Expo app builds to a polished web experience that is also installable as a Progressive Web App (no app store needed).

- **Responsive home**: 4-column gallery on desktop (≥1080px), 3 cols on tablet (≥768px), 2 cols on mobile. Content capped at max-width 1200 and centered.
- **Responsive preview**: 2-column layout (canvas left, side panel right) at ≥900px; single-column below.
- **Editor**: capped at 640px width and centered on desktop.
- **PWA manifest**: inlined as a `data:application/manifest+json` URI in `+html.tsx` (no static-file pipeline dependency) with `display: standalone`, theme color `#E26D5A`, background `#FAF9F6`, name "Invite Studio".
- **Service worker**: `/app/frontend/public/sw.js` (served at `/sw.js`) — network-first navigation handler, satisfies the browser's "installable PWA" criteria.
- **Install banner** (home): listens for `beforeinstallprompt` and shows an "Install" CTA; tapping triggers the native "Add to Home Screen" / "Install App" prompt — no app store visit required.
- **Web-native save/share** (preview): `navigator.share({ files: [...] })` when available, falls back to a plain `<a download>` link that downloads the PNG directly. Mobile builds continue to use `expo-sharing` + `expo-media-library`.

## Stripe configuration
- Test key `sk_test_emergent` from pod env, routed via `emergentintegrations.payments.stripe.checkout.StripeCheckout`, which proxies to `https://integrations.emergentagent.com/stripe`. No real card is charged.

## Smart business enhancement
Sharing the rendered PNG via the system share sheet maximizes organic reach — every shared invite is effectively a watermark-free marketing asset that drives recipients to the same app, enabling growth without paid acquisition. Future enhancement: optional "Made with Invite Studio" branding toggle to drive viral attribution.
