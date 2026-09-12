import type { AudioChunkStream, CommunicationHypothesis, PersonalSpeechAdapter, SpeechProfile } from "@aditunis/model-contracts";

export class ProvenanceCheckedSpeechAdapter implements PersonalSpeechAdapter {
  private readonly inner: PersonalSpeechAdapter;

  constructor(inner: PersonalSpeechAdapter) {
    this.inner = inner;
  }

  async transcribe(input: AudioChunkStream, profile: SpeechProfile): Promise<CommunicationHypothesis> {
    const result = await this.inner.transcribe(input, profile);
    if (!result.modelId.trim() || !result.modelVersion.trim()) {
      throw new Error("Speech hypothesis is missing model provenance");
    }
    return { ...result, requiresConfirmation: true };
  }
}
