import { once } from "node:events";
import { decodeMuLaw, encodeMuLaw } from "@aditunis/audio-codecs";
import { MediaSession } from "@aditunis/media-bridge";
import { WebSocketServer } from "ws";
import { createOutboundMediaMessage, parseTwilioMediaEvent } from "./messages";

export interface LocalMediaHarness {
  url: string;
  close(): Promise<void>;
}

export async function startLocalMediaHarness(): Promise<LocalMediaHarness> {
  const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
  await once(server, "listening");
  const address = server.address();
  if (typeof address === "string" || address === null) throw new Error("Unable to resolve local WebSocket address");

  server.on("connection", (socket) => {
    const session = new MediaSession();
    socket.on("message", (raw) => {
      const event = parseTwilioMediaEvent(JSON.parse(raw.toString()));
      if (event.type === "start") {
        session.start(event.streamSid);
        return;
      }
      if (event.type === "media") {
        if (session.state !== "started") throw new Error("Media arrived before start");
        const pcm = decodeMuLaw(event.payload);
        const encoded = encodeMuLaw(pcm);
        session.acceptOutbound(encoded);
        socket.send(JSON.stringify(createOutboundMediaMessage(event.streamSid, encoded)));
      }
      if (event.type === "stop" && session.state === "started") session.stop();
    });
  });

  return {
    url: `ws://127.0.0.1:${address.port}`,
    close: async () => {
      for (const client of server.clients) client.terminate();
      server.close();
      await once(server, "close");
    },
  };
}
