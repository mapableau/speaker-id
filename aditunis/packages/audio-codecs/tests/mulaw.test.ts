import { expect, it } from "vitest";
import { decodeMuLaw, encodeMuLaw } from "../src/mulaw";
it("round trips representative PCM within mu-law tolerance", () => {
  const pcm = new Int16Array([-12000, -4000, -1000, 0, 1000, 4000, 12000]);
  const decoded = decodeMuLaw(encodeMuLaw(pcm));
  expect(decoded).toHaveLength(pcm.length);
  decoded.forEach((sample, i) => expect(Math.abs(sample - pcm[i])).toBeLessThan(1200));
});
it("clips extreme samples", () => {
  const decoded = decodeMuLaw(encodeMuLaw(new Int16Array([-32768, 32767])));
  expect(Math.abs(decoded[0])).toBeLessThanOrEqual(32635);
  expect(Math.abs(decoded[1])).toBeLessThanOrEqual(32635);
});
