import { expect, it } from "vitest";
import { MockPersonalSpeechAdapter, MockPersonalVadAdapter, OptionalPersonalVadGate, ProvenanceCheckedSpeechAdapter } from "../src";
const frame = { pcm16: new Int16Array([0]), sampleRateHz: 16000, timestampMs: 0 };
const profile = { profileId: "speaker-1", embeddingRef: "memory://speaker-1" };
const speechProfile = { profileId: "speech-1", modelId: "mock", modelVersion: "1" };
async function* stream() { yield frame; }
it("bypasses failed Personal VAD", async () => {
  const gate = new OptionalPersonalVadGate(new MockPersonalVadAdapter({ mode: "throw" }));
  await expect(gate.shouldProcess(frame, profile)).resolves.toEqual({ process: true, degraded: true });
});
it("forces confirmation and rejects missing provenance", async () => {
  const checked = new ProvenanceCheckedSpeechAdapter(new MockPersonalSpeechAdapter({ modelId: "", modelVersion: "1" }));
  await expect(checked.transcribe(stream(), speechProfile)).rejects.toThrow(/provenance/i);
});
