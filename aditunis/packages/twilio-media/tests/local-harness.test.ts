import { once } from "node:events";
import { expect, it } from "vitest";
import WebSocket from "ws";
import { encodeMuLaw } from "@aditunis/audio-codecs";
import { startLocalMediaHarness } from "../src/local-harness";

it("round trips synthetic media on loopback", async () => {
  const harness = await startLocalMediaHarness();
  const client = new WebSocket(harness.url);
  await once(client, "open");
  client.send(JSON.stringify({
    event: "start",
    streamSid: "MZ1",
    start: {
      streamSid: "MZ1",
      callSid: "CA1",
      mediaFormat: { encoding: "audio/x-mulaw", sampleRate: 8000, channels: 1 },
    },
  }));
  client.send(JSON.stringify({
    event: "media",
    streamSid: "MZ1",
    media: {
      payload: Buffer.from(encodeMuLaw(new Int16Array([0, 1000, -1000]))).toString("base64"),
    },
  }));
  const [raw] = await once(client, "message");
  const event = JSON.parse(raw.toString());
  expect(event.event).toBe("media");
  expect(event.streamSid).toBe("MZ1");
  expect(typeof event.media.payload).toBe("string");
  client.close();
  await harness.close();
});
