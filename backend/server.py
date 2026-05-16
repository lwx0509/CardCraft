from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class SuggestTextRequest(BaseModel):
    category: str = Field(..., description="Event category, e.g. wedding, birthday")
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


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Invite Maker API"}


@api_router.get("/health")
async def health():
    return {"status": "ok", "llm_key_configured": bool(EMERGENT_LLM_KEY)}


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


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)
