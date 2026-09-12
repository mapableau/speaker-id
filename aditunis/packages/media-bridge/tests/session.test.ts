import { expect, it } from "vitest";
import { MediaSession } from "../src/session";
it("requires start before outbound media and supports stop", () => {
  const session = new MediaSession();
  expect(() => session.acceptOutbound(new Uint8Array([0xff]))).toThrow(/not started/i);
  session.start("MZ123");
  expect(session.state).toBe("started");
  expect(() => session.start("MZ456")).toThrow(/already started/i);
  session.stop();
  expect(session.state).toBe("stopped");
});
it("copies outbound media so caller mutations cannot alter queued bytes", () => {
  const session = new MediaSession();
  session.start("MZ123");
  const frame = new Uint8Array([1, 2]);
  session.acceptOutbound(frame);
  frame[0] = 9;
  expect(session.drainOutbound()[0][0]).toBe(1);
});
