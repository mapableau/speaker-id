import type { CommunicationDraft, CommunicationHypothesis } from "@aditunis/model-contracts";

export function createDraft(source: CommunicationHypothesis): CommunicationDraft {
  return { text: source.text, source, confirmed: false, lastEditedAt: null };
}

export function editDraft(draft: CommunicationDraft, text: string): CommunicationDraft {
  return { ...draft, text, confirmed: false, lastEditedAt: new Date().toISOString() };
}

export function confirmDraft(draft: CommunicationDraft): CommunicationDraft {
  if (!draft.text.trim()) throw new Error("Cannot confirm an empty message");
  return { ...draft, confirmed: true };
}

export function clearDraft(): CommunicationDraft {
  return { text: "", source: null, confirmed: false, lastEditedAt: null };
}
