import type {
  AudioChunkStream,
  AudioFrame,
  CommunicationHypothesis,
  PersonalSpeechAdapter,
  PersonalVadAdapter,
  PersonalVadResult,
  SpeakerProfile,
  SpeechProfile,
} from "@aditunis/model-contracts";

type SpeechOptions = { modelId?: string; modelVersion?: string; text?: string; confidence?: number };
type VadOptions = { mode?: "target" | "other" | "silence" | "throw" };

export class MockPersonalSpeechAdapter implements PersonalSpeechAdapter {
  private readonly options: SpeechOptions;

  constructor(options: SpeechOptions = {}) {
    this.options = options;
  }

  async transcribe(_input: AudioChunkStream, _profile: SpeechProfile): Promise<CommunicationHypothesis> {
    return {
      modality: "personal-speech",
      text: this.options.text ?? "synthetic speech",
      confidence: this.options.confidence ?? 0.72,
      alternatives: [],
      modelId: this.options.modelId ?? "mock-euphonia",
      modelVersion: this.options.modelVersion ?? "0.0.1",
      requiresConfirmation: true,
    };
  }
}

export class MockPersonalVadAdapter implements PersonalVadAdapter {
  private readonly options: VadOptions;

  constructor(options: VadOptions = {}) {
    this.options = options;
  }

  async classify(_frame: AudioFrame, _profile: SpeakerProfile): Promise<PersonalVadResult> {
    switch (this.options.mode ?? "target") {
      case "throw": throw new Error("synthetic VAD failure");
      case "other": return { targetSpeechProbability: 0.1, otherSpeechProbability: 0.85, nonSpeechProbability: 0.05 };
      case "silence": return { targetSpeechProbability: 0.05, otherSpeechProbability: 0.05, nonSpeechProbability: 0.9 };
      case "target": return { targetSpeechProbability: 0.9, otherSpeechProbability: 0.05, nonSpeechProbability: 0.05 };
    }
  }
}
