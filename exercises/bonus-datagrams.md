# Bonus: Datagrams & packet loss

**Format:** solo, for experimenting · **Time:** ~20 minutes · **Folder:** `starter/`

## Goal

Show what WebSockets **cannot** do: unreliable, unordered messages — like UDP. A mouse
position is sent to the server as a datagram and broadcast to all other clients. By the
end you'll understand why "unreliable" is sometimes exactly the right choice.

## Task — Client: `public/exercise2-datagrams.js` (~12 min)

After `await transport.ready` (cert hash and connection are already prepared):

1. Get the datagram writer (`transport.datagrams.writable.getWriter()`) and the reader
   (`transport.datagrams.readable.getReader()`).
2. On `mousemove` inside the box: encode `{ x, y }` as JSON with `TextEncoder` and send it
   with `writer.write(...)`.
3. In a loop, `reader.read()`, decode the JSON, and move the dot (`#dot`) to the received
   position.

## How to verify it works

Open **two** tabs of `http://localhost:8080/exercise2-datagrams.html`. Move the mouse in
one box and the dot follows in the other.

## Experiment — simulate loss (~8 min)

Stop the server and restart it with a loss rate:

```bash
LOSS_RATE=0.3 npm start
```

Move the mouse. The dot now **stutters** (30% of updates are dropped) — but it never lags
behind; it jumps to the latest position.

## Reflection

- What happens at `LOSS_RATE=0.7`? Still usable?
- A **reliable stream** would retransmit lost packets and deliver them *in order* — so the
  dot would **trail behind** the mouse instead of jumping to the current position. Why is
  "unreliable" therefore **better** for position data?
- Where in real life do you want datagrams (gaming, voice, live cursors) and where do you
  prefer streams (chat, file transfer)?

## Key takeaway

WebTransport gives you **both over a single connection**: reliable, ordered streams *and*
unreliable datagrams. WebSocket only does the former. That's the strongest reason to
consider WebTransport at all.
