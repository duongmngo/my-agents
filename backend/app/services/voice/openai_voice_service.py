"""
OpenAI Voice Service Implementation

Implements STT using Whisper and TTS using OpenAI's text-to-speech API.
"""
import os
from typing import Optional, List, AsyncIterator
from openai import OpenAI, AsyncOpenAI

from app.services.voice import (
    BaseVoiceService,
    VoiceInfo,
    TranscriptionResult,
    SynthesisOptions,
)


class OpenAIVoiceService(BaseVoiceService):
    """
    OpenAI implementation of the voice service.
    
    Uses:
    - Whisper for Speech-to-Text
    - OpenAI TTS for Text-to-Speech
    """
    
    # Available OpenAI TTS voices
    VOICES = [
        VoiceInfo(id="alloy", name="Alloy", description="Neutral", gender="neutral"),
        VoiceInfo(id="echo", name="Echo", description="Male", gender="male"),
        VoiceInfo(id="fable", name="Fable", description="British", gender="neutral"),
        VoiceInfo(id="onyx", name="Onyx", description="Deep male", gender="male"),
        VoiceInfo(id="nova", name="Nova", description="Female", gender="female"),
        VoiceInfo(id="shimmer", name="Shimmer", description="Soft female", gender="female"),
    ]
    
    VALID_VOICE_IDS = {v.id for v in VOICES}
    
    # TTS models
    TTS_MODEL_STANDARD = "tts-1"        # Faster, lower quality
    TTS_MODEL_HD = "tts-1-hd"           # Slower, higher quality
    
    # STT model
    STT_MODEL = "whisper-1"
    
    def __init__(self, api_key: Optional[str] = None, use_hd: bool = False):
        """
        Initialize OpenAI voice service.
        
        Args:
            api_key: OpenAI API key. If not provided, uses OPENAI_API_KEY env var.
            use_hd: Whether to use HD TTS model (higher quality, more latency)
        """
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self._api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
        
        self._client = OpenAI(api_key=self._api_key)
        self._async_client = AsyncOpenAI(api_key=self._api_key)
        self._tts_model = self.TTS_MODEL_HD if use_hd else self.TTS_MODEL_STANDARD
        self._default_voice = "nova"
    
    @property
    def provider_name(self) -> str:
        return "openai"
    
    @property
    def supports_streaming(self) -> bool:
        return True
    
    # ==================== Speech-to-Text (STT) ====================
    
    async def transcribe(
        self,
        audio_data: bytes,
        filename: str,
        content_type: str,
        language: Optional[str] = None
    ) -> TranscriptionResult:
        """
        Transcribe audio using OpenAI Whisper.
        
        Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
        """
        try:
            # Create file tuple for OpenAI API
            file_tuple = (filename, audio_data, content_type)
            
            # Call Whisper API (using sync client since openai library handles it)
            # Build kwargs for the API call
            kwargs = {
                "model": self.STT_MODEL,
                "file": file_tuple,
            }
            
            # Only add language if provided (None causes issues)
            if language:
                kwargs["language"] = language
            
            transcript = self._client.audio.transcriptions.create(**kwargs)
            
            return TranscriptionResult(
                text=transcript.text,
                language=language,
            )
            
        except Exception as e:
            raise RuntimeError(f"OpenAI transcription failed: {str(e)}") from e
    
    # ==================== Text-to-Speech (TTS) ====================
    
    async def synthesize(
        self,
        text: str,
        options: Optional[SynthesisOptions] = None
    ) -> bytes:
        """
        Convert text to speech using OpenAI TTS.
        
        Returns MP3 audio data.
        """
        if not self.validate_text(text):
            raise ValueError("Invalid text for synthesis")
        
        opts = options or SynthesisOptions()
        voice = opts.voice if self.validate_voice(opts.voice) else self._default_voice
        
        try:
            response = self._client.audio.speech.create(
                model=self._tts_model,
                voice=voice,
                input=text,
                speed=opts.speed,
                response_format=opts.format,
            )
            
            return response.content
            
        except Exception as e:
            raise RuntimeError(f"OpenAI TTS failed: {str(e)}") from e
    
    async def synthesize_stream(
        self,
        text: str,
        options: Optional[SynthesisOptions] = None
    ) -> AsyncIterator[bytes]:
        """
        Stream text to speech using OpenAI TTS.
        
        Yields audio chunks as they become available.
        """
        if not self.validate_text(text):
            raise ValueError("Invalid text for synthesis")
        
        opts = options or SynthesisOptions()
        voice = opts.voice if self.validate_voice(opts.voice) else self._default_voice
        
        try:
            response = self._client.audio.speech.create(
                model=self._tts_model,
                voice=voice,
                input=text,
                speed=opts.speed,
                response_format=opts.format,
            )
            
            # Stream the response
            for chunk in response.iter_bytes(chunk_size=4096):
                yield chunk
                
        except Exception as e:
            raise RuntimeError(f"OpenAI TTS streaming failed: {str(e)}") from e
    
    # ==================== Voice Management ====================
    
    async def list_voices(self, language: Optional[str] = None) -> List[VoiceInfo]:
        """
        List available OpenAI TTS voices.
        
        Note: OpenAI voices are language-agnostic and work with multiple languages.
        """
        # OpenAI voices work for all languages, so we ignore the language filter
        return self.VOICES.copy()
    
    def get_default_voice(self) -> str:
        return self._default_voice
    
    def validate_voice(self, voice_id: str) -> bool:
        return voice_id in self.VALID_VOICE_IDS
    
    def validate_text(self, text: str) -> bool:
        """Validate text for OpenAI TTS (max 4096 chars)"""
        if not text or not text.strip():
            return False
        if len(text) > 4096:
            return False
        return True
    
    # ==================== Configuration ====================
    
    def set_hd_mode(self, enabled: bool):
        """Switch between standard and HD TTS models"""
        self._tts_model = self.TTS_MODEL_HD if enabled else self.TTS_MODEL_STANDARD
    
    def set_default_voice(self, voice_id: str):
        """Set the default voice for TTS"""
        if self.validate_voice(voice_id):
            self._default_voice = voice_id
        else:
            raise ValueError(f"Invalid voice ID: {voice_id}")
