import { useMemo, useState } from "react";
import type { SpeechOutputAdapter } from "@aditunis/model-contracts";
import { useSpeechOutput } from "../hooks/useSpeechOutput";
import { CATEGORY_META, DEFAULT_TILES, type CategoryKey } from "./tiles";
import { useSwitchScan } from "./useSwitchScan";

interface CommunicationBoardProps {
  onSendToComposer: (text: string) => void;
  speechOutput?: SpeechOutputAdapter;
}

export function CommunicationBoard({ onSendToComposer, speechOutput }: CommunicationBoardProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("needs");
  const [buildMode, setBuildMode] = useState(false);
  const [staged, setStaged] = useState<string[]>([]);
  const [switchMode, setSwitchMode] = useState(false);
  const [status, setStatus] = useState("Choose a phrase or build a sentence.");
  const browserSpeech = useSpeechOutput();
  const speech = speechOutput ?? browserSpeech;
  const scan = useSwitchScan({ enabled: switchMode, intervalMs: 1800 });

  const tiles = useMemo(
    () => DEFAULT_TILES.filter((tile) => tile.category === activeCategory),
    [activeCategory]
  );
  const sentence = staged.join(" ").trim();

  async function speak(text: string) {
    if (!text.trim()) return;
    try {
      await speech.speak(text);
      setStatus(`Speaking: ${text}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Speech output failed. Your message is still available.");
    }
  }

  function chooseTile(label: string) {
    if (buildMode) {
      setStaged((current) => [...current, label]);
      setStatus(`Added ${label} to the sentence.`);
      return;
    }
    void speak(label);
  }

  function clearSentence() {
    setStaged([]);
    setStatus("Sentence cleared. Choose a phrase or build a new sentence.");
  }

  function sendToComposer() {
    if (!sentence) return;
    onSendToComposer(sentence);
    setStaged([]);
    setStatus("Sent to the Aditunis composer for review and confirmation.");
  }

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="board-heading">
        <div>
          <h1 id="board-title">Communication board</h1>
          <p className="intro">Large participant-controlled phrase tiles adapted from the Lovable Aditunis prototype.</p>
        </div>
        <div className="board-tools" aria-label="Board controls">
          <button type="button" aria-pressed={buildMode} onClick={() => setBuildMode((value) => !value)}>
            {buildMode ? "Build sentence: on" : "Build sentence"}
          </button>
          <button type="button" aria-pressed={switchMode} onClick={() => setSwitchMode((value) => !value)}>
            {switchMode ? "Switch scanning: on" : "Switch scanning"}
          </button>
        </div>
      </div>

      <div className="status" role="status" aria-live="polite" aria-atomic="true">{status}</div>

      {switchMode && (
        <div className="scan-toolbar" aria-label="Switch scanning controls">
          <span>{scan.running ? "Scanning" : "Paused"} · {scan.total ? `${scan.index + 1} of ${scan.total}` : "no targets"}</span>
          <button type="button" onClick={scan.running ? scan.pause : scan.resume}>{scan.running ? "Pause" : "Resume"}</button>
          <button type="button" onClick={scan.step}>Next</button>
          <button type="button" onClick={scan.activate}>Activate</button>
        </div>
      )}

      <div className="category-tabs" role="tablist" aria-label="Phrase categories">
        {(Object.keys(CATEGORY_META) as CategoryKey[]).map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeCategory === category}
            onClick={() => {
              setActiveCategory(category);
              setStatus(`${CATEGORY_META[category].label} phrases selected.`);
            }}
          >
            {CATEGORY_META[category].label}
          </button>
        ))}
      </div>

      <p className="category-description">{CATEGORY_META[activeCategory].description}</p>
      {activeCategory === "emergency" && (
        <p className="safety-note"><strong>Communication only:</strong> these phrases do not place an emergency call or contact emergency services.</p>
      )}

      {buildMode && (
        <div className="sentence-tray" aria-label="Sentence being built">
          <strong>Sentence</strong>
          <p>{sentence || "Choose tiles below to add phrases."}</p>
          <div className="actions">
            <button type="button" disabled={!sentence} onClick={() => void speak(sentence)}>Speak sentence</button>
            <button type="button" disabled={!sentence} onClick={sendToComposer}>Send to composer</button>
            <button type="button" onClick={clearSentence}>Clear sentence</button>
          </div>
        </div>
      )}

      <div className="tile-grid" role="tabpanel" aria-label={`${CATEGORY_META[activeCategory].label} phrases`}>
        {tiles.map((tile, index) => (
          <button
            key={tile.id}
            type="button"
            className={`phrase-tile tile-${tile.category}`}
            data-tile-id={tile.id}
            onClick={() => chooseTile(tile.label)}
            aria-label={index < 9 ? `${tile.label}, phrase ${index + 1}` : tile.label}
          >
            <span className="tile-emoji" aria-hidden="true">{tile.emoji}</span>
            <span>{tile.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
