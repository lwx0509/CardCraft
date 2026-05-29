from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime, timezone

import stripe
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
INVITE_PRICE_USD = 9.99

stripe_checkout: Optional[StripeCheckout] = None
if STRIPE_API_KEY:
    stripe_checkout = StripeCheckout(
        api_key=STRIPE_API_KEY,
        webhook_secret=STRIPE_WEBHOOK_SECRET or None,
    )

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Mongo
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- AI Models ----------
class SuggestTextRequest(BaseModel):
    category: str
    event_name: Optional[str] = ""
    host: Optional[str] = ""
    date: Optional[str] = ""
    location: Optional[str] = ""
    tone: Optional[str] = "warm"


class SuggestTextResponse(BaseModel):
    title: str
    message: str


class GenerateBackgroundRequest(BaseModel):
    prompt: str
    category: Optional[str] = ""


class GenerateBackgroundResponse(BaseModel):
    image_base64: str
    mime_type: str


# ---------- Payment Models ----------
class CreateSessionRequest(BaseModel):
    invite_id: str
    success_url: str = Field(..., description="Frontend URL to redirect on success")
    cancel_url: str = Field(..., description="Frontend URL to redirect on cancel")


class CreateSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class PaymentStatusResponse(BaseModel):
    invite_id: str
    paid: bool
    status: str
    session_id: Optional[str] = None


# ---------- Share Models ----------
class ShareInviteRequest(BaseModel):
    invite_id: str
    payload: dict  # arbitrary invite JSON (positions, background, etc.)


class ShareInviteResponse(BaseModel):
    share_id: str
    url: str


class GetInviteResponse(BaseModel):
    invite_id: str
    payload: dict


# ---------- AI Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Invite Maker API"}


@api_router.get("/health")
async def health():
    return {
        "status": "ok",
        "llm_key_configured": bool(EMERGENT_LLM_KEY),
        "stripe_configured": bool(stripe_checkout),
    }


@api_router.post("/ai/suggest-text", response_model=SuggestTextResponse)
async def suggest_text(req: SuggestTextRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    system = (
        "You write short, beautiful event invitation copy. "
        "Always respond as a strict JSON object with exactly two keys: "
        "'title' (max 6 words, evocative) and 'message' (max 30 words, "
        "warm and clear). No markdown, no extra commentary."
    )

    user_text = (
        f"Event category: {req.category}\n"
        f"Event name: {req.event_name or 'n/a'}\n"
        f"Host: {req.host or 'n/a'}\n"
        f"Date: {req.date or 'n/a'}\n"
        f"Location: {req.location or 'n/a'}\n"
        f"Desired tone: {req.tone or 'warm'}\n\n"
        "Return JSON only."
    )

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"suggest-{uuid.uuid4()}",
            system_message=system,
        ).with_model("gemini", "gemini-2.5-flash")

        raw = await chat.send_message(UserMessage(text=user_text))

        import json
        import re
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(0)
        data = json.loads(cleaned)
        return SuggestTextResponse(
            title=str(data.get("title", "")).strip(),
            message=str(data.get("message", "")).strip(),
        )
    except Exception as e:
        logger.error(f"suggest_text error: {e}")
        raise HTTPException(status_code=500, detail=f"AI suggestion failed: {str(e)}")


@api_router.post("/ai/generate-background", response_model=GenerateBackgroundResponse)
async def generate_background(req: GenerateBackgroundRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    enhanced_prompt = (
        f"A beautiful background image for an event invitation. "
        f"Category: {req.category or 'celebration'}. "
        f"Style: tasteful, soft, with subtle textures, room for overlay text in the center. "
        f"Concept: {req.prompt}. "
        f"Aspect ratio portrait, no text in the image."
    )

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"bg-{uuid.uuid4()}",
            system_message="You generate invitation background images.",
        ).with_model(
            "gemini", "gemini-3.1-flash-image-preview"
        ).with_params(modalities=["image", "text"])

        _text, images = await chat.send_message_multimodal_response(
            UserMessage(text=enhanced_prompt)
        )

        if not images:
            raise HTTPException(status_code=502, detail="No image returned by model")

        img = images[0]
        return GenerateBackgroundResponse(
            image_base64=img["data"],
            mime_type=img.get("mime_type", "image/png"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"generate_background error: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


# ---------- Payment Routes ----------
async def _mark_paid(invite_id: str, session_id: str) -> None:
    await db.paid_invites.update_one(
        {"invite_id": invite_id},
        {
            "$set": {
                "invite_id": invite_id,
                "status": "paid",
                "session_id": session_id,
                "paid_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        upsert=True,
    )


@api_router.post("/payments/create-checkout-session", response_model=CreateSessionResponse)
async def create_checkout_session(req: CreateSessionRequest):
    if not stripe_checkout:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    existing = await db.paid_invites.find_one({"invite_id": req.invite_id})
    if existing and existing.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Invite already paid")

    sep = "&" if "?" in req.success_url else "?"
    success_url = (
        f"{req.success_url}{sep}session_id={{CHECKOUT_SESSION_ID}}"
        f"&invite_id={req.invite_id}"
    )

    try:
        session = await stripe_checkout.create_checkout_session(
            CheckoutSessionRequest(
                amount=INVITE_PRICE_USD,
                currency="usd",
                success_url=success_url,
                cancel_url=req.cancel_url,
                metadata={"invite_id": req.invite_id},
            )
        )
        await db.paid_invites.update_one(
            {"invite_id": req.invite_id},
            {
                "$set": {
                    "invite_id": req.invite_id,
                    "status": "pending",
                    "session_id": session.session_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            },
            upsert=True,
        )
        return CreateSessionResponse(checkout_url=session.url, session_id=session.session_id)
    except Exception as e:
        logger.error(f"create_checkout_session error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/payments/status/{invite_id}", response_model=PaymentStatusResponse)
async def payment_status(invite_id: str):
    doc = await db.paid_invites.find_one({"invite_id": invite_id}, {"_id": 0})
    if not doc:
        return PaymentStatusResponse(invite_id=invite_id, paid=False, status="unpaid")
    return PaymentStatusResponse(
        invite_id=invite_id,
        paid=doc.get("status") == "paid",
        status=doc.get("status", "unpaid"),
        session_id=doc.get("session_id"),
    )


@api_router.get("/payments/sync/{session_id}", response_model=PaymentStatusResponse)
async def sync_session(session_id: str):
    if not stripe_checkout:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    invite_id = (status.metadata or {}).get("invite_id")
    if not invite_id:
        raise HTTPException(status_code=400, detail="Session missing invite_id metadata")

    if status.payment_status == "paid":
        await _mark_paid(invite_id, session_id)
        return PaymentStatusResponse(
            invite_id=invite_id, paid=True, status="paid", session_id=session_id
        )
    return PaymentStatusResponse(
        invite_id=invite_id,
        paid=False,
        status=status.payment_status or "pending",
        session_id=session_id,
    )


@api_router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    if not stripe_checkout:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = await stripe_checkout.handle_webhook(payload, sig)
    except Exception as e:
        logger.error(f"webhook error: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event.event_type == "checkout.session.completed" and event.payment_status == "paid":
        invite_id = (event.metadata or {}).get("invite_id")
        if invite_id:
            await _mark_paid(invite_id, event.session_id or "")
    return {"received": True}


@api_router.post("/invites/share", response_model=ShareInviteResponse)
async def share_invite(req: ShareInviteRequest, request: Request):
    share_id = req.invite_id or f"inv_{uuid.uuid4().hex[:10]}"
    await db.shared_invites.update_one(
        {"share_id": share_id},
        {
            "$set": {
                "share_id": share_id,
                "payload": req.payload,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        upsert=True,
    )
    # Build absolute URL from the incoming request so the user can paste it
    origin = str(request.base_url).rstrip("/")
    # Replace the backend host with the public frontend host (preview ingress
    # serves frontend at "/" and backend at "/api/*" through the same host).
    url = f"{origin}/editor?id={share_id}"
    return ShareInviteResponse(share_id=share_id, url=url)


@api_router.get("/invites/share/{share_id}", response_model=GetInviteResponse)
async def get_shared_invite(share_id: str):
    doc = await db.shared_invites.find_one({"share_id": share_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invite not found")
    return GetInviteResponse(invite_id=share_id, payload=doc.get("payload", {}))


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
