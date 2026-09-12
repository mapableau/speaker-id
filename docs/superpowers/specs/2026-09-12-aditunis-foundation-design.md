# Aditunis Foundation Design

**Status:** Approved design, pre-implementation

**Branch:** `feature/aditunis-foundation`

**Purpose:** Define the first implementation boundary for Aditunis, an accessibility-first multimodal communication engine that can support personalised atypical-speech recognition, target-speaker gating, sign-to-speech, AAC/text input, speech synthesis and telephony/media transport while keeping the person in control of the final message.

## 1. Product outcome

The first release is not a general speech AI, interpreter replacement, biometric identity system or emergency calling product. It is a bounded communication runtime proving that an accessibility-oriented client can accept a communication hypothesis from a modality adapter, surface uncertainty, let the user confirm or edit the message, synthesize the chosen text, and send that audio through a Twilio-compatible media abstraction.

The architecture must remain usable by people who communicate through atypical speech, sign language, AAC, typing or combinations of these modes. Model confidence never overrides the user's authority over what is communicated.

## 2. Source projects and provenance

Aditunis will use three existing repositories as research/upstream sources rather than merging their codebases wholesale.

### `mapableau/speaker-id`

Primary reusable concepts:

- speaker embeddings / d-vectors;
- Personal VAD / speaker-conditioned voice activity detection;
- diarization and speaker/language research utilities where useful.

Aditunis must not use speaker recognition as authentication or covert identity inference. In the product architecture, speaker-conditioned processing means only: identify whether incoming speech matches the participant-selected target-speaker profile sufficiently to gate or prioritize that audio for communication recognition.

### `google/project-euphonia-audiotool`

Treat as historical/reference material for speech-data collection. It must not define the new application architecture.

### `google/project-euphonia-app`

Primary reference for personalised atypical-speech workflows:

- consented phrase/audio collection;
- open-source ASR fine-tuning;
- Whisper/Faster-Whisper inference examples;
- model deployment patterns;
- personalised transcription evaluation.

Google-derived code and documentation must retain licence/provenance notices where adapted.

## 3. Repository boundary

Long-term target: a dedicated Aditunis repository/application boundary.

During incubation, new Aditunis work may live under a contained `aditunis/` subtree on `feature/aditunis-foundation` in `mapableau/speaker-id`. Existing Google-derived research code is not to be reorganised or rewritten simply to fit the new application.

Proposed incubation structure:

```text
aditunis/
  apps/
    web/
  packages/
    communication-core/
    audio-codecs/
    media-bridge/
    accessibility/
    model-contracts/
  services/
    inference/
    temporal-worker/
  adapters/
    personal-vad/
    euphonia-asr/
    twilio-media/
  docs/
    architecture/
    privacy/
    model-cards/
```

This structure may be adjusted only where direct repository inspection shows a materially better existing convention.

## 4. Core communication model

All input modalities produce a common hypothesis rather than directly speaking or calling external systems.

```typescript
export type CommunicationModality =
  | "personal-speech"
  | "sign"
  | "aac"
  | "typed-text";

export interface CommunicationAlternative {
  text: string;
  confidence: number;
}

export interface CommunicationHypothesis {
  modality: CommunicationModality;
  text: string;
  confidence: number;
  alternatives: CommunicationAlternative[];
  modelId: string;
  modelVersion: string;
  requiresConfirmation: boolean;
}
```

The MVP always sets `requiresConfirmation: true` for model-generated speech or sign hypotheses.

A separate participant-controlled draft state holds the message the user may edit and confirm.

## 5. Accessibility interaction model

The UI must meet WCAG 2.2 AA at minimum and must treat communication timing as configurable rather than assume typical movement or speech timing.

MVP requirements:

- keyboard-only operation;
- screen-reader names, roles, states and live status announcements;
- visible focus;
- large targets;
- 200% zoom/reflow support;
- no colour-only state;
- reduced-motion support;
- accessible microphone and camera permission errors;
- explicit Start, Stop, Edit, Confirm, Speak, Retry and Clear controls;
- configurable pause/end-of-utterance behaviour;
- no automatic speaking of low-confidence or uncertain model output;
- non-AI/manual typing fallback available at all times.

No disability diagnosis is required to configure communication preferences.

## 6. Personal Speech Adapter

The first real model adapter will be based on patterns from `google/project-euphonia-app`.

Contract:

```typescript
export interface PersonalSpeechAdapter {
  transcribe(input: AudioChunkStream, profile: SpeechProfile): Promise<CommunicationHypothesis>;
}
```

Initial implementation may use a mock adapter for end-to-end architecture tests, followed by a separate task that wraps a personalised Whisper/Faster-Whisper inference service.

The inference service must expose model identity/version and must not silently fall back to a different model without returning provenance.

## 7. Personal VAD Adapter

Personal VAD is used as an accessibility/noise-control feature, not authentication.

Conceptual states:

```text
non-speech
target-speaker speech
other-speaker speech
```

Contract:

```typescript
export interface PersonalVadResult {
  targetSpeechProbability: number;
  otherSpeechProbability: number;
  nonSpeechProbability: number;
}

export interface PersonalVadAdapter {
  classify(frame: AudioFrame, profile: SpeakerProfile): Promise<PersonalVadResult>;
}
```

The user must be able to disable target-speaker gating. Failure or uncertainty in Personal VAD must degrade to ordinary speech input rather than make the communication interface unusable.

Speaker embeddings are sensitive biometric-like data and must be encrypted, purpose-limited and separately deletable.

## 8. Sign Adapter boundary

The foundation must define but not fully implement an Auslan adapter.

```typescript
export interface SignAdapter {
  infer(sequence: SignSequence): Promise<CommunicationHypothesis>;
}
```

The later sign-to-speech vertical slice will use explicit Auslan-labelled/evaluated data and must not expose ASL research models as Auslan recognition.

## 9. Speech output

The user-confirmed draft is passed to a replaceable speech-output adapter.

```typescript
export interface SpeechOutputAdapter {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  renderAudio?(text: string): Promise<AudioBuffer>;
}
```

Browser/local TTS is acceptable for the earliest demo. Production telephony requires a stream-rendering implementation compatible with the media bridge.

## 10. Twilio media architecture

Primary integration path: Twilio bidirectional Media Streams / SIP-compatible media transport, not ConversationRelay.

Reason: Aditunis requires raw audio access for Personal VAD, personalised ASR and future multimodal processing. ConversationRelay may be retained as an optional simplified text-in/text-out adapter but must not become the core dependency.

Media boundary:

```text
Twilio PSTN
  -> secure WebSocket
  -> Twilio audio codec decoder
  -> PCM/model-rate audio
  -> Aditunis adapters
  -> confirmed message
  -> TTS audio
  -> codec encoder
  -> secure WebSocket
  -> Twilio call
```

The first implementation must not place a production phone call. It will implement and test the media contracts, codec conversion, Twilio webhook validation boundary and local WebSocket/test harness first.

Twilio credentials must only be loaded through environment configuration. No secret may appear in source, tests, screenshots or fixtures.

## 11. Vercel role

Vercel is the initial control-plane and accessible web-hosting target.

Suitable workloads:

- web/PWA client;
- consent/profile interfaces;
- HTTP control APIs;
- signed Twilio webhook endpoints;
- experimental WebSocket media gateway where latency and duration testing is acceptable;
- observability and preview deployments.

Personalised model training is not tied to Vercel. Inference remains behind an adapter so workloads can move to dedicated CPU/GPU infrastructure when benchmarks require it.

A new Aditunis Vercel project must not be created or attached until the initial scaffold exists and local verification passes.

## 12. Temporal role

Temporal must not participate in the frame-by-frame real-time call loop.

Temporal is used for durable model lifecycle workflows such as:

```text
AditunisEnrollmentWorkflow
RetrainPersonalModelWorkflow
EvaluateModelWorkflow
DeleteParticipantModelWorkflow
WithdrawTrainingConsentWorkflow
ModelPromotionWorkflow
```

`AditunisEnrollmentWorkflow` orchestrates:

1. verify explicit training consent;
2. collect or import participant-approved samples;
3. validate sample quality;
4. generate speaker-profile artifacts where opted in;
5. train personalised ASR;
6. evaluate against held-out samples;
7. request participant acceptance of the model;
8. promote an approved model version;
9. retain auditable model/version metadata.

Workflow definitions must remain deterministic. File I/O, model training, cloud APIs and storage operations belong in retryable Activities.

## 13. Privacy and consent

Default service operation:

- do not record calls by default;
- do not persist raw microphone audio by default;
- do not persist camera video by default;
- do not train from ordinary service traffic;
- do not use speaker embeddings for identity authentication;
- do not infer diagnosis, emotion, capacity or disability category;
- do not share participant model artifacts between users;
- display when data leaves the device;
- make training consent separate from communication-service consent;
- support withdrawal and deletion of intentionally collected training data and derived personal models.

Logs must avoid raw communication content unless a separate diagnostic consent mode is explicitly enabled.

## 14. Safety and authority

Model outputs are assistive hypotheses.

The person retains authority over what is spoken on their behalf.

Low-confidence behaviour must be explicit. The system may show alternatives or ask the user to repeat, type or choose a stored phrase. It must not transform uncertain input into a fluent invented sentence.

Emergency calling, medical communication guarantees, interpreter substitution and safety-critical autonomous actions are outside this foundation release.

## 15. Temporal and real-time failure behaviour

Real-time communication must remain available when Temporal is down. Existing approved personal models can continue to run if their inference service remains available.

If personalised ASR is unavailable:

1. notify the user accessibly;
2. offer ordinary speech input if available;
3. offer typed/AAC communication;
4. never hide the degradation.

If Personal VAD is unavailable, bypass gating rather than block communication.

If Twilio/media integration fails, preserve the draft message and make retry/copy/manual communication available.

## 16. Test strategy

Use TDD for all new implementation work.

Required test groups:

- communication hypothesis validation;
- draft state transitions;
- confidence/confirmation policy;
- Personal VAD adapter fallback;
- Euphonia adapter provenance;
- audio codec conversion;
- media/WebSocket state machine;
- Twilio signature-validation boundary;
- Temporal workflow determinism and Activity retry behaviour;
- training-consent withdrawal;
- deletion workflow;
- keyboard accessibility;
- focus order;
- screen-reader labelling/live status;
- error/degraded-mode recovery.

Tests use synthetic audio/communication fixtures only. Do not commit participant speech or disability data.

## 17. Foundation vertical slice

The first implementation plan must produce this verified flow:

```text
browser microphone OR synthetic fixture
  -> communication adapter
  -> hypothesis + confidence
  -> accessible editable draft
  -> explicit user confirmation
  -> TTS
  -> media abstraction
  -> Twilio-compatible audio/WebSocket test harness
```

At the end of the slice, Personal VAD and personalised Euphonia inference may still be test doubles if their adapter contracts and integration tests are real and the next replacement task is explicit.

## 18. Non-goals for foundation

Do not implement in this slice:

- unrestricted continuous Auslan translation;
- production PSTN calling;
- emergency calling;
- autonomous voice agents;
- biometric login;
- covert speaker identification;
- generated Auslan avatar translation;
- medical diagnosis;
- background recording;
- automatic training from live calls;
- MapAble-wide integration.

## 19. Exit criteria

The foundation is ready for the next vertical slice when all of the following are true:

1. an accessible demo can ingest a synthetic or browser-audio communication event;
2. the event becomes a typed `CommunicationHypothesis`;
3. uncertainty is visible;
4. the user can edit and confirm the message;
5. confirmed text is synthesized;
6. generated audio is passed through the media abstraction and Twilio-compatible codec test path;
7. Personal VAD and Euphonia integration contracts have passing tests;
8. Temporal enrollment workflow skeleton has deterministic workflow tests;
9. privacy and data-flow documentation exists;
10. automated tests pass;
11. no participant data or credentials are committed;
12. no claim is made that the system is production telephony, an Auslan translator or an emergency service.

## 20. Next planned slices

After the foundation:

1. replace mock Personal Speech Adapter with a personalised Euphonia/Whisper service;
2. integrate speaker-conditioned Personal VAD;
3. connect a Twilio bidirectional Media Stream in a controlled non-emergency test environment;
4. add bounded Auslan sign-to-speech adapter;
5. add multimodal fusion with modality-level confidence and user confirmation;
6. evaluate production hosting, latency, privacy, Australian telephony obligations and emergency-call requirements before external launch.
