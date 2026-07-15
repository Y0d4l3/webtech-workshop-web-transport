// Part 1: open a WebTransport bidi stream and echo messages off the server.
// STARTER: fill in the TODOs -- see exercises/part-1-echo-stream.md (Task A).

const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");

function log(text) {
  logEl.textContent += text + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

let writer;
let reader;

async function connect() {
  // Fetch the current cert hash so Chrome trusts the self-signed cert (no flags).
  const { hash } = await (await fetch("/cert-hash")).json();
  const hashBytes = Uint8Array.from(hash.match(/../g).map((h) => parseInt(h, 16)));

  // 127.0.0.1, not localhost: browsers may try IPv6 (::1) first, where the
  // IPv4-bound server isn't listening -> ERR_CONNECTION_REFUSED.
  const transport = new WebTransport("https://127.0.0.1:4433/echo", {
    serverCertificateHashes: [{ algorithm: "sha-256", value: hashBytes }],
  });

  await transport.ready;
  statusEl.textContent = "verbunden";
  log("Verbindung steht.");

  // TODO (Task A): open a bidirectional stream with transport.createBidirectionalStream(),
  // then assign `writer = stream.writable.getWriter()` and `reader = stream.readable.getReader()`,
  // and start the read loop by calling readLoop().

  transport.closed
    .then(() => {
      statusEl.textContent = "getrennt";
      log("Verbindung geschlossen.");
    })
    .catch((err) => {
      statusEl.textContent = "Fehler";
      log("Verbindung mit Fehler beendet: " + err);
    });
}

async function readLoop() {
  // TODO (Task A): loop over reader.read(); decode each value with TextDecoder and
  // log it as "<- " + text; stop when `done` is true.
}

async function sendMessage() {
  const text = messageInput.value;
  if (!text || !writer) return;
  log("-> " + text);
  // TODO (Task A): encode `text` with TextEncoder and write it via writer.write(...).
  messageInput.value = "";
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

connect().catch((err) => {
  statusEl.textContent = "Fehler beim Verbindungsaufbau";
  log(String(err));
});
