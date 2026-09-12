# Aditunis Foundation Adapter Card

**Status:** development test doubles and protocol adapters; not validated assistive ML models.

## Mock Personal Speech Adapter

Purpose: exercise the communication pipeline with deterministic synthetic hypotheses.

- model ID: `mock-euphonia`
- version: `0.0.1`
- data: synthetic only
- limitation: performs no speech recognition
- safety: output is forced to require participant confirmation

## Mock Personal VAD Adapter

Purpose: exercise target/other/silence/failure states without a speaker model.

- data: synthetic only
- limitation: performs no speaker recognition or verification
- failure behavior: gating is bypassed so communication is not blocked
- prohibited interpretation: this adapter is not identity authentication

## Sign Adapter

Interface only. No Auslan model is implemented in this foundation. ASL research models must not be represented as Auslan capability.

## Twilio Media Adapter

Protocol and transport test boundary only. It validates Twilio webhook signatures using the official SDK, parses supported Media Stream event shapes, and tests media framing on loopback. No PSTN or emergency calling is implemented.
