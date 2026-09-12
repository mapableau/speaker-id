import { expect, it, vi } from "vitest";
import { withdrawalWorkflowLogic } from "../src/workflows";
import type { Activities } from "../src/types";
it("revokes training consent and deletes only training/model artifacts", async () => {
  const calls: string[] = [];
  const activities: Activities = {
    verifyTrainingConsent: vi.fn(async () => ({ valid: true })),
    validateApprovedSamples: vi.fn(async () => ({ valid: true })),
    trainPersonalModel: vi.fn(async () => ({ modelId: "m1", modelVersion: "1" })),
    evaluateHeldOutSamples: vi.fn(async () => ({ passed: true })),
    requestParticipantAcceptance: vi.fn(async () => ({ accepted: true })),
    promoteModel: vi.fn(async () => undefined),
    revokeTrainingConsent: vi.fn(async () => { calls.push("revoke"); }),
    deleteTrainingSamples: vi.fn(async () => { calls.push("samples"); return true; }),
    deleteDerivedModels: vi.fn(async () => { calls.push("models"); return true; }),
    recordWithdrawalCompletion: vi.fn(async () => { calls.push("record"); return { completedAt: "2026-09-12T00:00:00.000Z" }; })
  };
  const result = await withdrawalWorkflowLogic(activities, { participantId: "p1" });
  expect(calls).toEqual(["revoke", "samples", "models", "record"]);
  expect(result).toEqual({ status: "withdrawn", trainingSamplesDeleted: true, derivedModelsDeleted: true, completedAt: "2026-09-12T00:00:00.000Z" });
});
