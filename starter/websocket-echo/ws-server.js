// WebSocket "before" example for the migration (Part 2).
// Classic ws echo server. Start: npm run ws-demo -> http://localhost:8090

import { WebSocketServer } from "ws";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { join } from "path";

const PORT = 8090;

// HTTP server serves the client page ...
const httpServer = createServer(async (req, res) => {
  try {
    const html = await readFile(join(process.cwd(), "websocket-echo", "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

// ... ws server rides on the same HTTP server (classic upgrade).
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  console.log("[ws] Client verbunden");
  // Echo each message back unchanged.
  socket.on("message", (data) => {
    console.log("[ws] empfangen:", data.toString());
    socket.send(data.toString());
  });
  socket.on("close", () => console.log("[ws] Client getrennt"));
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket-Echo (Vorher-Beispiel): http://localhost:${PORT}`);
});
