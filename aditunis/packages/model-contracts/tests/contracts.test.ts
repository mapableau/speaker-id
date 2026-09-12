import { expect, it } from "vitest";
import { assertCommunicationHypothesis } from "../src/index";

it("carries model provenance and mandatory confirmation", () => {
  const value = assertCommunicationHypothesis({
    modality: "personal-speech", text: "hello", confidence: 0.82,
    alternatives: [{ text: "yellow", confidence: 0.11 }], modelId: "mock-euphonia",
    modelVersion: "0.0.1", requiresConfirmation: true
  });
  expect(value.requiresConfirmation).toBe(true);
  expect(value.modelId).toBe("mock-euphonia");
});

it("rejects out-of-range confidence", () => {
  expect(() => assertCommunicationHypothesis({
    modality: "personal-speech", text: "hello", confidence: 1.2, alternatives: [],
    modelId: "mock", modelVersion: "1", requiresConfirmation: true
  })).toThrow(RangeError);
});
