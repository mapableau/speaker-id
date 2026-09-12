import type { AudioFrame, PersonalVadAdapter, SpeakerProfile } from "@aditunis/model-contracts";

export interface VadGateDecision {
  process: boolean;
  degraded: boolean;
}

export class OptionalPersonalVadGate {
  private readonly adapter: PersonalVadAdapter;

  constructor(adapter: PersonalVadAdapter) {
    this.adapter = adapter;
  }

  async shouldProcess(frame: AudioFrame, profile: SpeakerProfile): Promise<VadGateDecision> {
    try {
      const result = await this.adapter.classify(frame, profile);
      return { process: result.targetSpeechProbability >= 0.5, degraded: false };
    } catch {
      return { process: true, degraded: true };
    }
  }
}
