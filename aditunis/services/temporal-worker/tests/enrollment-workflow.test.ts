import { expect, it, vi } from "vitest";
import { enrollmentWorkflowLogic } from "../src/workflows";
import type { Activities } from "../src/types";

function activities(accepted: boolean, calls: string[]): Activities {
  return {
    verifyTrainingConsent: vi.fn(async () => { calls.push("consent"); return { valid: true }; }),
    validateApprovedSamples: vi.fn(async () => { calls.push("samples"); return { valid: true }; }),
    trainPersonalModel: vi.fn(async () => { calls.push("train"); return { modelId: "m1", modelVersion: "1" }; }),
    evaluateHeldOutSamples: vi.fn(async () => { calls.push("evaluate"); return { passed: true }; }),
    requestParticipantAcceptance: vi.fn(async () => { calls.push("accept"); return { accepted }; }),
    promoteModel: vi.fn(async () => { calls.push("promote"); }),
    revokeTrainingConsent: vi.fn(async () => undefined),
    deleteTrainingSamples: vi.fn(async () => true),
    deleteDerivedModels: vi.fn(async () => true),
    recordWithdrawalCompletion: vi.fn(async () => ({ completedAt: "2026-09-12T00:00:00.000Z" }))
  };
}

it("runs enrollment in order and promotes only after participant acceptance", async () => {
  const calls: string[] = [];
  const result = await enrollmentWorkflowLogic(activities(true, calls), { participantId: "p1", sampleSetId: "s1" });
  expect(calls).toEqual(["consent", "samples", "train", "evaluate", "accept", "promote"]);
  expect(result.status).toBe("promoted");
});

it("does not promote a model rejected by the participant", async () => {
  const calls: string[] = [];
  const result = await enrollmentWorkflowLogic(activities(false, calls), { participantId: "p1", sampleSetId: "s1" });
  expect(calls).toEqual(["consent", "samples", "train", "evaluate", "accept"]);
  expect(result).toEqual({ status: "not-promoted" });
});
