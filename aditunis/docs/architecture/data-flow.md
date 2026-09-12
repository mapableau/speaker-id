# Aditunis Foundation Data Flow

## Implemented foundation flow

```text
browser manual input or synthetic hypothesis
 -> typed communication adapter contract
 -> CommunicationHypothesis + model provenance + confidence
 -> participant-controlled editable draft
 -> explicit participant confirmation
 -> browser speech synthesis

synthetic PCM
 -> G.711 mu-law encoder/decoder
 -> MediaSession state boundary
 -> localhost Twilio-compatible WebSocket harness
```

This foundation does **not** place a live call. The Twilio package validates signed webhook inputs, parses Media Stream protocol messages, and provides a localhost test harness only. It does not provision numbers, originate calls, or route emergency traffic.

The current Personal Speech and Personal VAD implementations are synthetic test doubles behind typed adapters. No real Project Euphonia/Whisper model and no real speaker-conditioned Personal VAD checkpoint are integrated in this slice. The Auslan adapter remains an interface only; this is not an Auslan translator.

## Failure and fallback behavior

- A failed Personal VAD classification returns `process: true, degraded: true`; communication continues without target-speaker gating.
- A speech hypothesis without model ID and version is rejected.
- A model-created message cannot be spoken before explicit confirmation.
- Editing a confirmed draft revokes confirmation.
- Speech-output failure preserves the draft.
- Manual typing is always available in the demo.

## Manual accessibility verification checklist

Automated tests are necessary but insufficient. Before external user testing, manually verify with current screen readers and assistive technology: keyboard-only flow; visible focus at 200% and 400% zoom; NVDA/JAWS/VoiceOver announcement of the live status region; switch-control navigation; eye-gaze target usability; reduced-motion preference; high-contrast/forced-colors behavior; slow-response timing; browser microphone/camera denial paths when those inputs are introduced.
