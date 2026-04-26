"""
Voice Service Factory

Creates the appropriate voice service based on configuration.
Currently reads from environment variables, but can be extended
to read from user settings in the future.
"""
import os
from typing import Optional
from functools import lru_cache

from app.services.voice import BaseVoiceService, VoiceProvider


class VoiceServiceFactory:
    """
    Factory for creating voice service instances.
    
    Usage:
        # Get default provider from env
        service = VoiceServiceFactory.get_service()
        
        # Get specific provider
        service = VoiceServiceFactory.get_service(VoiceProvider.OPENAI)
        
        # Future: Get from user settings
        service = VoiceServiceFactory.get_service_for_user(user_id)
    """
    
    _instances: dict[str, BaseVoiceService] = {}
    
    @classmethod
    def get_service(
        cls,
        provider: Optional[VoiceProvider] = None,
        api_key: Optional[str] = None,
        **kwargs
    ) -> BaseVoiceService:
        """
        Get a voice service instance.
        
        Args:
            provider: Voice provider to use. If not specified, reads from
                     VOICE_PROVIDER env var, defaults to OpenAI.
            api_key: API key for the provider. If not specified, reads from
                    environment variables.
            **kwargs: Additional provider-specific options.
            
        Returns:
            Voice service instance
        """
        # Determine provider
        if provider is None:
            provider_str = os.getenv("VOICE_PROVIDER", "openai").lower()
            try:
                provider = VoiceProvider(provider_str)
            except ValueError:
                provider = VoiceProvider.OPENAI
        
        # Create instance based on provider
        if provider == VoiceProvider.OPENAI:
            return cls._get_openai_service(api_key, **kwargs)
        
        elif provider == VoiceProvider.AZURE:
            return cls._get_azure_service(api_key, **kwargs)
        
        elif provider == VoiceProvider.GOOGLE:
            return cls._get_google_service(api_key, **kwargs)
        
        elif provider == VoiceProvider.ELEVENLABS:
            return cls._get_elevenlabs_service(api_key, **kwargs)
        
        else:
            raise ValueError(f"Unsupported voice provider: {provider}")
    
    @classmethod
    def _get_openai_service(cls, api_key: Optional[str] = None, **kwargs) -> BaseVoiceService:
        """Get or create OpenAI voice service"""
        from app.services.voice.openai_voice_service import OpenAIVoiceService
        
        cache_key = f"openai:{api_key or 'default'}"
        
        if cache_key not in cls._instances:
            use_hd = kwargs.get("use_hd", os.getenv("OPENAI_TTS_HD", "false").lower() == "true")
            cls._instances[cache_key] = OpenAIVoiceService(
                api_key=api_key,
                use_hd=use_hd
            )
        
        return cls._instances[cache_key]
    
    @classmethod
    def _get_azure_service(cls, api_key: Optional[str] = None, **kwargs) -> BaseVoiceService:
        """Get or create Azure voice service"""
        # TODO: Implement Azure voice service
        raise NotImplementedError("Azure voice service not yet implemented")
    
    @classmethod
    def _get_google_service(cls, api_key: Optional[str] = None, **kwargs) -> BaseVoiceService:
        """Get or create Google voice service"""
        # TODO: Implement Google voice service
        raise NotImplementedError("Google voice service not yet implemented")
    
    @classmethod
    def _get_elevenlabs_service(cls, api_key: Optional[str] = None, **kwargs) -> BaseVoiceService:
        """Get or create ElevenLabs voice service"""
        # TODO: Implement ElevenLabs voice service
        raise NotImplementedError("ElevenLabs voice service not yet implemented")
    
    @classmethod
    def get_service_for_user(
        cls,
        user_id: str,
        workspace_id: Optional[str] = None
    ) -> BaseVoiceService:
        """
        Get voice service based on user settings.
        
        Future implementation will:
        1. Look up user's voice settings from database
        2. Get their preferred provider and API key
        3. Return configured service instance
        
        For now, falls back to environment configuration.
        
        Args:
            user_id: User ID to get settings for
            workspace_id: Optional workspace ID for workspace-level settings
            
        Returns:
            Configured voice service
        """
        # TODO: Implement user settings lookup
        # user_settings = UserSettingsRepository.get_voice_settings(user_id)
        # if user_settings:
        #     return cls.get_service(
        #         provider=user_settings.provider,
        #         api_key=user_settings.api_key
        #     )
        
        # Fall back to environment configuration
        return cls.get_service()
    
    @classmethod
    def clear_cache(cls):
        """Clear cached service instances"""
        cls._instances.clear()
    
    @classmethod
    def get_available_providers(cls) -> list[VoiceProvider]:
        """Get list of available/configured providers"""
        available = []
        
        # Check OpenAI
        if os.getenv("OPENAI_API_KEY"):
            available.append(VoiceProvider.OPENAI)
        
        # Check Azure
        if os.getenv("AZURE_SPEECH_KEY") and os.getenv("AZURE_SPEECH_REGION"):
            available.append(VoiceProvider.AZURE)
        
        # Check Google
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            available.append(VoiceProvider.GOOGLE)
        
        # Check ElevenLabs
        if os.getenv("ELEVENLABS_API_KEY"):
            available.append(VoiceProvider.ELEVENLABS)
        
        return available


# Convenience function
def get_voice_service(
    provider: Optional[VoiceProvider] = None,
    **kwargs
) -> BaseVoiceService:
    """
    Get a voice service instance.
    
    This is a convenience wrapper around VoiceServiceFactory.get_service().
    
    Example:
        service = get_voice_service()
        result = await service.transcribe(audio_data, "audio.mp3", "audio/mpeg")
    """
    return VoiceServiceFactory.get_service(provider, **kwargs)
