import { expect, it } from "vitest";
import { parseTwilioMediaEvent, TwilioMediaProtocolError } from "../src/messages";
it("parses connected, start, media, mark and stop", () => {
  expect(parseTwilioMediaEvent({ event: "connected" })).toEqual({ type: "connected" });
  expect(parseTwilioMediaEvent({ event: "start", streamSid: "MZ1", start: { callSid: "CA1" } })).toEqual({ type: "start", streamSid: "MZ1", callSid: "CA1" });
  expect(parseTwilioMediaEvent({ event: "media", streamSid: "MZ1", media: { payload: Buffer.from([0xff]).toString("base64") } })).toMatchObject({ type: "media", streamSid: "MZ1" });
  expect(parseTwilioMediaEvent({ event: "mark", streamSid: "MZ1", mark: { name: "done" } })).toEqual({ type: "mark", streamSid: "MZ1", name: "done" });
  expect(parseTwilioMediaEvent({ event: "stop", streamSid: "MZ1" })).toEqual({ type: "stop", streamSid: "MZ1" });
});
it("rejects invalid shapes", () => expect(() => parseTwilioMediaEvent({ event: "media" })).toThrow(TwilioMediaProtocolError));
it("rejects malformed media base64 instead of decoding garbage", () => {
  expect(() => parseTwilioMediaEvent({ event: "media", streamSid: "MZ1", media: { payload: "***" } })).toThrow(TwilioMediaProtocolError);
});
