/**
 * Voice Service
 * 
 * Provides Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities
 * using the backend voice API.
 */
import { apiClient } from '../api-client';

// ==================== Types ====================

export interface Voice {
  id: string;
  name: string;
  description: string;
  language?: string;
  gender?: string;
}

export interface VoiceListResponse {
  voices: Voice[];
  provider: string;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
}

export interface SynthesizeRequest {
  text: string;
  voice?: string;
  speed?: number;
  format?: string;
}

export interface ProviderInfo {
  provider: string;
  supportsStreaming: boolean;
}

export interface ProvidersResponse {
  providers: string[];
  current: string;
}

// ==================== Service ====================

// Get API base URL from environment or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class VoiceService {
  // Full URL for direct fetch calls
  private readonly baseUrl = `${API_BASE_URL}/api/v1/voice`;
  // Relative path for apiClient calls (apiClient already has baseURL)
  private readonly relativePath = '/api/v1/voice';

  /**
   * Transcribe audio to text (Speech-to-Text)
   * 
   * @param audioBlob - Audio blob to transcribe
   * @param language - Optional language code (e.g., "en", "vi")
   * @returns Transcribed text
   */
  async transcribe(audioBlob: Blob, language?: string): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Transcription failed' }));
      throw new Error(error.detail || 'Transcription failed');
    }

    const data: TranscriptionResponse = await response.json();
    return data.text;
  }

  /**
   * Synthesize text to speech (Text-to-Speech)
   * 
   * @param text - Text to convert to speech
   * @param voice - Voice ID to use (default: "nova")
   * @param speed - Speech speed (0.25 to 4.0, default: 1.0)
   * @returns Audio blob URL for playback
   */
  async synthesize(
    text: string,
    voice: string = 'nova',
    speed: number = 1.0
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        speed,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Synthesis failed' }));
      throw new Error(error.detail || 'Synthesis failed');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * Get list of available voices
   */
  async getVoices(language?: string): Promise<VoiceListResponse> {
    const params = language ? `?language=${language}` : '';
    return apiClient.get<VoiceListResponse>(`${this.relativePath}/voices${params}`);
  }

  /**
   * Get current voice provider info
   */
  async getProviderInfo(): Promise<ProviderInfo> {
    return apiClient.get<ProviderInfo>(`${this.relativePath}/provider`);
  }

  /**
   * Get list of available providers
   */
  async getAvailableProviders(): Promise<ProvidersResponse> {
    return apiClient.get<ProvidersResponse>(`${this.relativePath}/providers`);
  }
}

// Export singleton instance
export const voiceService = new VoiceService();

// Export default for convenience
export default voiceService;
