# Part 1: Echo over a bidirectional stream

**Format:** solo · **Time:** ~25 minutes · **Folder:** `starter/`

## Goal

Build your first WebTransport connection: the browser sends a message and the server
mirrors it back (echo). By the end you'll understand the three core building blocks —
the **session**, a **bidirectional stream**, and the **Streams API**.

## Starting point

The setup is already in place: certificate handling, fetching the cert hash, and the
connection up to `await transport.ready` are done. Your job is the two spots marked with
`// TODO` — one in the client, one in the server.

## Task A — Client: `public/exercise1-streams.js` (~15 min)

After `await transport.ready`:

1. Open a bidirectional stream with `transport.createBidirectionalStream()`.
2. Get the `writer` (`stream.writable.getWriter()`) and the `reader`
   (`stream.readable.getReader()`).
3. Implement `sendMessage()`: encode the text with `new TextEncoder().encode(...)` into a
   `Uint8Array` and send it with `writer.write(...)`.
4. Implement `readLoop()`: call `reader.read()` in a loop, decode the value with
   `new TextDecoder().decode(...)`, write it to the log — and stop once `done` is `true`.

## Task B — Server: `server.js`, function `handleEcho` (~10 min)

At the marked spot inside the stream handling:

- Read from the `reader` in a loop and write the received value **unchanged** back with
  `writer.write(value)`. Stop once `done` is `true`.

## How to verify it works

Open `http://localhost:8080/exercise1-streams.html`, type a message, hit "Senden". It must
come back as `<- …`. The server console shows `[echo] empfangen: …`.

## Hints

- WebTransport data is **always bytes** (`Uint8Array`), never strings — don't forget
  encode/decode.
- The WebTransport address is `127.0.0.1`, **not** `localhost` (IPv6 trap, see README).
- Stuck? The full solution is in `solution/` — try it yourself first, then peek.

## Bonus (if you finish early)

- Show the connection status ("connected" / "disconnected") cleanly by reacting to
  `transport.closed`.
- Send two messages in quick succession. Is the order preserved? Why? (Hint: a stream is
  reliable **and** ordered.)
