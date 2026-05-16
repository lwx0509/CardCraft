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
- **Font picker** — Playfair Display (elegant), DM Serif Display (modern), Dancing Script (handwritten)
- **Free-drag text positioning** on the canvas (PanResponder, normalized -0.4..0.4 offsets)
- AI suggest text + AI generate background

## Preview / Payment / Share
- Always-on "Made with Invite Studio" attribution footer on the rendered invite
- Free preview; locked banner shows "$9.99 to unlock save & share"
- Tap "Unlock for $9.99" → backend creates Stripe Checkout session → app opens it via `expo-web-browser` (or `window.location.href` on web) → on return app polls `/api/payments/sync/{session_id}` then `/api/payments/status/{invite_id}` → on `paid:true`, persists `paid` flag locally and unlocks Save/Share buttons.
- Save → `expo-media-library`. Share → `expo-sharing`.

## Stripe configuration
- Test key `sk_test_emergent` from pod env, routed via `emergentintegrations.payments.stripe.checkout.StripeCheckout`, which proxies to `https://integrations.emergentagent.com/stripe`. No real card is charged.

## Smart business enhancement
Sharing the rendered PNG via the system share sheet maximizes organic reach — every shared invite is effectively a watermark-free marketing asset that drives recipients to the same app, enabling growth without paid acquisition. Future enhancement: optional "Made with Invite Studio" branding toggle to drive viral attribution.
