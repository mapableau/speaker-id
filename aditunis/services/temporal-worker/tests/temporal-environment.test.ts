import { afterAll, beforeAll, expect, it } from "vitest";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import type { Activities } from "../src/types";

let env: TestWorkflowEnvironment;

beforeAll(async () => {
  env = await TestWorkflowEnvironment.createLocal();
}, 30_000);

afterAll(async () => {
  await env?.teardown();
});

it("executes the actual enrollment workflow through the Temporal test environment", async () => {
  const calls: string[] = [];
  const activities: Activities = {
    verifyTrainingConsent: async () => { calls.push("consent"); return { valid: true }; },
    validateApprovedSamples: async () => { calls.push("samples"); return { valid: true }; },
    trainPersonalModel: async () => { calls.push("train"); return { modelId: "m1", modelVersion: "1" }; },
    evaluateHeldOutSamples: async () => { calls.push("evaluate"); return { passed: true }; },
    requestParticipantAcceptance: async () => { calls.push("accept"); return { accepted: true }; },
    promoteModel: async () => { calls.push("promote"); },
    revokeTrainingConsent: async () => undefined,
    deleteTrainingSamples: async () => true,
    deleteDerivedModels: async () => true,
    recordWithdrawalCompletion: async () => ({ completedAt: "2026-09-12T00:00:00.000Z" }),
  };
  const workflowsPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/workflows.ts");
  const taskQueue = "aditunis-enrollment-test";
  const worker = await Worker.create({ connection: env.nativeConnection, taskQueue, workflowsPath, activities });

  await worker.runUntil(async () => {
    const result = await env.client.workflow.execute("aditunisEnrollmentWorkflow", {
      taskQueue,
      workflowId: "aditunis-enrollment-test-1",
      args: [{ participantId: "p1", sampleSetId: "s1" }],
    });
    expect(result).toEqual({ status: "promoted", modelId: "m1", modelVersion: "1" });
  });
  expect(calls).toEqual(["consent", "samples", "train", "evaluate", "accept", "promote"]);
}, 30_000);
