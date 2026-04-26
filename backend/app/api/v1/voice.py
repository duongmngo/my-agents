"""
Voice API Endpoints

Provides Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities
using the configured voice provider (default: OpenAI).
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.voice import SynthesisOptions, VoiceInfo
from app.services.voice.voice_service_factory import get_voice_service, VoiceServiceFactory


router = APIRouter(tags=["voice"])


# ==================== Request/Response Models ====================

class SynthesizeRequest(BaseModel):
    """Request for text-to-speech synthesis"""
    text: str = Field(..., min_length=1, max_length=4096, description="Text to convert to speech")
    voice: str = Field(default="nova", description="Voice ID to use")
    speed: float = Field(default=1.0, ge=0.25, le=4.0, description="Speech speed multiplier")
    format: str = Field(default="mp3", description="Audio format: mp3, opus, aac, flac")


class TranscriptionResponse(BaseModel):
    """Response from speech-to-text transcription"""
    text: str
    language: Optional[str] = None


class VoiceResponse(BaseModel):
    """Voice information"""
    id: str
    name: str
    description: str
    language: Optional[str] = None
    gender: Optional[str] = None


class VoiceListResponse(BaseModel):
    """List of available voices"""
    voices: List[VoiceResponse]
    provider: str


class ProviderResponse(BaseModel):
    """Voice provider information"""
    provider: str
    supports_streaming: bool


# ==================== Endpoints ====================

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Convert speech to text using the configured voice provider.
    
    Supported audio formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
    
    - **audio**: Audio file to transcribe
    - **language**: Optional language code (e.g., "en", "vi", "ja")
    """
    try:
        # Get voice service (uses user settings in future, env vars for now)
        voice_service = get_voice_service()
        
        # Read audio content
        content = await audio.read()
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file is empty"
            )
        
        # Transcribe
        result = await voice_service.transcribe(
            audio_data=content,
            filename=audio.filename or "audio.webm",
            content_type=audio.content_type or "audio/webm",
            language=language
        )
        
        return TranscriptionResponse(
            text=result.text,
            language=result.language
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/synthesize")
async def synthesize_speech(
    request: SynthesizeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Convert text to speech using the configured voice provider.
    
    Returns audio data as an MP3 stream.
    
    - **text**: Text to convert to speech (max 4096 characters)
    - **voice**: Voice ID to use (default: nova)
    - **speed**: Speech speed multiplier (0.25 to 4.0, default: 1.0)
    - **format**: Audio format (mp3, opus, aac, flac)
    """
    try:
        voice_service = get_voice_service()
        
        # Create synthesis options
        options = SynthesisOptions(
            voice=request.voice,
            speed=request.speed,
            format=request.format
        )
        
        # Synthesize
        audio_data = await voice_service.synthesize(
            text=request.text,
            options=options
        )
        
        # Determine content type
        content_types = {
            "mp3": "audio/mpeg",
            "opus": "audio/opus",
            "aac": "audio/aac",
            "flac": "audio/flac"
        }
        content_type = content_types.get(request.format, "audio/mpeg")
        
        return StreamingResponse(
            iter([audio_data]),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename=speech.{request.format}"
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/voices", response_model=VoiceListResponse)
async def list_voices(
    language: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    List available voices for the configured provider.
    
    - **language**: Optional language filter
    """
    try:
        voice_service = get_voice_service()
        
        voices = await voice_service.list_voices(language=language)
        
        return VoiceListResponse(
            voices=[
                VoiceResponse(
                    id=v.id,
                    name=v.name,
                    description=v.description,
                    language=v.language,
                    gender=v.gender
                )
                for v in voices
            ],
            provider=voice_service.provider_name
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/provider", response_model=ProviderResponse)
async def get_provider_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get information about the current voice provider.
    """
    try:
        voice_service = get_voice_service()
        
        return ProviderResponse(
            provider=voice_service.provider_name,
            supports_streaming=voice_service.supports_streaming
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/providers")
async def list_available_providers(
    current_user: User = Depends(get_current_active_user)
):
    """
    List all available/configured voice providers.
    """
    providers = VoiceServiceFactory.get_available_providers()
    
    return {
        "providers": [p.value for p in providers],
        "current": get_voice_service().provider_name
    }
