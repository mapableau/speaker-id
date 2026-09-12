import { proxyActivities } from "@temporalio/workflow";
import type { Activities, EnrollmentInput, EnrollmentResult, WithdrawalInput, WithdrawalResult } from "./types";

const activities = proxyActivities<Activities>({
  startToCloseTimeout: "10 minutes",
  retry: { maximumAttempts: 3 },
});

export async function enrollmentWorkflowLogic(activitySet: Activities, input: EnrollmentInput): Promise<EnrollmentResult> {
  const consent = await activitySet.verifyTrainingConsent(input);
  if (!consent.valid) throw new Error("Training consent is not valid");

  const samples = await activitySet.validateApprovedSamples(input);
  if (!samples.valid) throw new Error("Participant-approved samples are not valid");

  const model = await activitySet.trainPersonalModel(input);
  const evaluation = await activitySet.evaluateHeldOutSamples({ participantId: input.participantId, ...model });
  if (!evaluation.passed) return { status: "not-promoted" };

  const acceptance = await activitySet.requestParticipantAcceptance({ participantId: input.participantId, ...model });
  if (!acceptance.accepted) return { status: "not-promoted" };

  await activitySet.promoteModel({ participantId: input.participantId, ...model });
  return { status: "promoted", ...model };
}

export async function withdrawalWorkflowLogic(activitySet: Activities, input: WithdrawalInput): Promise<WithdrawalResult> {
  await activitySet.revokeTrainingConsent(input);
  const trainingSamplesDeleted = await activitySet.deleteTrainingSamples(input);
  const derivedModelsDeleted = await activitySet.deleteDerivedModels(input);
  const completion = await activitySet.recordWithdrawalCompletion(input);
  return {
    status: "withdrawn",
    trainingSamplesDeleted,
    derivedModelsDeleted,
    completedAt: completion.completedAt,
  };
}

export async function aditunisEnrollmentWorkflow(input: EnrollmentInput): Promise<EnrollmentResult> {
  return enrollmentWorkflowLogic(activities, input);
}

export async function withdrawTrainingConsentWorkflow(input: WithdrawalInput): Promise<WithdrawalResult> {
  return withdrawalWorkflowLogic(activities, input);
}
