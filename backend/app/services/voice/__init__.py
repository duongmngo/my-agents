"""
Voice Service - Abstract Base Class and Provider Interface

This module defines the abstract interface for voice services (STT/TTS).
Concrete implementations for different providers (OpenAI, Azure, Google, etc.)
can be found in the providers/ directory.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List, AsyncIterator
from enum import Enum


class VoiceProvider(str, Enum):
    """Supported voice providers"""
    OPENAI = "openai"
    AZURE = "azure"
    GOOGLE = "google"
    ELEVENLABS = "elevenlabs"


@dataclass
class VoiceInfo:
    """Information about an available voice"""
    id: str
    name: str
    description: str
    language: Optional[str] = None
    gender: Optional[str] = None


@dataclass
class TranscriptionResult:
    """Result from speech-to-text transcription"""
    text: str
    language: Optional[str] = None
    duration: Optional[float] = None
    confidence: Optional[float] = None


@dataclass
class SynthesisOptions:
    """Options for text-to-speech synthesis"""
    voice: str = "nova"
    speed: float = 1.0
    pitch: Optional[float] = None
    format: str = "mp3"  # mp3, opus, aac, flac


class BaseVoiceService(ABC):
    """
    Abstract base class for voice services.
    
    All voice providers must implement this interface to ensure
    consistent behavior across different TTS/STT providers.
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of the provider"""
        pass
    
    @property
    @abstractmethod
    def supports_streaming(self) -> bool:
        """Whether this provider supports streaming TTS"""
        pass
    
    # ==================== Speech-to-Text (STT) ====================
    
    @abstractmethod
    async def transcribe(
        self,
        audio_data: bytes,
        filename: str,
        content_type: str,
        language: Optional[str] = None
    ) -> TranscriptionResult:
        """
        Transcribe audio to text.
        
        Args:
            audio_data: Raw audio bytes
            filename: Original filename (for format detection)
            content_type: MIME type of the audio
            language: Optional language code (e.g., "en", "vi")
            
        Returns:
            TranscriptionResult with transcribed text
        """
        pass
    
    # ==================== Text-to-Speech (TTS) ====================
    
    @abstractmethod
    async def synthesize(
        self,
        text: str,
        options: Optional[SynthesisOptions] = None
    ) -> bytes:
        """
        Convert text to speech audio.
        
        Args:
            text: Text to convert to speech
            options: Synthesis options (voice, speed, etc.)
            
        Returns:
            Audio data as bytes
        """
        pass
    
    @abstractmethod
    async def synthesize_stream(
        self,
        text: str,
        options: Optional[SynthesisOptions] = None
    ) -> AsyncIterator[bytes]:
        """
        Stream text to speech audio.
        
        Args:
            text: Text to convert to speech
            options: Synthesis options (voice, speed, etc.)
            
        Yields:
            Audio data chunks
        """
        pass
    
    # ==================== Voice Management ====================
    
    @abstractmethod
    async def list_voices(self, language: Optional[str] = None) -> List[VoiceInfo]:
        """
        List available voices.
        
        Args:
            language: Optional language filter
            
        Returns:
            List of available voices
        """
        pass
    
    @abstractmethod
    def get_default_voice(self) -> str:
        """Get the default voice ID for this provider"""
        pass
    
    # ==================== Validation ====================
    
    def validate_voice(self, voice_id: str) -> bool:
        """
        Validate if a voice ID is valid for this provider.
        Override in subclass for provider-specific validation.
        """
        return True
    
    def validate_text(self, text: str) -> bool:
        """
        Validate text for synthesis.
        Override in subclass for provider-specific limits.
        """
        if not text or not text.strip():
            return False
        # Most providers have a limit around 4096 characters
        if len(text) > 4096:
            return False
        return True
