// Bonus: send mouse position as datagrams (unreliable, unordered); server
// broadcasts to other clients. Discuss: what breaks at high LOSS_RATE, and
// why a reliable stream would actually be worse for position updates.

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

  const writer = transport.datagrams.writable.getWriter();
  const reader = transport.datagrams.readable.getReader();

  // send own mouse movement
  board.addEventListener("mousemove", async (e) => {
    const rect = board.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const payload = JSON.stringify({ x, y });
    try {
      await writer.write(new TextEncoder().encode(payload));
      sentCount++;
      sentEl.textContent = sentCount;
    } catch (err) {
      console.error("Senden fehlgeschlagen:", err);
    }
  });

  // receive other clients' positions and move the dot
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedCount++;
    receivedEl.textContent = receivedCount;
    try {
      const { x, y } = JSON.parse(decoder.decode(value));
      dot.style.left = x + "px";
      dot.style.top = y + "px";
    } catch {
      // partial/invalid packet -- fine for datagrams, ignore
    }
  }
}

connect().catch((err) => {
  statusEl.textContent = "Fehler beim Verbindungsaufbau";
  console.error(err);
});
