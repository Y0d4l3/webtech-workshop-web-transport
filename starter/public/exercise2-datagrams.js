// Bonus: send mouse position as datagrams (unreliable, unordered); server
// broadcasts to other clients.
// STARTER: fill in the TODOs -- see exercises/bonus-datagrams.md.

const statusEl = document.getElementById("status");
const board = document.getElementById("board");
const dot = document.getElementById("dot");
const sentEl = document.getElementById("sent");
const receivedEl = document.getElementById("received");

let sentCount = 0;
let receivedCount = 0;

async function connect() {
  // Fetch the current cert hash so Chrome trusts the self-signed cert (no flags).
  const { hash } = await (await fetch("/cert-hash")).json();
  const hashBytes = Uint8Array.from(hash.match(/../g).map((h) => parseInt(h, 16)));

  // 127.0.0.1, not localhost: browsers may try IPv6 (::1) first, where the
  // IPv4-bound server isn't listening -> ERR_CONNECTION_REFUSED.
  const transport = new WebTransport("https://127.0.0.1:4433/positions", {
    serverCertificateHashes: [{ algorithm: "sha-256", value: hashBytes }],
  });
  await transport.ready;
  statusEl.textContent = "verbunden";

  // TODO (Bonus): get the datagram writer (transport.datagrams.writable.getWriter())
  // and reader (transport.datagrams.readable.getReader()).

  // TODO (Bonus): on board "mousemove", compute { x, y } relative to the board,
  // encode it as JSON with TextEncoder, send it via writer.write(...), and bump
  // sentCount / sentEl.

  // TODO (Bonus): loop reader.read(); decode the JSON, move #dot to { x, y }
  // (dot.style.left / dot.style.top), and bump receivedCount / receivedEl.
}

connect().catch((err) => {
  statusEl.textContent = "Fehler beim Verbindungsaufbau";
  console.error(err);
});
