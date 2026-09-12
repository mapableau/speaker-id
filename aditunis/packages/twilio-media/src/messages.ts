export interface TwilioMediaFormat {
  encoding: "audio/x-mulaw";
  sampleRateHz: 8000;
  channels: 1;
}

export type TwilioMediaEvent =
  | { type: "connected" }
  | { type: "start"; streamSid: string; callSid: string; mediaFormat: TwilioMediaFormat }
  | { type: "media"; streamSid: string; payload: Uint8Array }
  | { type: "dtmf"; streamSid: string; digit: string }
  | { type: "mark"; streamSid: string; name: string }
  | { type: "stop"; streamSid: string };

export class TwilioMediaProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TwilioMediaProtocolError";
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TwilioMediaProtocolError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) {
    throw new TwilioMediaProtocolError(`${label} must be a non-empty string`);
  }
  return value;
}

function decodeBase64(payload: string): Uint8Array {
  if (payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) {
    throw new TwilioMediaProtocolError("media.payload must be valid base64");
  }
  const bytes = Buffer.from(payload, "base64");
  if (bytes.toString("base64") !== payload) {
    throw new TwilioMediaProtocolError("media.payload must be canonical base64");
  }
  return Uint8Array.from(bytes);
}

function parseMediaFormat(value: unknown): TwilioMediaFormat {
  const format = object(value, "start.mediaFormat");
  if (
    format.encoding !== "audio/x-mulaw" ||
    format.sampleRate !== 8000 ||
    format.channels !== 1
  ) {
    throw new TwilioMediaProtocolError(
      "Unsupported media format; expected audio/x-mulaw at 8000 Hz mono",
    );
  }
  return { encoding: "audio/x-mulaw", sampleRateHz: 8000, channels: 1 };
}

export function parseTwilioMediaEvent(input: unknown): TwilioMediaEvent {
  const root = object(input, "event");
  const event = text(root.event, "event.event");
  if (event === "connected") return { type: "connected" };
  const streamSid = text(root.streamSid, "streamSid");

  switch (event) {
    case "start": {
      const start = object(root.start, "start");
      const nestedStreamSid = text(start.streamSid ?? streamSid, "start.streamSid");
      if (nestedStreamSid !== streamSid) {
        throw new TwilioMediaProtocolError("start.streamSid does not match streamSid");
      }
      return {
        type: "start",
        streamSid,
        callSid: text(start.callSid, "start.callSid"),
        mediaFormat: parseMediaFormat(start.mediaFormat),
      };
    }
    case "media": {
      const media = object(root.media, "media");
      return {
        type: "media",
        streamSid,
        payload: decodeBase64(text(media.payload, "media.payload")),
      };
    }
    case "dtmf": {
      const dtmf = object(root.dtmf, "dtmf");
      const digit = text(dtmf.digit, "dtmf.digit");
      if (!/^[0-9*#]$/.test(digit)) {
        throw new TwilioMediaProtocolError("dtmf.digit must be one DTMF digit");
      }
      return { type: "dtmf", streamSid, digit };
    }
    case "mark": {
      const mark = object(root.mark, "mark");
      return { type: "mark", streamSid, name: text(mark.name, "mark.name") };
    }
    case "stop":
      return { type: "stop", streamSid };
    default:
      throw new TwilioMediaProtocolError(`unsupported Twilio event: ${event}`);
  }
}

export function createOutboundMediaMessage(streamSid: string, payload: Uint8Array) {
  return {
    event: "media" as const,
    streamSid,
    media: { payload: Buffer.from(payload).toString("base64") },
  };
}
