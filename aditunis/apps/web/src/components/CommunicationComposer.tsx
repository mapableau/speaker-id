import { useState } from "react";
import { clearDraft, confirmDraft, createDraft, editDraft } from "@aditunis/communication-core";
import type { CommunicationDraft, CommunicationHypothesis, SpeechOutputAdapter } from "@aditunis/model-contracts";
import { ConfidenceStatus } from "./ConfidenceStatus";
import { useSpeechOutput } from "../hooks/useSpeechOutput";

const syntheticHypothesis: CommunicationHypothesis = {
  modality: "personal-speech",
  text: "Please give me more time to respond",
  confidence: 0.61,
  alternatives: [{ text: "Please wait for my response", confidence: 0.29 }],
  modelId: "mock-euphonia",
  modelVersion: "0.0.1",
  requiresConfirmation: true,
};

interface CommunicationComposerProps {
  speechOutput?: SpeechOutputAdapter;
}

export function CommunicationComposer({ speechOutput }: CommunicationComposerProps = {}) {
  const [draft, setDraft] = useState<CommunicationDraft>(clearDraft());
  const [statusText, setStatusText] = useState("Manual typing is available.");
  const browserSpeech = useSpeechOutput();
  const speech = speechOutput ?? browserSpeech;

  function onLoadSynthetic() {
    setDraft(createDraft(syntheticHypothesis));
    setStatusText("Low confidence recognition loaded. Review, edit, then confirm before speaking.");
  }

  function onEdit(text: string) {
    setDraft((current) => editDraft(current, text));
    setStatusText("Message edited. Confirmation is required before speaking.");
  }

  function onConfirm() {
    try {
      setDraft((current) => confirmDraft(current));
      setStatusText("Message confirmed and ready to speak.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unable to confirm message.");
    }
  }

  async function onSpeak() {
    if (!draft.confirmed) return;
    try {
      await speech.speak(draft.text);
      setStatusText("Speaking confirmed message.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Speech output failed. Your draft has been preserved.");
    }
  }

  function onClear() {
    setDraft(clearDraft());
    setStatusText("Message cleared. Manual typing is available.");
  }

  return (
    <section className="composer" aria-labelledby="composer-title">
      <h1 id="composer-title">Aditunis communication demo</h1>
      <p className="intro">You control what Aditunis says. Recognition suggestions are never spoken until you confirm them.</p>
      <div className="status" role="status" aria-live="polite" aria-atomic="true">{statusText}</div>
      <ConfidenceStatus confidence={draft.source?.confidence ?? null} />
      <label htmlFor="message">Message to speak</label>
      <textarea id="message" rows={5} value={draft.text} onChange={(event) => onEdit(event.target.value)} />
      <div className="actions" aria-label="Communication controls">
        <button type="button" onClick={onLoadSynthetic}>Load synthetic speech</button>
        <button type="button" onClick={onConfirm} disabled={!draft.text.trim()}>Confirm</button>
        <button type="button" disabled={!draft.confirmed} onClick={onSpeak}>Speak</button>
        <button type="button" onClick={onClear}>Clear</button>
      </div>
    </section>
  );
}
