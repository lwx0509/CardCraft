# Invite Studio — PRD

## Overview
A React Native Expo mobile app that lets users craft custom event invitations from beautiful templates, customize text + colors + backgrounds, optionally import device images, get AI-generated wording, generate AI background images, and save/share the result.

## Architecture
- Expo Router (SDK 54) file-based routes
- FastAPI backend with two AI endpoints (Emergent Universal LLM Key)
- Local-only storage via `@/src/utils/storage` (AsyncStorage under the hood)

## Routes
- `/` — Home (categories + template gallery)
- `/editor` — Editor (template/id params)
- `/preview/[id]` — Preview & share
- `/my-invites` — Saved invites list

## Backend Endpoints
- `GET /api/health` — health + key configured
- `POST /api/ai/suggest-text` — body: { category, event_name, host, date, location, tone } → { title, message } (Gemini 2.5 Flash, JSON-parsed)
- `POST /api/ai/generate-background` — body: { prompt, category } → { image_base64, mime_type } (Gemini Nano Banana / gemini-3.1-flash-image-preview)

## Categories
Wedding, Birthday, Baby Shower, Party, Corporate, Casual Meetup. Each has 3–4 curated Unsplash background templates and preset title/message.

## Editor capabilities
- Edit title, message, host, date, location
- Pick background from curated stock per category
- Switch category
- Import background from device gallery (expo-image-picker, stored as data URI)
- AI suggest text (uses event details as context)
- AI generate background (Nano Banana)
- Choose from 8 text colors

## Preview/Share
- Captures the canvas via react-native-view-shot
- Save to gallery via expo-media-library (asks permission first)
- Share via system share sheet (expo-sharing)

## Smart business enhancement
Sharing the rendered PNG via the system share sheet maximizes organic reach — every shared invite is effectively a watermark-free marketing asset that drives recipients to the same app, enabling growth without paid acquisition. Future enhancement: optional "Made with Invite Studio" branding toggle to drive viral attribution.
