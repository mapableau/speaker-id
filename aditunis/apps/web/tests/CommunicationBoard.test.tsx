import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SpeechOutputAdapter } from "@aditunis/model-contracts";
import { CommunicationBoard } from "../src/lovable/CommunicationBoard";

function speechMock() {
  const speak = vi.fn(async () => undefined);
  const stop = vi.fn(async () => undefined);
  return { adapter: { speak, stop } satisfies SpeechOutputAdapter, speak };
}

describe("Lovable communication board integration", () => {
  it("speaks a participant-selected phrase directly", async () => {
    const { adapter, speak } = speechMock();
    render(<CommunicationBoard onSendToComposer={() => undefined} speechOutput={adapter} />);
    fireEvent.click(screen.getByRole("button", { name: /I need water, phrase 1/i }));
    await waitFor(() => expect(speak).toHaveBeenCalledWith("I need water"));
  });

  it("builds a sentence and sends it to the Aditunis confirmation composer", () => {
    const { adapter } = speechMock();
    const onSend = vi.fn();
    render(<CommunicationBoard onSendToComposer={onSend} speechOutput={adapter} />);

    fireEvent.click(screen.getByRole("button", { name: /^Build sentence$/i }));
    fireEvent.click(screen.getByRole("button", { name: /I need water, phrase 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /I am hungry, phrase 2/i }));
    fireEvent.click(screen.getByRole("button", { name: /Send to composer/i }));

    expect(onSend).toHaveBeenCalledWith("I need water I am hungry");
  });

  it("labels emergency tiles as communication only", () => {
    const { adapter } = speechMock();
    render(<CommunicationBoard onSendToComposer={() => undefined} speechOutput={adapter} />);
    fireEvent.click(screen.getByRole("tab", { name: "Emergency" }));
    expect(screen.getByText(/do not place an emergency call/i)).toBeInTheDocument();
  });
});
