export type MediaSessionState = "idle" | "started" | "stopped";

export class MediaSession {
  private _state: MediaSessionState = "idle";
  private streamSid: string | null = null;
  private outboundFrames: Uint8Array[] = [];

  get state(): MediaSessionState { return this._state; }
  get activeStreamSid(): string | null { return this.streamSid; }

  start(streamSid: string): void {
    if (this._state === "started") throw new Error("Media session already started");
    if (!streamSid.trim()) throw new Error("streamSid is required");
    this.streamSid = streamSid;
    this._state = "started";
  }

  acceptOutbound(frame: Uint8Array): void {
    if (this._state !== "started") throw new Error("Media session is not started");
    this.outboundFrames.push(frame.slice());
  }

  drainOutbound(): Uint8Array[] {
    const frames = this.outboundFrames.map((frame) => frame.slice());
    this.outboundFrames = [];
    return frames;
  }

  stop(): void {
    if (this._state !== "started") throw new Error("Media session is not started");
    this._state = "stopped";
  }
}
