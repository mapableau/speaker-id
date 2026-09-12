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
export interface SpeechOutputAdapter {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  renderAudio?(text: string): Promise<AudioBuffer>;
}

const modalities = new Set<CommunicationModality>(["personal-speech", "sign", "aac", "typed-text"]);
function assertConfidence(value: unknown, field: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${field} must be between 0 and 1`);
  }
}
export function assertCommunicationHypothesis(value: unknown): CommunicationHypothesis {
  if (!value || typeof value !== "object") throw new TypeError("hypothesis must be an object");
  const h = value as Partial<CommunicationHypothesis>;
  if (!h.modality || !modalities.has(h.modality)) throw new TypeError("invalid modality");
  if (typeof h.text !== "string") throw new TypeError("text must be a string");
  assertConfidence(h.confidence, "confidence");
  if (!Array.isArray(h.alternatives)) throw new TypeError("alternatives must be an array");
  for (const [i, alt] of h.alternatives.entries()) {
    if (!alt || typeof alt.text !== "string") throw new TypeError(`alternative ${i} text must be a string`);
    assertConfidence(alt.confidence, `alternative ${i} confidence`);
  }
  if (typeof h.modelId !== "string" || !h.modelId.trim()) throw new Error("model provenance requires modelId");
  if (typeof h.modelVersion !== "string" || !h.modelVersion.trim()) throw new Error("model provenance requires modelVersion");
  if (h.requiresConfirmation !== true) throw new Error("model hypotheses must require confirmation");
  return h as CommunicationHypothesis;
}
