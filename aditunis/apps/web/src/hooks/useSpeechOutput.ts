import { useMemo } from "react";
import type { SpeechOutputAdapter } from "@aditunis/model-contracts";

export class BrowserSpeechOutputAdapter implements SpeechOutputAdapter {
  async speak(text: string): Promise<void> {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      throw new Error("Speech output is unavailable");
    }
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async stop(): Promise<void> {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
}

export function useSpeechOutput(): SpeechOutputAdapter {
  return useMemo(() => new BrowserSpeechOutputAdapter(), []);
}
