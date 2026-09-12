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
      const payload = text(media.payload, "media.payload");
      try {
        return { type: "media", streamSid, payload: Uint8Array.from(Buffer.from(payload, "base64")) };
      } catch {
        throw new TwilioMediaProtocolError("media.payload must be valid base64");
      }
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
