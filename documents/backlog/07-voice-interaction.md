# Voice Interaction Feature

**Priority:** High  
**Status:** In Progress  
**Estimated Effort:** 2-3 days

## Overview

Enable voice input (Speech-to-Text) and voice output (Text-to-Speech) for chat interactions using OpenAI APIs. When users speak their message, the AI response will automatically be read aloud with low-latency sentence-level streaming.

---

## Technical Approach

### Architecture: Frontend-Driven TTS

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Voice Chat Flow                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. VOICE INPUT (STT)                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ 🎤 Record   │───▶│ POST /voice/│───▶│ Full text   │             │
│  │ Audio       │    │ transcribe  │    │ to chat     │             │
│  └─────────────┘    └─────────────┘    └──────┬──────┘             │
│                                               │                     │
│  2. AI RESPONSE (Existing WebSocket)          │                     │
│                                               ▼                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ WebSocket text chunks (unchanged)                             │  │
│  │   "Hello" → ", I" → " can" → " help" → "."                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│  3. VOICE OUTPUT (TTS)       │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Frontend Processing:                                          │  │
│  │                                                                │  │
│  │   Buffer chunks ──▶ Detect sentence end ──▶ POST /voice/      │  │
│  │                           │                  synthesize        │  │
│  │                           │                      │             │  │
│  │                           ▼                      ▼             │  │
│  │                    "Hello, I can help."    🔊 Play audio      │  │
│  │                                                                │  │
│  │   Continue buffering next sentence...                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Latency: ~1-2 seconds to first audio                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| STT Provider | OpenAI Whisper | Reuse existing API key |
| TTS Provider | OpenAI TTS | Reuse existing API key |
| TTS Model | tts-1 | Lower latency vs tts-1-hd |
| Streaming Strategy | Sentence-level | Balance latency & audio quality |
| TTS Location | Frontend-driven | No backend WebSocket changes needed |

### API Configuration

Uses existing environment variable:
```
OPENAI_API_KEY=... (already configured)
```

---

## API Endpoints

### POST /api/voice/transcribe

Convert audio to text using Whisper.

**Request:**
```
Content-Type: multipart/form-data
- audio: File (mp3, webm, wav, m4a)
```

**Response:**
```json
{
  "text": "Transcribed text here"
}
```

### POST /api/voice/synthesize

Convert text to speech.

**Request:**
```json
{
  "text": "Text to speak",
  "voice": "nova",
  "speed": 1.0
}
```

**Response:**
```
Content-Type: audio/mpeg
Body: Binary audio stream
```

### GET /api/voice/voices

List available TTS voices.

**Response:**
```json
{
  "voices": [
    { "id": "alloy", "name": "Alloy", "description": "Neutral" },
    { "id": "nova", "name": "Nova", "description": "Female" }
  ]
}
```

---

## Implementation Tasks

### Phase 1: Backend Voice APIs (3-4h) ✅

- [x] Create `backend/app/services/voice/__init__.py` - Abstract base class
- [x] Create `backend/app/services/voice/openai_voice_service.py` - OpenAI implementation
- [x] Create `backend/app/services/voice/voice_service_factory.py` - Factory for provider selection
- [x] Create `backend/app/api/v1/voice.py`
  - [x] POST `/api/v1/voice/transcribe` - Whisper STT
  - [x] POST `/api/v1/voice/synthesize` - OpenAI TTS
  - [x] GET `/api/v1/voice/voices` - List voices
  - [x] GET `/api/v1/voice/provider` - Get current provider info
  - [x] GET `/api/v1/voice/providers` - List available providers
- [x] Register router in `main.py`
- [ ] Test with Postman/curl

### Phase 2: Frontend Voice Service (2h) ✅

- [x] Create `services/voice-service/index.ts`
  - [x] `transcribe(audioBlob)` - Call STT API
  - [x] `synthesize(text, voice, speed)` - Call TTS API
  - [x] `getVoices()` - List voices

### Phase 3: Frontend Hooks (4h) ✅

- [x] Create `hooks/use-voice/use-microphone-recorder.ts`
  - [x] Start/stop recording
  - [x] Handle permissions
  - [x] Return audio blob
- [x] Create `hooks/use-voice/use-sentence-buffer.ts`
  - [x] Buffer text chunks
  - [x] Detect sentence boundaries
  - [x] Emit complete sentences
- [x] Create `hooks/use-voice/use-audio-queue.ts`
  - [x] Queue audio URLs
  - [x] Play sequentially
  - [x] Handle stop/clear
- [x] Create `hooks/use-voice/use-voice-chat.ts`
  - [x] Combine all hooks
  - [x] Track voice mode
  - [x] Auto-enable voice for voice input

### Phase 4: Frontend Components (3h) ✅

- [x] Create `components/voice/voice-input-button.tsx`
  - [x] Mic button with recording state
  - [x] Processing indicator
  - [x] Error handling
- [x] Create `components/voice/voice-controls.tsx`
  - [x] Voice on/off toggle
  - [x] Voice selector dropdown
  - [x] Speaking indicator
  - [x] Stop button

### Phase 5: Integration (2h) ✅

- [x] Integrate with existing chat component
  - [x] Add voice input button to chat input
  - [x] Add voice controls bar
  - [x] Connect streaming text to WebSocket tokens
  - [x] Connect flush to stream completion
- [ ] Test end-to-end flow

### Phase 6: Polish (2h)

- [x] Error handling (permissions, API failures)
- [x] Loading states
- [ ] Mobile browser testing
- [ ] Update documentation

---

## File Structure

```
backend/app/
├── api/v1/
│   └── voice.py                        # Voice API endpoints ✅
└── services/voice/
    ├── __init__.py                     # Abstract base class ✅
    ├── openai_voice_service.py         # OpenAI implementation ✅
    └── voice_service_factory.py        # Factory for provider selection ✅

frontend/src/
├── services/
│   └── voice-service/
│       └── index.ts                    # Voice service API client ✅
├── hooks/
│   └── use-voice/
│       ├── index.ts                    # Exports ✅
│       ├── use-microphone-recorder.ts  # MediaRecorder wrapper ✅
│       ├── use-sentence-buffer.ts      # Sentence detection ✅
│       ├── use-audio-queue.ts          # Audio playback queue ✅
│       └── use-voice-chat.ts           # Main integration hook ✅
└── components/
    └── voice/
        ├── index.ts                    # Exports ✅
        ├── voice-input-button.tsx      # Mic button component ✅
        └── voice-controls.tsx          # Voice controls component ✅
```

---

## Provider Abstraction

The voice service uses an abstract base class pattern for provider flexibility:

```python
# Abstract interface (app/services/voice/__init__.py)
class BaseVoiceService(ABC):
    @abstractmethod
    async def transcribe(audio_data, filename, content_type, language) -> TranscriptionResult
    
    @abstractmethod
    async def synthesize(text, options) -> bytes
    
    @abstractmethod
    async def list_voices(language) -> List[VoiceInfo]

# OpenAI implementation (app/services/voice/openai_voice_service.py)
class OpenAIVoiceService(BaseVoiceService):
    # Uses Whisper for STT, OpenAI TTS for speech

# Factory (app/services/voice/voice_service_factory.py)
service = VoiceServiceFactory.get_service()  # From env vars
service = VoiceServiceFactory.get_service_for_user(user_id)  # Future: from user settings
```

### Environment Variables

```bash
# Current provider
VOICE_PROVIDER=openai  # openai, azure, google, elevenlabs

# OpenAI (default)
OPENAI_API_KEY=sk-...
OPENAI_TTS_HD=false  # Use tts-1-hd for higher quality

# Azure (future)
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...

# ElevenLabs (future)
ELEVENLABS_API_KEY=...
```

---

## Implementation Progress

### Backend ✅ Completed
- [x] Abstract base class `BaseVoiceService`
- [x] `OpenAIVoiceService` implementation
- [x] `VoiceServiceFactory` for provider selection
- [x] Voice API router (`/api/v1/voice/*`)
- [x] Registered in `main.py`

### Frontend (Pending)
- [ ] Create `services/voice-service/index.ts`
- [ ] Create `useMicrophoneRecorder.ts`
- [ ] Create `useSentenceBuffer.ts`
- [ ] Create `useAudioQueue.ts`
- [ ] Create `useVoiceChat.ts`
- [ ] Create `VoiceInputButton.tsx`
- [ ] Create `VoiceControls.tsx`
- [ ] Integrate with chat component

---

## Voice Options

| Voice | Description | Best For |
|-------|-------------|----------|
| `alloy` | Neutral | General |
| `echo` | Male | Formal |
| `fable` | British | Storytelling |
| `onyx` | Deep male | Authority |
| `nova` | Female | Friendly (default) |
| `shimmer` | Soft female | Calm |

---

## Cost Estimation

| Service | Model | Price | Monthly Estimate |
|---------|-------|-------|------------------|
| STT | whisper-1 | $0.006/min | 500 min = $3 |
| TTS | tts-1 | $0.015/1K chars | 200K chars = $3 |
| **Total** | | | **~$6/month** |

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ |
| Audio playback | ✅ | ✅ | ✅ | ✅ |

---

## Success Criteria

- [ ] User can record voice and see transcription in chat input
- [ ] Voice messages trigger auto-play of AI response
- [ ] First audio plays within 2 seconds of AI starting response
- [ ] Audio plays smoothly without gaps between sentences
- [ ] User can stop playback at any time
- [ ] Works on desktop Chrome, Firefox, Safari
- [ ] Works on mobile Chrome, Safari

---

## Dependencies

- OpenAI API key (existing) ✅
- No additional infrastructure needed

---

## Related Documentation

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [Streaming Chat Feature](../features/streaming-chat/)
