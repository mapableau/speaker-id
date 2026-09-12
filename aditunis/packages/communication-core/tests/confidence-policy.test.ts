import { expect, it } from "vitest";
import { classifyConfidence } from "../src/confidence-policy";
it("classifies confidence bands", () => {
  expect(classifyConfidence(0.49)).toBe("low");
  expect(classifyConfidence(0.79)).toBe("medium");
  expect(classifyConfidence(0.95)).toBe("high");
});
it("rejects invalid confidence", () => expect(() => classifyConfidence(1.1)).toThrow(RangeError));
