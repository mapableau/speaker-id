export type ConfidenceBand = "low" | "medium" | "high";

export function classifyConfidence(value: number): ConfidenceBand {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("confidence must be between 0 and 1");
  }
  if (value < 0.65) return "low";
  if (value < 0.9) return "medium";
  return "high";
}
