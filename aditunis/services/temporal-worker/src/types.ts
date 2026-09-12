export interface EnrollmentInput { participantId: string; sampleSetId: string; }
export type EnrollmentResult =
  | { status: "promoted"; modelId: string; modelVersion: string }
  | { status: "not-promoted" };
export interface WithdrawalInput { participantId: string; }
export interface WithdrawalResult {
  status: "withdrawn";
  trainingSamplesDeleted: boolean;
  derivedModelsDeleted: boolean;
  completedAt: string;
}
export interface Activities {
  verifyTrainingConsent(input: EnrollmentInput): Promise<{ valid: boolean }>;
  validateApprovedSamples(input: EnrollmentInput): Promise<{ valid: boolean }>;
  trainPersonalModel(input: EnrollmentInput): Promise<{ modelId: string; modelVersion: string }>;
  evaluateHeldOutSamples(input: { participantId: string; modelId: string; modelVersion: string }): Promise<{ passed: boolean }>;
  requestParticipantAcceptance(input: { participantId: string; modelId: string; modelVersion: string }): Promise<{ accepted: boolean }>;
  promoteModel(input: { participantId: string; modelId: string; modelVersion: string }): Promise<void>;
  revokeTrainingConsent(input: WithdrawalInput): Promise<void>;
  deleteTrainingSamples(input: WithdrawalInput): Promise<boolean>;
  deleteDerivedModels(input: WithdrawalInput): Promise<boolean>;
  recordWithdrawalCompletion(input: WithdrawalInput): Promise<{ completedAt: string }>;
}
