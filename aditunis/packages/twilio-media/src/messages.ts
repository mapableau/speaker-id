export type TwilioMediaEvent =
  | { type: "connected" }
  | { type: "start"; streamSid: string; callSid: string }
  | { type: "media"; streamSid: string; payload: Uint8Array }
  | { type: "mark"; streamSid: string; name: string }
  | { type: "stop"; streamSid: string };

export class TwilioMediaProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TwilioMediaProtocolError";
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TwilioMediaProtocolError(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) throw new TwilioMediaProtocolError(`${label} must be a non-empty string`);
  return value;
}

function decodeBase64(payload: string): Uint8Array {
  if (payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) {
    throw new TwilioMediaProtocolError("media.payload must be valid base64");
  }
  const bytes = Buffer.from(payload, "base64");
  if (bytes.toString("base64") !== payload) throw new TwilioMediaProtocolError("media.payload must be canonical base64");
  return Uint8Array.from(bytes);
}

export function parseTwilioMediaEvent(input: unknown): TwilioMediaEvent {
  const root = object(input, "event");
  const event = text(root.event, "event.event");
  if (event === "connected") return { type: "connected" };
  const streamSid = text(root.streamSid, "streamSid");

  switch (event) {
    case "start": {
      const start = object(root.start, "start");
      return { type: "start", streamSid, callSid: text(start.callSid, "start.callSid") };
    }
    case "media": {
      const media = object(root.media, "media");
      return { type: "media", streamSid, payload: decodeBase64(text(media.payload, "media.payload")) };
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
