import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommunicationComposer } from "../src/components/CommunicationComposer";

describe("CommunicationComposer", () => {
  it("requires explicit confirmation before speaking", () => {
    render(<CommunicationComposer />);
    fireEvent.click(screen.getByRole("button", { name: /load synthetic speech/i }));
    expect(screen.getByRole("button", { name: /^speak$/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    expect(screen.getByRole("button", { name: /^speak$/i })).toBeEnabled();
  });

  it("keeps manual typing available and editing invalidates confirmation", () => {
    render(<CommunicationComposer />);
    const message = screen.getByLabelText(/message to speak/i);
    fireEvent.change(message, { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    expect(screen.getByRole("button", { name: /^speak$/i })).toBeEnabled();
    fireEvent.change(message, { target: { value: "hello again" } });
    expect(screen.getByRole("button", { name: /^speak$/i })).toBeDisabled();
  });

  it("announces low-confidence synthetic output", () => {
    render(<CommunicationComposer />);
    fireEvent.click(screen.getByRole("button", { name: /load synthetic speech/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/low confidence|medium confidence/i);
  });
});
