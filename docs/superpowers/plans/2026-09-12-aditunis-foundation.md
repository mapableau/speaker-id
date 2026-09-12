# Aditunis Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a verified accessibility-first Aditunis foundation that converts a communication hypothesis into a participant-controlled editable draft, explicit confirmation, local TTS, and a Twilio-compatible audio/WebSocket test path while defining tested adapter boundaries for personalised Euphonia ASR, Personal VAD, sign input, and durable Temporal model lifecycle workflows.

**Architecture:** Incubate all new product code under `aditunis/` without reorganising the inherited Google research tree. Use a TypeScript pnpm workspace for the first slice: React/Vite for the accessible demo, pure TypeScript packages for communication state and G.711 mu-law media handling, mock-but-typed Personal Speech and Personal VAD adapters, a local Twilio-compatible media harness, and Temporal TypeScript workflows tested with the local test environment. Do not add real participant data, production PSTN calling, emergency calling, or GPU/Python inference in this slice.

**Tech Stack:** Node 22, TypeScript 5+, pnpm 10, React 19, Vite, Vitest, Testing Library, Playwright + `@axe-core/playwright`, `ws`, official `twilio` Node SDK, browser Web Speech API, Temporal TypeScript SDK/test environment.

**Spec:** `docs/superpowers/specs/2026-09-12-aditunis-foundation-design.md`

## Global Constraints

- New product code lives under `aditunis/`; inherited Google-derived research code remains untouched.
- Every model-generated hypothesis requires explicit user confirmation in this foundation release.
- Personal VAD is an optional accessibility/noise-control feature, never authentication; failure bypasses gating instead of blocking communication.
- No raw participant speech, camera video, speaker embeddings, credentials, or disability data may be committed.
- No live Twilio/PSTN call is placed; Twilio work is limited to request validation, protocol parsing, codecs, and localhost WebSocket tests.
- Temporal is used only for durable model lifecycle orchestration; no frame-by-frame audio work occurs inside workflows.
- WCAG 2.2 AA is the minimum UI target, with keyboard operation, visible focus, live status announcements, 200% zoom/reflow, large targets, reduced motion, and manual typing fallback.
- Low-confidence or failed inference is represented as uncertainty; the system must not invent fluent messages.
- Use synthetic fixtures only.
- Use TDD for every implementation task.

## Workspace conventions

Every workspace package uses ESM, `strict: true`, and exposes source through `src/index.ts` or the named source file. Packages that do not need a production bundle still have a `build` script equal to `tsc -p tsconfig.json --noEmit` so root verification is consistent.

Root `aditunis/package.json`:

```json
{
  "name": "aditunis",
  "private": true,
  "packageManager": "pnpm@10.15.1",
  "scripts": {
    "test": "vitest run --workspace vitest.workspace.ts",
    "typecheck": "pnpm -r typecheck",
    "build": "pnpm -r build",
    "e2e": "playwright test"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.10.2",
    "@playwright/test": "^1.55.0",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

Root `aditunis/pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - services/*
```

Root `aditunis/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

### Task 1: Workspace and typed communication contracts

**Files:**
- Create: `aditunis/package.json`
- Create: `aditunis/pnpm-workspace.yaml`
- Create: `aditunis/tsconfig.base.json`
- Create: `aditunis/vitest.workspace.ts`
- Create: `aditunis/packages/model-contracts/package.json`
- Create: `aditunis/packages/model-contracts/tsconfig.json`
- Create: `aditunis/packages/model-contracts/src/index.ts`
- Test: `aditunis/packages/model-contracts/tests/contracts.test.ts`

**Interfaces:** Produces `CommunicationModality`, `CommunicationAlternative`, `CommunicationHypothesis`, `CommunicationDraft`, `SpeechProfile`, `SpeakerProfile`, `AudioFrame`, `AudioChunkStream`, `PersonalVadResult`, `PersonalSpeechAdapter`, `PersonalVadAdapter`, `SignAdapter`, `SpeechOutputAdapter`.

- [ ] **Step 1: Create the root workspace files exactly as specified above, plus Vitest workspace configuration**

```ts
// vitest.workspace.ts
import { defineWorkspace } from "vitest/config";
export default defineWorkspace(["apps/*/vitest.config.ts", "packages/*/vitest.config.ts", "services/*/vitest.config.ts"]);
```

- [ ] **Step 2: Create `@aditunis/model-contracts` manifest and tsconfig**

```json
{
  "name": "@aditunis/model-contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "build": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": { "typescript": "^5.9.2", "vitest": "^3.2.4" }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["vitest/globals"] },
  "include": ["src", "tests"]
}
```

Also create package-local `vitest.config.ts` with `defineConfig({ test: { environment: "node" } })`.

- [ ] **Step 3: Write the failing contract test**

```ts
import { expect, it } from "vitest";
import type { CommunicationHypothesis } from "../src/index";

it("carries model provenance and mandatory confirmation", () => {
  const value: CommunicationHypothesis = {
    modality: "personal-speech",
    text: "hello",
    confidence: 0.82,
    alternatives: [{ text: "yellow", confidence: 0.11 }],
    modelId: "mock-euphonia",
    modelVersion: "0.0.1",
    requiresConfirmation: true
  };
  expect(value.requiresConfirmation).toBe(true);
  expect(value.modelId).toBe("mock-euphonia");
});
```

- [ ] **Step 4: Run and confirm FAIL**

```bash
cd aditunis
pnpm install
pnpm --filter @aditunis/model-contracts test
```

Expected: module/export missing.

- [ ] **Step 5: Implement the contracts**

```ts
export type CommunicationModality = "personal-speech" | "sign" | "aac" | "typed-text";
export interface CommunicationAlternative { text: string; confidence: number; }
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
export interface AudioFrame { pcm16: Int16Array; sampleRateHz: number; timestampMs: number; }
export type AudioChunkStream = AsyncIterable<AudioFrame>;
export interface SpeechProfile { profileId: string; modelId: string; modelVersion: string; }
export interface SpeakerProfile { profileId: string; embeddingRef: string; }
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
export interface SignSequence { frames: unknown[]; durationMs: number; }
export interface SignAdapter { infer(sequence: SignSequence): Promise<CommunicationHypothesis>; }
export interface SpeechOutputAdapter { speak(text: string): Promise<void>; stop(): Promise<void>; }
```

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @aditunis/model-contracts test
pnpm --filter @aditunis/model-contracts typecheck
git add aditunis
git commit -m "feat(aditunis): add workspace and communication contracts"
```

---

### Task 2: Participant-controlled draft state and confidence policy

**Files:** `aditunis/packages/communication-core/{package.json,tsconfig.json,vitest.config.ts,src/draft-machine.ts,src/confidence-policy.ts,src/index.ts,tests/*.test.ts}`

**Manifest:**

```json
{
  "name": "@aditunis/communication-core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc -p tsconfig.json --noEmit", "build": "tsc -p tsconfig.json --noEmit" },
  "dependencies": { "@aditunis/model-contracts": "workspace:*" },
  "devDependencies": { "typescript": "^5.9.2", "vitest": "^3.2.4" }
}
```

- [ ] **Step 1: Write failing tests proving hypotheses start unconfirmed, edits invalidate confirmation, empty drafts cannot be confirmed, and confidence bands validate the 0..1 range**

```ts
const source = { modality: "personal-speech" as const, text: "call taxi", confidence: 0.74, alternatives: [], modelId: "mock", modelVersion: "1", requiresConfirmation: true };
expect(createDraft(source).confirmed).toBe(false);
expect(editDraft(confirmDraft(createDraft(source)), "please call a taxi").confirmed).toBe(false);
expect(() => confirmDraft(clearDraft())).toThrow(/empty/i);
expect(classifyConfidence(0.49)).toBe("low");
expect(classifyConfidence(0.79)).toBe("medium");
expect(classifyConfidence(0.95)).toBe("high");
expect(() => classifyConfidence(1.1)).toThrow(RangeError);
```

- [ ] **Step 2: Run tests and confirm FAIL**

```bash
pnpm --filter @aditunis/communication-core test
```

- [ ] **Step 3: Implement immutable draft transitions and confidence policy**

```ts
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
export function classifyConfidence(value: number): "low" | "medium" | "high" {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError("confidence must be between 0 and 1");
  if (value < 0.65) return "low";
  if (value < 0.9) return "medium";
  return "high";
}
```

- [ ] **Step 4: Verify and commit**

```bash
pnpm --filter @aditunis/communication-core test
pnpm --filter @aditunis/communication-core typecheck
git add aditunis/packages/communication-core
git commit -m "feat(aditunis): add participant controlled draft state"
```

---

### Task 3: Adapter boundaries, provenance, and graceful Personal VAD fallback

**Files:** `aditunis/packages/adapters/{package.json,tsconfig.json,vitest.config.ts,src/index.ts,src/personal-speech.ts,src/personal-vad.ts,src/sign.ts,src/mocks.ts,tests/adapters.test.ts}`

**Manifest:** same scripts as Task 2; dependencies only `@aditunis/model-contracts: workspace:*`.

- [ ] **Step 1: Write failing tests**

```ts
it("bypasses failed Personal VAD", async () => {
  const gate = new OptionalPersonalVadGate(new MockPersonalVadAdapter({ mode: "throw" }));
  await expect(gate.shouldProcess(frame, profile)).resolves.toEqual({ process: true, degraded: true });
});
it("forces confirmation and rejects missing provenance", async () => {
  const checked = new ProvenanceCheckedSpeechAdapter(new MockPersonalSpeechAdapter({ modelId: "", modelVersion: "1" }));
  await expect(checked.transcribe(stream, speechProfile)).rejects.toThrow(/provenance/i);
});
```

- [ ] **Step 2: Run and confirm FAIL**

```bash
pnpm --filter @aditunis/adapters test
```

- [ ] **Step 3: Implement `OptionalPersonalVadGate`**

```ts
export class OptionalPersonalVadGate {
  constructor(private readonly adapter: PersonalVadAdapter) {}
  async shouldProcess(frame: AudioFrame, profile: SpeakerProfile) {
    try {
      const result = await this.adapter.classify(frame, profile);
      return { process: result.targetSpeechProbability >= 0.5, degraded: false };
    } catch {
      return { process: true, degraded: true };
    }
  }
}
```

- [ ] **Step 4: Implement `ProvenanceCheckedSpeechAdapter` and synthetic mocks**

```ts
export class ProvenanceCheckedSpeechAdapter implements PersonalSpeechAdapter {
  constructor(private readonly inner: PersonalSpeechAdapter) {}
  async transcribe(input: AudioChunkStream, profile: SpeechProfile) {
    const result = await this.inner.transcribe(input, profile);
    if (!result.modelId.trim() || !result.modelVersion.trim()) throw new Error("Speech hypothesis is missing model provenance");
    return { ...result, requiresConfirmation: true };
  }
}
```

Mock adapters must return only synthetic data and explicit `modelId`/`modelVersion` values.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @aditunis/adapters test
pnpm --filter @aditunis/adapters typecheck
git add aditunis/packages/adapters
git commit -m "feat(aditunis): add model adapter boundaries"
```

---

### Task 4: G.711 mu-law codec and media-session state machine

**Files:**
- `aditunis/packages/audio-codecs/{package.json,tsconfig.json,vitest.config.ts,src/index.ts,src/mulaw.ts,tests/mulaw.test.ts}`
- `aditunis/packages/media-bridge/{package.json,tsconfig.json,vitest.config.ts,src/index.ts,src/session.ts,tests/session.test.ts}`

**Manifests:** both use standard test/typecheck/build scripts; `media-bridge` depends on `@aditunis/audio-codecs: workspace:*` only if it imports codec types/functions.

- [ ] **Step 1: Write failing lossy round-trip codec test**

```ts
const pcm = new Int16Array([-12000, -4000, -1000, 0, 1000, 4000, 12000]);
const decoded = decodeMuLaw(encodeMuLaw(pcm));
expect(decoded).toHaveLength(pcm.length);
decoded.forEach((sample, i) => expect(Math.abs(sample - pcm[i])).toBeLessThan(1200));
```

- [ ] **Step 2: Run and confirm FAIL**

```bash
pnpm --filter @aditunis/audio-codecs test
```

- [ ] **Step 3: Implement pure G.711 mu-law conversion**

Public API is exactly:

```ts
export function encodeMuLaw(pcm: Int16Array): Uint8Array;
export function decodeMuLaw(encoded: Uint8Array): Int16Array;
```

Use G.711 constants `BIAS = 0x84` and `CLIP = 32635`; keep implementation isolated and side-effect free. Add zero, positive, negative, clipping, and round-trip tests.

- [ ] **Step 4: Write failing media-session tests**

```ts
const session = new MediaSession();
expect(() => session.acceptOutbound(new Uint8Array([0xff]))).toThrow(/not started/i);
session.start("MZ123");
expect(session.state).toBe("started");
session.stop();
expect(session.state).toBe("stopped");
```

Test duplicate start rejection and that transport errors do not mutate any `CommunicationDraft` object passed by the caller.

- [ ] **Step 5: Implement minimal state machine, verify, commit**

```bash
pnpm --filter @aditunis/audio-codecs test
pnpm --filter @aditunis/media-bridge test
git add aditunis/packages/audio-codecs aditunis/packages/media-bridge
git commit -m "feat(aditunis): add codec and media session core"
```

---

### Task 5: Accessible React/Vite communication composer and browser speech output

**Files:** `aditunis/apps/web/{package.json,tsconfig.json,vite.config.ts,vitest.config.ts,index.html,src/main.tsx,src/App.tsx,src/styles.css,src/components/CommunicationComposer.tsx,src/components/ConfidenceStatus.tsx,src/hooks/useSpeechOutput.ts,tests/CommunicationComposer.test.tsx}`

**Manifest:**

```json
{
  "name": "@aditunis/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "test": "vitest run", "typecheck": "tsc -p tsconfig.json --noEmit", "build": "vite build" },
  "dependencies": {
    "@aditunis/adapters": "workspace:*",
    "@aditunis/communication-core": "workspace:*",
    "@aditunis/model-contracts": "workspace:*",
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.1.10",
    "@types/react-dom": "^19.1.7",
    "@vitejs/plugin-react": "^5.0.2",
    "jsdom": "^26.1.0",
    "typescript": "^5.9.2",
    "vite": "^7.1.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 1: Write failing interaction tests**

```tsx
render(<CommunicationComposer />);
fireEvent.click(screen.getByRole("button", { name: /load synthetic speech/i }));
expect(screen.getByRole("button", { name: /^speak$/i })).toBeDisabled();
fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
expect(screen.getByRole("button", { name: /^speak$/i })).toBeEnabled();
```

Also test manual typing is always available, low confidence is surfaced in `role=status`, editing invalidates confirmation, Clear preserves usability, and speech-output failure does not delete the draft.

- [ ] **Step 2: Run and confirm FAIL**

```bash
pnpm --filter @aditunis/web test
```

- [ ] **Step 3: Implement semantic composer**

```tsx
<section aria-labelledby="composer-title">
  <h1 id="composer-title">Aditunis communication demo</h1>
  <div role="status" aria-live="polite" aria-atomic="true">{statusText}</div>
  <label htmlFor="message">Message to speak</label>
  <textarea id="message" value={draft.text} onChange={onEdit} />
  <button type="button" onClick={onConfirm}>Confirm</button>
  <button type="button" disabled={!draft.confirmed} onClick={onSpeak}>Speak</button>
  <button type="button" onClick={onClear}>Clear</button>
</section>
```

Do not auto-focus after recognition; DOM order equals focus order.

- [ ] **Step 4: Implement browser `SpeechOutputAdapter`**

```ts
export class BrowserSpeechOutputAdapter implements SpeechOutputAdapter {
  async speak(text: string) {
    if (!("speechSynthesis" in window)) throw new Error("Speech output is unavailable");
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
  async stop() { window.speechSynthesis.cancel(); }
}
```

- [ ] **Step 5: Add accessibility CSS**

Controls must have at least `44px` target dimensions; use a visible `:focus-visible` outline of at least `2px`; no colour-only status; responsive single-column fallback at narrow widths; `prefers-reduced-motion: reduce` removes nonessential transitions.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @aditunis/web test
pnpm --filter @aditunis/web typecheck
pnpm --filter @aditunis/web build
git add aditunis/apps/web
git commit -m "feat(aditunis): add accessible communication composer"
```

---

### Task 6: Twilio validation boundary and localhost bidirectional media harness

**Files:** `aditunis/packages/twilio-media/{package.json,tsconfig.json,vitest.config.ts,src/index.ts,src/signature.ts,src/messages.ts,src/local-harness.ts,tests/*.test.ts}`

**Manifest dependencies:** `@aditunis/audio-codecs: workspace:*`, `@aditunis/media-bridge: workspace:*`, `twilio`, `ws`; dev dependency `@types/ws`.

- [ ] **Step 1: Write failing signature tests**

```ts
expect(validateTwilioWebhook({ authToken: "test-token", signature: "invalid", url: "https://example.test/twilio/voice", params: { CallSid: "CA123" } })).toBe(false);
```

Add a positive test using `twilio.getExpectedTwilioSignature` in test code. Product code must call `twilio.validateRequest`; do not implement the verifier manually.

- [ ] **Step 2: Implement validation boundary**

```ts
export function validateTwilioWebhook(input: { authToken: string; signature: string; url: string; params: Record<string, string> }) {
  return twilio.validateRequest(input.authToken, input.signature, input.url, input.params);
}
```

- [ ] **Step 3: Write parser tests for `connected`, `start`, `media`, `mark`, `stop` and invalid messages**

The `media` case base64-decodes to bytes in memory only.

- [ ] **Step 4: Implement discriminated-union parser**

```ts
export type TwilioMediaEvent =
  | { type: "connected" }
  | { type: "start"; streamSid: string; callSid: string }
  | { type: "media"; streamSid: string; payload: Uint8Array }
  | { type: "mark"; streamSid: string; name: string }
  | { type: "stop"; streamSid: string };
```

Invalid shapes throw `TwilioMediaProtocolError` and are never treated as audio.

- [ ] **Step 5: Write and implement localhost WebSocket round-trip test**

Start `ws` on port `0`, send synthetic `start` and one base64 mu-law `media` frame, assert decode to PCM, encode a synthetic outbound PCM chunk, and assert receipt of a Twilio-compatible base64 `media` frame. Bind only to loopback and make no external call.

- [ ] **Step 6: Verify and commit**

```bash
pnpm --filter @aditunis/twilio-media test
pnpm --filter @aditunis/twilio-media typecheck
git add aditunis/packages/twilio-media
git commit -m "feat(aditunis): add twilio media protocol harness"
```

---

### Task 7: Temporal model-lifecycle workflow skeleton

**Files:** `aditunis/services/temporal-worker/{package.json,tsconfig.json,vitest.config.ts,src/types.ts,src/activities.ts,src/workflows.ts,tests/enrollment-workflow.test.ts,tests/consent-withdrawal.test.ts}`

**Manifest:**

```json
{
  "name": "@aditunis/temporal-worker",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run", "typecheck": "tsc -p tsconfig.json --noEmit", "build": "tsc -p tsconfig.json --noEmit" },
  "dependencies": {
    "@temporalio/activity": "^1.13.2",
    "@temporalio/client": "^1.13.2",
    "@temporalio/worker": "^1.13.2",
    "@temporalio/workflow": "^1.13.2"
  },
  "devDependencies": { "@temporalio/testing": "^1.13.2", "typescript": "^5.9.2", "vitest": "^3.2.4" }
}
```

- [ ] **Step 1: Write failing enrollment workflow test**

Expected Activity order: verify training consent -> validate participant-approved samples -> train personal model -> evaluate held-out samples -> request participant acceptance -> promote only if accepted. A rejected acceptance returns `{ status: "not-promoted" }`.

- [ ] **Step 2: Implement deterministic workflow orchestration**

```ts
const activities = proxyActivities<Activities>({
  startToCloseTimeout: "10 minutes",
  retry: { maximumAttempts: 3 }
});
```

Workflow code must not access filesystem, network, wall clock, random values, audio/model libraries, or environment variables directly.

- [ ] **Step 3: Write failing consent-withdrawal/deletion test**

Withdrawal must revoke training consent, delete intentionally collected training samples, delete derived personal models, and record completion metadata. It must not delete unrelated service data.

- [ ] **Step 4: Implement withdrawal workflow**

Activity result shape:

```ts
export interface WithdrawalResult {
  status: "withdrawn";
  trainingSamplesDeleted: boolean;
  derivedModelsDeleted: boolean;
  completedAt: string;
}
```

`completedAt` is produced by an Activity, not a workflow-side wall-clock call.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @aditunis/temporal-worker test
pnpm --filter @aditunis/temporal-worker typecheck
git add aditunis/services/temporal-worker
git commit -m "feat(aditunis): add durable model lifecycle workflows"
```

---

### Task 8: End-to-end accessibility, privacy documentation, CI, and final verification

**Files:**
- Create: `aditunis/playwright.config.ts`
- Create: `aditunis/e2e/accessibility.spec.ts`
- Create: `aditunis/e2e/communication-flow.spec.ts`
- Create: `aditunis/docs/architecture/data-flow.md`
- Create: `aditunis/docs/privacy/foundation-privacy.md`
- Create: `aditunis/docs/model-cards/foundation-adapters.md`
- Create: `.github/workflows/aditunis-foundation.yml`

- [ ] **Step 1: Write E2E flow before final integration changes**

The test opens the app, loads a synthetic hypothesis, observes uncertainty, edits text, verifies Speak disabled, confirms, verifies Speak enabled, stubs browser speech output, invokes Speak, clears the draft, and verifies manual typing remains available.

- [ ] **Step 2: Add axe + keyboard accessibility checks**

```ts
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

Tab through every primary control, assert visible focus, and assert the live region announces low-confidence and error states. Automated checks do not replace the manual checklist recorded in `data-flow.md`.

- [ ] **Step 3: Document exact implemented data flow**

```text
browser/synthetic input
 -> adapter contract
 -> hypothesis + provenance
 -> editable draft
 -> participant confirmation
 -> browser TTS

synthetic PCM
 -> G.711 mu-law
 -> media-session abstraction
 -> localhost Twilio-compatible WebSocket harness
```

State explicitly that no live call, real Euphonia model, or real Personal VAD model is implemented in this slice.

- [ ] **Step 4: Document privacy controls and model-card status**

Record no recording by default, no participant data in git/tests, separate training consent, separately deletable speaker-profile artifacts, Personal VAD not used for authentication, raw communication content excluded from ordinary logs, typed fallback, emergency calling out of scope, and mock adapters labelled test doubles.

- [ ] **Step 5: Add CI**

```yaml
name: Aditunis Foundation
on:
  pull_request:
    paths: ["aditunis/**", ".github/workflows/aditunis-foundation.yml"]
jobs:
  verify:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: aditunis
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.15.1
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: aditunis/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
```

- [ ] **Step 6: Run complete local verification**

```bash
cd aditunis
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm e2e
cd ..
git diff master...HEAD --check
git status --short
```

- [ ] **Step 7: Scan for secrets/media**

```bash
grep -R -n -E 'TWILIO_AUTH_TOKEN|TWILIO_ACCOUNT_SID|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' aditunis .github/workflows/aditunis-foundation.yml || true
find aditunis -type f \( -name '*.wav' -o -name '*.mp3' -o -name '*.mp4' -o -name '*.m4a' \) -print
```

Expected: no secrets and no recordings.

- [ ] **Step 8: Commit**

```bash
git add aditunis .github/workflows/aditunis-foundation.yml
git commit -m "test(aditunis): verify foundation accessibility and privacy"
```

---

## Final Verification Gate

Before opening a PR:

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

Confirm every approved exit criterion:

- accessible demo ingests a synthetic communication event;
- event becomes typed `CommunicationHypothesis` with provenance;
- uncertainty is visible and announced;
- user can edit and explicitly confirm;
- Speak cannot run before confirmation;
- browser TTS receives only the confirmed draft;
- synthetic PCM passes the media abstraction and G.711 mu-law path;
- localhost WebSocket test proves Twilio-compatible framing without a call;
- Personal VAD failure degrades to ordinary processing;
- Personal Speech hypotheses cannot omit model provenance;
- Temporal enrollment and withdrawal workflows pass deterministic tests;
- privacy/data-flow/model-card documentation exists;
- no participant data, recordings, embeddings, or credentials are committed;
- no claim is made that the foundation is production telephony, an emergency service, validated atypical-speech ASR, or an Auslan translator.

## PR Scope

Open a **draft** PR from `feature/aditunis-foundation` to `master` only after final verification passes. Do not merge.

PR description states:

- **Implemented and verified locally:** communication contracts, draft/confirmation policy, synthetic adapters, accessible demo, codec/media harness, Twilio validation boundary, Temporal workflow skeleton, tests/docs.
- **In development / next slice:** real Euphonia personalised Whisper service and Personal VAD model integration.
- **Not implemented:** production PSTN calling, emergency calling, unrestricted Auslan translation, biometric authentication, autonomous calling.
