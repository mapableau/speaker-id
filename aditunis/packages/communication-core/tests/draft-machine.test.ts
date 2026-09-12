import { expect, it } from "vitest";
import { clearDraft, confirmDraft, createDraft, editDraft } from "../src/draft-machine";
const source = { modality: "personal-speech" as const, text: "call taxi", confidence: 0.74, alternatives: [], modelId: "mock", modelVersion: "1", requiresConfirmation: true };
it("starts unconfirmed and editing invalidates confirmation", () => {
  const draft = createDraft(source);
  expect(draft.confirmed).toBe(false);
  expect(editDraft(confirmDraft(draft), "please call a taxi").confirmed).toBe(false);
});
it("does not confirm empty drafts", () => expect(() => confirmDraft(clearDraft())).toThrow(/empty/i));
