import { classifyConfidence } from "@aditunis/communication-core";

export function ConfidenceStatus({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;
  const band = classifyConfidence(confidence);
  return <p><strong>{band[0].toUpperCase() + band.slice(1)} confidence.</strong> Confirm or edit the message before speaking.</p>;
}
