# Aditunis Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a verified accessibility-first Aditunis foundation that converts a communication hypothesis into a participant-controlled editable draft, explicit confirmation, local TTS, and a Twilio-compatible audio/WebSocket test path while defining tested adapter boundaries for personalised Euphonia ASR, Personal VAD, sign input, and durable Temporal model lifecycle workflows.

**Architecture:** Incubate all new product code under `aditunis/` without reorganising the inherited Google research tree. Use a TypeScript pnpm workspace for the first slice: React/Vite for the accessible demo, pure TypeScript packages for communication state and G.711 mu-law media handling, mock-but-typed Personal Speech and Personal VAD adapters, a Twilio media test harness, and Temporal TypeScript workflows tested with the local test environment. Do not add real participant data, production PSTN calling, emergency calling, or GPU/Python inference in this slice.

**Tech Stack:** TypeScript 5+, pnpm workspaces, React 19, Vite, Vitest, Testing Library, Playwright + `@axe-core/playwright`, `ws`, official `twilio` Node SDK, Web Speech API, Temporal TypeScript SDK/test environment.

**Spec:** `docs/superpowers/specs/2026-09-12-aditunis-foundation-design.md`

## Global Constraints

- New product code lives under `aditunis/`; existing Google-derived research code remains untouched unless a later task explicitly wraps it.
- Every model-generated hypothesis requires explicit user confirmation in this foundation release.
- Personal VAD is an optional accessibility/noise-control feature, never authentication; failure must bypass gating rather than block communication.
- No raw participant speech, camera video, speaker embeddings, credentials, or disability data may be committed.
- No live Twilio/PSTN call is placed in this plan; Twilio work is limited to signed webhook validation, protocol parsing, codecs, and local WebSocket integration tests.
- Temporal is used only for durable model lifecycle orchestration; no frame-by-frame audio processing occurs inside workflows.
- WCAG 2.2 AA is the minimum UI target, with keyboard operation, visible focus, live status announcements, 200% zoom/reflow, large targets, reduced motion, and manual typing fallback.
- Low-confidence or failed inference must be represented as uncertainty; the system must not invent fluent messages.
- Use synthetic fixtures only.
- Use TDD for every implementation task: write the failing test, run it, implement the smallest passing change, rerun, refactor, rerun, commit.

---

## Planned File Structure

```text
aditunis/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  vitest.workspace.ts
  apps/
    web/
      index.html
      package.json
      vite.config.ts
      src/
        App.tsx
        main.tsx
        styles.css
        components/
          CommunicationComposer.tsx
          ConfidenceStatus.tsx
          PermissionNotice.tsx
        hooks/
          useSpeechOutput.ts
      tests/
        CommunicationComposer.test.tsx
        App.accessibility.test.tsx
  packages/
    model-contracts/
      src/index.ts
      tests/contracts.test.ts
    communication-core/
      src/draft-machine.ts
      src/confidence-policy.ts
      tests/draft-machine.test.ts
      tests/confidence-policy.test.ts
    audio-codecs/
      src/mulaw.ts
      src/pcm.ts
      tests/mulaw.test.ts
    media-bridge/
      src/types.ts
      src/session.ts
      tests/session.test.ts
    speech-output/
      src/browser-speech.ts
      src/types.ts
      tests/browser-speech.test.ts
    adapters/
      src/personal-speech.ts
      src/personal-vad.ts
      src/sign.ts
      src/mocks.ts
      tests/adapters.test.ts
    twilio-media/
      src/signature.ts
      src/messages.ts
      src/local-harness.ts
      tests/signature.test.ts
      tests/messages.test.ts
      tests/local-harness.test.ts
  services/
    temporal-worker/
      package.json
      src/workflows.ts
      src/activities.ts
      src/types.ts
      tests/enrollment-workflow.test.ts
      tests/consent-withdrawal.test.ts
  e2e/
    accessibility.spec.ts
    communication-flow.spec.ts
  docs/
    architecture/data-flow.md
    privacy/foundation-privacy.md
    model-cards/foundation-adapters.md
  playwright.config.ts
```

---

### Task 1: Workspace and typed communication contracts

**Files:**
- Create: `aditunis/package.json`
- Create: `aditunis/pnpm-workspace.yaml`
- Create: `aditunis/tsconfig.base.json`
- Create: `aditunis/vitest.workspace.ts`
- Create: `aditunis/packages/model-contracts/package.json`
- Create: `aditunis/packages/model-contracts/src/index.ts`
- Test: `aditunis/packages/model-contracts/tests/contracts.test.ts`

**Interfaces:**
- Produces: `CommunicationModality`, `CommunicationAlternative`, `CommunicationHypothesis`, `CommunicationDraft`, `SpeechProfile`, `SpeakerProfile`, `AudioFrame`, `AudioChunkStream`, `PersonalVadResult`, `PersonalSpeechAdapter`, `PersonalVadAdapter`, `SignAdapter`, `SpeechOutputAdapter`.
- Consumes: none.

- [ ] **Step 1: Add the root workspace manifest and scripts**

```json
{
  "name": "aditunis",
  "private": true,
  "packageManager": "pnpm@10.15.1",
  "scripts": {
    "test": "vitest run --workspace vitest.workspace.ts",
    "test:watch": "vitest --workspace vitest.workspace.ts",
    "typecheck": "pnpm -r typecheck",
    "build": "pnpm -r build",
    "e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - services/*
```

- [ ] **Step 2: Write the failing contract tests**

```ts
import { describe, expect, it } from "vitest";
import type { CommunicationHypothesis } from "../src/index";

describe("CommunicationHypothesis", () => {
  it("supports explicit model provenance and confirmation", () => {
    const hypothesis: CommunicationHypothesis = {
      modality: "personal-speech",
      text: "hello",
      confidence: 0.82,
      alternatives: [{ text: "yellow", confidence: 0.11 }],
      modelId: "mock-euphonia",
      modelVersion: "0.0.1",
      requiresConfirmation: true,
    };

    expect(hypothesis.requiresConfirmation).toBe(true);
    expect(hypothesis.modelId).toBe("mock-euphonia");
  });
});
```

- [ ] **Step 3: Run the model-contract test and confirm it fails because the module does not exist**

Run:

```bash
cd aditunis
pnpm install
pnpm --filter @aditunis/model-contracts test
```

Expected: FAIL due to missing `src/index.ts` exports.

- [ ] **Step 4: Implement the contracts with strict confidence bounds documented at the type boundary**

```ts
export type CommunicationModality = "personal-speech" | "sign" | "aac" | "typed-text";

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

export interface CommunicationDraft {
  text: string;
  source: CommunicationHypothesis | null;
  confirmed: boolean;
  lastEditedAt: string | null;
}

export interface AudioFrame {
  pcm16: Int16Array;
  sampleRateHz: number;
  timestampMs: number;
}

export type AudioChunkStream = AsyncIterable<AudioFrame>;

export interface SpeechProfile {
  profileId: string;
  modelId: string;
  modelVersion: string;
}

export interface SpeakerProfile {
  profileId: string;
  embeddingRef: string;
}

export interface PersonalVadResult {
  targetSpeechProbability: number;
  otherSpeechProbability: number;
  nonSpeechProbability: number;
}

export interface PersonalSpeechAdapter {
  transcribe(input: AudioChunkStream, profile: SpeechProfile): Promise<CommunicationHypothesis>;
}

export interface PersonalVadAdapter {
  classify(frame: AudioFrame, profile: SpeakerProfile): Promise<PersonalVadResult>;
}

export interface SignSequence {
  frames: unknown[];
  durationMs: number;
}

export interface SignAdapter {
  infer(sequence: SignSequence): Promise<CommunicationHypothesis>;
}

export interface SpeechOutputAdapter {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
}
```

- [ ] **Step 5: Run tests and typecheck**

```bash
pnpm --filter @aditunis/model-contracts test
pnpm --filter @aditunis/model-contracts typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add aditunis/package.json aditunis/pnpm-workspace.yaml aditunis/tsconfig.base.json aditunis/vitest.workspace.ts aditunis/packages/model-contracts
git commit -m "feat(aditunis): add workspace and communication contracts"
```

---

### Task 2: Participant-controlled draft state and confidence policy

**Files:**
- Create: `aditunis/packages/communication-core/package.json`
- Create: `aditunis/packages/communication-core/src/draft-machine.ts`
- Create: `aditunis/packages/communication-core/src/confidence-policy.ts`
- Test: `aditunis/packages/communication-core/tests/draft-machine.test.ts`
- Test: `aditunis/packages/communication-core/tests/confidence-policy.test.ts`

**Interfaces:**
- Consumes: `CommunicationHypothesis`, `CommunicationDraft` from `@aditunis/model-contracts`.
- Produces: `createDraft`, `editDraft`, `confirmDraft`, `clearDraft`, `classifyConfidence`.

- [ ] **Step 1: Write failing draft-state tests**

```ts
import { describe, expect, it } from "vitest";
import { confirmDraft, createDraft, editDraft } from "../src/draft-machine";

const hypothesis = {
  modality: "personal-speech" as const,
  text: "call taxi",
  confidence: 0.74,
  alternatives: [],
  modelId: "mock-euphonia",
  modelVersion: "0.0.1",
  requiresConfirmation: true,
};

describe("participant-controlled draft", () => {
  it("never treats a model hypothesis as confirmed", () => {
    expect(createDraft(hypothesis).confirmed).toBe(false);
  });

  it("invalidates confirmation after an edit", () => {
    const confirmed = confirmDraft(createDraft(hypothesis));
    expect(editDraft(confirmed, "please call a taxi").confirmed).toBe(false);
  });
});
```

- [ ] **Step 2: Run and verify FAIL**

```bash
pnpm --filter @aditunis/communication-core test
```

Expected: FAIL because `draft-machine` does not exist.

- [ ] **Step 3: Implement immutable draft transitions**

```ts
import type { CommunicationDraft, CommunicationHypothesis } from "@aditunis/model-contracts";

export function createDraft(source: CommunicationHypothesis): CommunicationDraft {
  return { text: source.text, source, confirmed: false, lastEditedAt: null };
}

export function editDraft(draft: CommunicationDraft, text: string): CommunicationDraft {
  return { ...draft, text, confirmed: false, lastEditedAt: new Date().toISOString() };
}

export function confirmDraft(draft: CommunicationDraft): CommunicationDraft {
  if (!draft.text.trim()) throw new Error("Cannot confirm an empty message");
  return { ...draft, confirmed: true };
}

export function clearDraft(): CommunicationDraft {
  return { text: "", source: null, confirmed: false, lastEditedAt: null };
}
```

- [ ] **Step 4: Add confidence-policy tests**

```ts
import { expect, it } from "vitest";
import { classifyConfidence } from "../src/confidence-policy";

it("exposes uncertainty rather than converting it into a message", () => {
  expect(classifyConfidence(0.49)).toBe("low");
  expect(classifyConfidence(0.79)).toBe("medium");
  expect(classifyConfidence(0.95)).toBe("high");
});
```

- [ ] **Step 5: Implement and verify confidence policy**

```ts
export type ConfidenceBand = "low" | "medium" | "high";

export function classifyConfidence(confidence: number): ConfidenceBand {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new RangeError("confidence must be between 0 and 1");
  }
  if (confidence < 0.65) return "low";
  if (confidence < 0.9) return "medium";
  return "high";
}
```

Run:

```bash
pnpm --filter @aditunis/communication-core test
pnpm --filter @aditunis/communication-core typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add aditunis/packages/communication-core
git commit -m "feat(aditunis): add participant controlled draft state"
```

---

### Task 3: Adapter boundaries, provenance, and graceful Personal VAD fallback

**Files:**
- Create: `aditunis/packages/adapters/package.json`
- Create: `aditunis/packages/adapters/src/personal-speech.ts`
- Create: `aditunis/packages/adapters/src/personal-vad.ts`
- Create: `aditunis/packages/adapters/src/sign.ts`
- Create: `aditunis/packages/adapters/src/mocks.ts`
- Test: `aditunis/packages/adapters/tests/adapters.test.ts`

**Interfaces:**
- Consumes: model contracts.
- Produces: `ProvenanceCheckedSpeechAdapter`, `OptionalPersonalVadGate`, `MockPersonalSpeechAdapter`, `MockPersonalVadAdapter`, `MockSignAdapter`.

- [ ] **Step 1: Write failing adapter tests**

```ts
import { describe, expect, it } from "vitest";
import { OptionalPersonalVadGate, MockPersonalVadAdapter } from "../src/index";

it("bypasses Personal VAD when it fails", async () => {
  const failing = new MockPersonalVadAdapter({ mode: "throw" });
  const gate = new OptionalPersonalVadGate(failing);
  const decision = await gate.shouldProcess(
    { pcm16: new Int16Array([1, 2]), sampleRateHz: 16000, timestampMs: 0 },
    { profileId: "p1", embeddingRef: "memory://speaker/p1" },
  );
  expect(decision).toEqual({ process: true, degraded: true });
});
```

Add a speech provenance test that rejects a hypothesis whose `modelId` or `modelVersion` is empty.

- [ ] **Step 2: Run and verify FAIL**

```bash
pnpm --filter @aditunis/adapters test
```

- [ ] **Step 3: Implement the optional gate**

```ts
import type { AudioFrame, PersonalVadAdapter, SpeakerProfile } from "@aditunis/model-contracts";

export class OptionalPersonalVadGate {
  constructor(private readonly adapter: PersonalVadAdapter) {}

  async shouldProcess(frame: AudioFrame, profile: SpeakerProfile) {
    try {
      const result = await this.adapter.classify(frame, profile);
      return {
        process: result.targetSpeechProbability >= 0.5,
        degraded: false,
      };
    } catch {
      return { process: true, degraded: true };
    }
  }
}
```

Implement mock adapters that use only synthetic text/audio and always identify themselves with explicit model/version strings.

- [ ] **Step 4: Implement provenance enforcement**

```ts
import type { AudioChunkStream, CommunicationHypothesis, PersonalSpeechAdapter, SpeechProfile } from "@aditunis/model-contracts";

export class ProvenanceCheckedSpeechAdapter implements PersonalSpeechAdapter {
  constructor(private readonly inner: PersonalSpeechAdapter) {}

  async transcribe(input: AudioChunkStream, profile: SpeechProfile): Promise<CommunicationHypothesis> {
    const result = await this.inner.transcribe(input, profile);
    if (!result.modelId.trim() || !result.modelVersion.trim()) {
      throw new Error("Speech hypothesis is missing model provenance");
    }
    return { ...result, requiresConfirmation: true };
  }
}
```

- [ ] **Step 5: Run tests/typecheck and commit**

```bash
pnpm --filter @aditunis/adapters test
pnpm --filter @aditunis/adapters typecheck
git add aditunis/packages/adapters
git commit -m "feat(aditunis): add speech vad and sign adapter boundaries"
```

---

### Task 4: G.711 mu-law codec and media-session state machine

**Files:**
- Create: `aditunis/packages/audio-codecs/package.json`
- Create: `aditunis/packages/audio-codecs/src/mulaw.ts`
- Create: `aditunis/packages/audio-codecs/src/pcm.ts`
- Test: `aditunis/packages/audio-codecs/tests/mulaw.test.ts`
- Create: `aditunis/packages/media-bridge/package.json`
- Create: `aditunis/packages/media-bridge/src/types.ts`
- Create: `aditunis/packages/media-bridge/src/session.ts`
- Test: `aditunis/packages/media-bridge/tests/session.test.ts`

**Interfaces:**
- Produces: `encodeMuLaw`, `decodeMuLaw`, `MediaSession`, `MediaSessionEvent`.
- Consumes: synthetic PCM only.

- [ ] **Step 1: Write failing codec-vector tests**

Use G.711 mu-law round-trip assertions that tolerate companding loss rather than expecting exact PCM equality:

```ts
import { expect, it } from "vitest";
import { decodeMuLaw, encodeMuLaw } from "../src/mulaw";

it("round-trips speech-range PCM within mu-law quantisation tolerance", () => {
  const pcm = new Int16Array([-12000, -4000, -1000, 0, 1000, 4000, 12000]);
  const encoded = encodeMuLaw(pcm);
  const decoded = decodeMuLaw(encoded);
  expect(decoded).toHaveLength(pcm.length);
  decoded.forEach((sample, i) => expect(Math.abs(sample - pcm[i])).toBeLessThan(1200));
});
```

- [ ] **Step 2: Run and verify FAIL**

```bash
pnpm --filter @aditunis/audio-codecs test
```

- [ ] **Step 3: Implement the codec as a pure module**

Implement ITU-T G.711 mu-law companding with no external native dependency. Keep the public API exactly:

```ts
export function encodeMuLaw(pcm: Int16Array): Uint8Array;
export function decodeMuLaw(encoded: Uint8Array): Int16Array;
```

Use constants `BIAS = 0x84` and `CLIP = 32635`; encode sign/exponent/mantissa according to G.711 and complement the final byte. Decode by reversing the sign/exponent/mantissa transform. Keep this implementation isolated so it can later be replaced by a vetted codec library without changing consumers.

- [ ] **Step 4: Write failing media-session state tests**

```ts
import { expect, it } from "vitest";
import { MediaSession } from "../src/session";

it("rejects outbound media before a session is started", () => {
  const session = new MediaSession();
  expect(() => session.acceptOutbound(new Uint8Array([0xff]))).toThrow(/not started/i);
});
```

Also test `idle -> started -> stopped`, duplicate start rejection, and preservation of the participant draft outside transport failure state.

- [ ] **Step 5: Implement minimal media-session state machine, run tests, commit**

```bash
pnpm --filter @aditunis/audio-codecs test
pnpm --filter @aditunis/media-bridge test
git add aditunis/packages/audio-codecs aditunis/packages/media-bridge
git commit -m "feat(aditunis): add mulaw codec and media session core"
```

---

### Task 5: Accessible web composer and local speech output

**Files:**
- Create: `aditunis/apps/web/package.json`
- Create: `aditunis/apps/web/index.html`
- Create: `aditunis/apps/web/vite.config.ts`
- Create: `aditunis/apps/web/src/main.tsx`
- Create: `aditunis/apps/web/src/App.tsx`
- Create: `aditunis/apps/web/src/components/CommunicationComposer.tsx`
- Create: `aditunis/apps/web/src/components/ConfidenceStatus.tsx`
- Create: `aditunis/apps/web/src/components/PermissionNotice.tsx`
- Create: `aditunis/apps/web/src/hooks/useSpeechOutput.ts`
- Create: `aditunis/apps/web/src/styles.css`
- Test: `aditunis/apps/web/tests/CommunicationComposer.test.tsx`
- Test: `aditunis/apps/web/tests/App.accessibility.test.tsx`

**Interfaces:**
- Consumes: `CommunicationHypothesis`, communication-core draft functions, mock speech adapter.
- Produces: participant-facing Start, Stop, Edit, Confirm, Speak, Retry, Clear and manual text controls.

- [ ] **Step 1: Write failing interaction tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CommunicationComposer } from "../src/components/CommunicationComposer";

it("requires confirmation before Speak is enabled", () => {
  render(<CommunicationComposer />);
  fireEvent.click(screen.getByRole("button", { name: /load synthetic speech/i }));
  expect(screen.getByRole("button", { name: /^speak$/i })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
  expect(screen.getByRole("button", { name: /^speak$/i })).toBeEnabled();
});
```

Add tests that manual typing is always available, low confidence is announced in a live region, editing invalidates confirmation, and Clear returns to an empty unconfirmed state.

- [ ] **Step 2: Run and verify FAIL**

```bash
pnpm --filter @aditunis/web test
```

- [ ] **Step 3: Implement the composer with semantic HTML**

Use:

```tsx
<section aria-labelledby="composer-title">
  <h1 id="composer-title">Aditunis communication demo</h1>
  <div role="status" aria-live="polite" aria-atomic="true">{statusText}</div>
  <label htmlFor="message">Message to speak</label>
  <textarea id="message" value={draft.text} onChange={...} />
  <button type="button">Confirm</button>
  <button type="button" disabled={!draft.confirmed}>Speak</button>
</section>
```

Do not use auto-focus after recognition. Keep DOM order equal to visual focus order.

- [ ] **Step 4: Implement browser speech output behind an adapter**

```ts
export class BrowserSpeechOutputAdapter {
  async speak(text: string) {
    if (!("speechSynthesis" in window)) throw new Error("Speech output is unavailable");
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async stop() {
    window.speechSynthesis.cancel();
  }
}
```

The UI must catch failure and expose it through the live status region without deleting the draft.

- [ ] **Step 5: Add CSS acceptance rules**

Ensure interactive controls have a minimum `44px` block/inline hit area, `:focus-visible` outline at least `2px`, layout remains functional at 200% zoom, and `prefers-reduced-motion: reduce` removes nonessential transition/animation.

- [ ] **Step 6: Run tests/typecheck/build and commit**

```bash
pnpm --filter @aditunis/web test
pnpm --filter @aditunis/web typecheck
pnpm --filter @aditunis/web build
git add aditunis/apps/web
git commit -m "feat(aditunis): add accessible communication composer"
```

---

### Task 6: Twilio signature boundary and local bidirectional media harness

**Files:**
- Create: `aditunis/packages/twilio-media/package.json`
- Create: `aditunis/packages/twilio-media/src/signature.ts`
- Create: `aditunis/packages/twilio-media/src/messages.ts`
- Create: `aditunis/packages/twilio-media/src/local-harness.ts`
- Test: `aditunis/packages/twilio-media/tests/signature.test.ts`
- Test: `aditunis/packages/twilio-media/tests/messages.test.ts`
- Test: `aditunis/packages/twilio-media/tests/local-harness.test.ts`

**Interfaces:**
- Consumes: `decodeMuLaw`, `encodeMuLaw`, media session state.
- Produces: `validateTwilioWebhook`, `parseTwilioMediaMessage`, `createLocalMediaHarness`.

- [ ] **Step 1: Write failing Twilio validation tests using the official SDK**

```ts
import twilio from "twilio";
import { expect, it } from "vitest";
import { validateTwilioWebhook } from "../src/signature";

it("rejects an invalid Twilio signature", () => {
  expect(validateTwilioWebhook({
    authToken: "test-token",
    signature: "invalid",
    url: "https://example.test/twilio/voice",
    params: { CallSid: "CA123" },
  })).toBe(false);
});
```

Add a positive case using `twilio.getExpectedTwilioSignature` in the test only. Product code must use `twilio.validateRequest`; do not implement custom signature verification.

- [ ] **Step 2: Implement the validation boundary**

```ts
import twilio from "twilio";

export function validateTwilioWebhook(input: {
  authToken: string;
  signature: string;
  url: string;
  params: Record<string, string>;
}) {
  return twilio.validateRequest(input.authToken, input.signature, input.url, input.params);
}
```

- [ ] **Step 3: Write failing Media Streams parser tests**

Cover `connected`, `start`, `media`, `mark`, `stop`; reject unknown event shapes rather than treating them as audio. For a `media` event, decode the base64 payload to bytes but do not persist it.

- [ ] **Step 4: Implement the parser with explicit discriminated unions**

```ts
export type TwilioMediaEvent =
  | { type: "connected" }
  | { type: "start"; streamSid: string; callSid: string }
  | { type: "media"; streamSid: string; payload: Uint8Array }
  | { type: "mark"; streamSid: string; name: string }
  | { type: "stop"; streamSid: string };
```

- [ ] **Step 5: Write the local WebSocket round-trip test**

Start a `ws` server on an ephemeral port, send a synthetic Twilio `start`, then one base64 mu-law `media` message, assert it decodes to PCM, encode a synthetic outbound PCM chunk, and assert the client receives a Twilio-compatible base64 media payload. No network call may leave localhost.

- [ ] **Step 6: Run tests and commit**

```bash
pnpm --filter @aditunis/twilio-media test
pnpm --filter @aditunis/twilio-media typecheck
git add aditunis/packages/twilio-media
git commit -m "feat(aditunis): add twilio media protocol test harness"
```

---

### Task 7: Temporal model-lifecycle workflow skeleton

**Files:**
- Create: `aditunis/services/temporal-worker/package.json`
- Create: `aditunis/services/temporal-worker/src/types.ts`
- Create: `aditunis/services/temporal-worker/src/activities.ts`
- Create: `aditunis/services/temporal-worker/src/workflows.ts`
- Test: `aditunis/services/temporal-worker/tests/enrollment-workflow.test.ts`
- Test: `aditunis/services/temporal-worker/tests/consent-withdrawal.test.ts`

**Interfaces:**
- Produces: `AditunisEnrollmentWorkflow`, `WithdrawTrainingConsentWorkflow`, typed activity contracts.
- Consumes: synthetic profile/sample identifiers only; no audio content is stored in workflow history.

- [ ] **Step 1: Write a failing enrollment-workflow test with Temporal's time-skipping test environment**

The expected ordered outcomes are:

```text
consent verified
samples validated
personal ASR trained
held-out evaluation completed
participant acceptance requested
model promoted only when accepted
```

Assert that a rejected participant acceptance result returns `status: "not-promoted"`.

- [ ] **Step 2: Implement deterministic workflow orchestration**

Activities are invoked through `proxyActivities` with retry policy. Workflow code must not access filesystem, network, wall clock, random values, or model libraries directly.

```ts
const {
  verifyTrainingConsent,
  validateSamples,
  trainPersonalModel,
  evaluateModel,
  requestParticipantAcceptance,
  promoteModel,
} = proxyActivities<Activities>({
  startToCloseTimeout: "10 minutes",
  retry: { maximumAttempts: 3 },
});
```

- [ ] **Step 3: Write the withdrawal test before implementation**

`WithdrawTrainingConsentWorkflow` must call Activities to revoke training consent, delete intentionally collected training samples, delete derived personal models, and record completion metadata. It must not delete unrelated ordinary service data.

- [ ] **Step 4: Implement withdrawal workflow and Activity interfaces**

Return a structured result:

```ts
{
  status: "withdrawn",
  trainingSamplesDeleted: true,
  derivedModelsDeleted: true,
  completedAt: string
}
```

Generate `completedAt` inside an Activity, not with a non-deterministic workflow-side wall-clock call.

- [ ] **Step 5: Run workflow tests and commit**

```bash
pnpm --filter @aditunis/temporal-worker test
pnpm --filter @aditunis/temporal-worker typecheck
git add aditunis/services/temporal-worker
git commit -m "feat(aditunis): add durable model lifecycle workflows"
```

---

### Task 8: End-to-end accessibility, privacy documentation, and CI verification

**Files:**
- Create: `aditunis/playwright.config.ts`
- Create: `aditunis/e2e/accessibility.spec.ts`
- Create: `aditunis/e2e/communication-flow.spec.ts`
- Create: `aditunis/docs/architecture/data-flow.md`
- Create: `aditunis/docs/privacy/foundation-privacy.md`
- Create: `aditunis/docs/model-cards/foundation-adapters.md`
- Create: `.github/workflows/aditunis-foundation.yml`

**Interfaces:**
- Verifies the complete foundation vertical slice.
- No new runtime API is introduced.

- [ ] **Step 1: Add failing Playwright flow**

The browser test must:

1. open the demo;
2. load a synthetic personal-speech hypothesis;
3. verify the uncertainty status is visible;
4. edit the proposed text;
5. verify Speak remains disabled;
6. confirm;
7. verify Speak becomes enabled;
8. trigger Speak with a browser speech stub;
9. Clear;
10. verify manual typing remains available.

- [ ] **Step 2: Add automated accessibility smoke test**

Use `@axe-core/playwright`:

```ts
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

Also run keyboard-only checks for all primary actions and assert the live region announces low confidence and errors.

- [ ] **Step 3: Document the actual foundation data flow**

`data-flow.md` must explicitly show:

```text
browser/synthetic audio
 -> adapter contract
 -> hypothesis/provenance
 -> editable draft
 -> participant confirmation
 -> local TTS

synthetic PCM
 -> G.711 mu-law
 -> local Twilio-compatible WebSocket harness
```

State that no live Twilio call and no real personalised model are implemented in this slice.

- [ ] **Step 4: Document privacy controls**

`foundation-privacy.md` must record:

- no recording by default;
- no participant training data in git/tests;
- training consent separated from service consent;
- speaker embeddings treated as sensitive and separately deletable;
- Personal VAD not used for login/authentication;
- raw communication content excluded from ordinary logs;
- failure fallback to typed/AAC-compatible manual communication;
- emergency calling explicitly out of scope.

- [ ] **Step 5: Add model/adaptor card**

Document the mock Personal Speech adapter and mock Personal VAD adapter as **test doubles**, not trained models. Record upstream research references separately and prohibit claims that the foundation has validated atypical-speech recognition or Auslan translation.

- [ ] **Step 6: Add CI**

GitHub Actions job must run from `aditunis/`:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10.15.1
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: pnpm
    cache-dependency-path: aditunis/pnpm-lock.yaml
- run: pnpm install --frozen-lockfile
  working-directory: aditunis
- run: pnpm typecheck
  working-directory: aditunis
- run: pnpm test
  working-directory: aditunis
- run: pnpm build
  working-directory: aditunis
```

Run Playwright in CI only after installing its Chromium dependency.

- [ ] **Step 7: Run complete local verification**

```bash
cd aditunis
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm e2e
```

Expected: all commands PASS.

- [ ] **Step 8: Inspect git diff for sensitive or generated material**

Run:

```bash
git status --short
git diff --check
git diff --cached --check
grep -R -n -E 'TWILIO_AUTH_TOKEN|TWILIO_ACCOUNT_SID|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' aditunis .github/workflows/aditunis-foundation.yml || true
find aditunis -type f \( -name '*.wav' -o -name '*.mp3' -o -name '*.mp4' -o -name '*.m4a' \) -print
```

Expected: no secrets and no participant/media recordings.

- [ ] **Step 9: Commit**

```bash
git add aditunis .github/workflows/aditunis-foundation.yml
git commit -m "test(aditunis): verify foundation accessibility and privacy"
```

---

## Final Verification Gate

Before opening a PR, run all of the following and capture the output in the final engineering report:

```bash
cd aditunis
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
cd ..
git diff master...HEAD --check
git status --short
```

Then verify the branch against the design exit criteria:

- Accessible demo ingests a synthetic communication event.
- Event becomes a typed `CommunicationHypothesis` with model provenance.
- Uncertainty is visible and announced.
- User can edit and explicitly confirm.
- Speak cannot run before confirmation.
- Browser TTS is invoked only for the confirmed draft.
- Synthetic audio passes through the media abstraction and G.711 mu-law path.
- Local WebSocket harness proves Twilio-compatible media framing without placing a call.
- Personal VAD failure degrades to ordinary processing.
- Personal Speech output cannot omit model provenance.
- Temporal enrollment and withdrawal workflows pass deterministic tests.
- Privacy/data-flow/model-card documentation exists.
- No participant data, recordings, embeddings, or credentials are committed.
- No claim is made that the foundation is production telephony, an emergency service, validated atypical-speech ASR, or an Auslan translator.

## PR Scope

Open a **draft** PR from `feature/aditunis-foundation` to `master` only after the final verification gate passes. The PR must remain draft until independent code review is complete. Do not merge.

The PR description must distinguish:

- **Implemented and verified locally:** communication contracts, draft/confirmation policy, synthetic adapters, accessible demo, codec/media harness, Twilio validation boundary, Temporal workflow skeleton, tests/docs.
- **In development / next slice:** real Euphonia personalised Whisper service and Personal VAD model integration.
- **Not implemented:** production PSTN calling, emergency calling, unrestricted Auslan translation, biometric authentication, autonomous calling.