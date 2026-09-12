import { useState } from "react";
import { CommunicationComposer } from "./components/CommunicationComposer";
import { CommunicationBoard } from "./lovable/CommunicationBoard";
import "./styles.css";

type View = "composer" | "board";

export function App() {
  const [view, setView] = useState<View>("composer");
  const [prefill, setPrefill] = useState({ text: "", token: 0 });

  function sendBoardSentence(text: string) {
    setPrefill((current) => ({ text, token: current.token + 1 }));
    setView("composer");
  }

  return (
    <main id="main" className="app-shell">
      <header className="app-header">
        <div>
          <div className="brand">Aditunis</div>
          <p>Communication, your way.</p>
        </div>
        <nav className="view-tabs" aria-label="Aditunis communication views">
          <button type="button" aria-pressed={view === "composer"} onClick={() => setView("composer")}>Composer</button>
          <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")}>Board</button>
        </nav>
      </header>

      {view === "composer" ? (
        <CommunicationComposer prefillText={prefill.text} prefillToken={prefill.token} />
      ) : (
        <CommunicationBoard onSendToComposer={sendBoardSentence} />
      )}
    </main>
  );
}
