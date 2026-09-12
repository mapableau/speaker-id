import { expect, it } from "vitest";
import { parseTwilioMediaEvent, TwilioMediaProtocolError } from "../src/messages";

it("parses connected, start, media, DTMF, mark and stop", () => {
  expect(parseTwilioMediaEvent({ event: "connected" })).toEqual({ type: "connected" });
  expect(parseTwilioMediaEvent({
    event: "start",
    streamSid: "MZ1",
    start: {
      callSid: "CA1",
      mediaFormat: { encoding: "audio/x-mulaw", sampleRate: 8000, channels: 1 },
    },
  })).toEqual({
    type: "start",
    streamSid: "MZ1",
    callSid: "CA1",
    mediaFormat: { encoding: "audio/x-mulaw", sampleRateHz: 8000, channels: 1 },
  });
  expect(parseTwilioMediaEvent({
    event: "media",
    streamSid: "MZ1",
    media: { payload: Buffer.from([0xff]).toString("base64") },
  })).toMatchObject({ type: "media", streamSid: "MZ1" });
  expect(parseTwilioMediaEvent({
    event: "dtmf",
    streamSid: "MZ1",
    dtmf: { track: "inbound_track", digit: "5" },
  })).toEqual({ type: "dtmf", streamSid: "MZ1", digit: "5" });
  expect(parseTwilioMediaEvent({ event: "mark", streamSid: "MZ1", mark: { name: "done" } })).toEqual({ type: "mark", streamSid: "MZ1", name: "done" });
  expect(parseTwilioMediaEvent({ event: "stop", streamSid: "MZ1" })).toEqual({ type: "stop", streamSid: "MZ1" });
});

it("rejects invalid shapes", () => expect(() => parseTwilioMediaEvent({ event: "media" })).toThrow(TwilioMediaProtocolError));

it("rejects malformed media base64 instead of decoding garbage", () => {
  expect(() => parseTwilioMediaEvent({ event: "media", streamSid: "MZ1", media: { payload: "***" } })).toThrow(TwilioMediaProtocolError);
});

it("rejects a start message whose declared codec cannot be handled by the mu-law bridge", () => {
  expect(() => parseTwilioMediaEvent({
    event: "start",
    streamSid: "MZ1",
    start: {
      callSid: "CA1",
      mediaFormat: { encoding: "audio/pcm", sampleRate: 16000, channels: 2 },
    },
  })).toThrow(/media format/i);
});
