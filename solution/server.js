// WebTransport server: /echo (bidi stream) + /positions (datagram broadcast).
// Based on @fails-components/webtransport. API reference if versions differ:
// node_modules/@fails-components/webtransport/old_test/echoserver.js

import { Http3Server } from "@fails-components/webtransport";
import { readFileSync } from "fs";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { createHash, X509Certificate } from "crypto";

const WT_PORT = 4433;
const STATIC_PORT = 8080;

// SHA-256 of the DER cert. Handed to the browser as serverCertificateHashes so
// Chrome accepts the self-signed cert without any launch flags.
const cert = new X509Certificate(readFileSync("./cert.pem"));
const certHashHex = createHash("sha256").update(cert.raw).digest("hex");

// Static file server for the client pages (no framework).
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

createServer(async (req, res) => {
  const path = req.url === "/" ? "/index.html" : req.url;
  // Client fetches this to learn the current cert hash.
  if (path === "/cert-hash") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ hash: certHashHex }));
    return;
  }
  try {
    const filePath = join(process.cwd(), "public", path);
    const content = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "text/plain" });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(STATIC_PORT, () => {
  console.log(`Statische Dateien:   http://localhost:${STATIC_PORT}`);
});

// WebTransport/HTTP-3 server. Generate cert.pem/key.pem first (see README).
const server = new Http3Server({
  port: WT_PORT,
  host: "0.0.0.0",
  secret: "workshop-dev-secret", // any string, local session only
  cert: readFileSync("./cert.pem"),
  privKey: readFileSync("./key.pem"),
});

server.startServer();
console.log(`WebTransport-Server: https://localhost:${WT_PORT}`);
console.log(`Cert SHA-256:        ${certHashHex}`);
console.log(`Cert gueltig bis:    ${cert.validTo}  (Chrome verlangt <= 14 Tage)`);
console.log(`Signatur-Algo:       ${cert.sigAlgName ?? "?"}  (fuer serverCertificateHashes ECDSA/P-256 noetig)`);

// Part 1 / migration target: /echo -- bidirectional stream.
async function handleEcho() {
  const sessionStream = server.sessionStream("/echo");
  const sessionReader = sessionStream.getReader();

  while (true) {
    const { done, value: session } = await sessionReader.read();
    if (done) break;

    await session.ready;
    console.log("[echo] neue Session verbunden");

    const bidiReader = session.incomingBidirectionalStreams.getReader();
    while (true) {
      const { done: bidiDone, value: stream } = await bidiReader.read();
      if (bidiDone) break;

      const reader = stream.readable.getReader();
      const writer = stream.writable.getWriter();

      // Read each message, write it straight back.
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log("[echo] empfangen:", new TextDecoder().decode(value));
            await writer.write(value);
          }
        } catch (err) {
          // Client disconnected (tab closed / back): read() rejects with a
          // WebTransportError (code 0 = clean close). Not a real error.
          if (err?.name === "WebTransportError") {
            console.log("[echo] Session beendet");
          } else {
            console.error("[echo] Stream-Fehler:", err);
          }
        }
      })();
    }
  }
}

// Bonus: /positions -- datagram broadcast with simulated packet loss.
const positionClients = new Set();

async function handlePositions() {
  const sessionStream = server.sessionStream("/positions");
  const sessionReader = sessionStream.getReader();

  while (true) {
    const { done, value: session } = await sessionReader.read();
    if (done) break;

    await session.ready;
    console.log("[positions] neue Session verbunden");

    const writer = session.datagrams.createWritable().getWriter(); // .writable is deprecated
    positionClients.add(writer);

    const reader = session.datagrams.readable.getReader();
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Drop a random share of packets. Set via LOSS_RATE (0.0-1.0),
          // e.g. LOSS_RATE=0.2 npm start
          const lossRate = Number(process.env.LOSS_RATE ?? 0);
          if (Math.random() < lossRate) continue;

          // Broadcast to all other clients.
          for (const clientWriter of positionClients) {
            if (clientWriter === writer) continue;
            try {
              await clientWriter.write(value);
            } catch {
              positionClients.delete(clientWriter);
            }
          }
        }
      } catch (err) {
        if (err?.name === "WebTransportError") {
          console.log("[positions] Session beendet");
        } else {
          console.error("[positions] Datagram-Fehler:", err);
        }
      } finally {
        positionClients.delete(writer);
      }
    })();
  }
}

handleEcho();
handlePositions();
