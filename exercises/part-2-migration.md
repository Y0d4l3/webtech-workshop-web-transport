# Part 2: Migration WebSocket → WebTransport

**Format:** guided, together · **Time:** ~35 minutes · **Folder:** `starter/`

## Goal

In Part 1 you built a WebTransport echo. Now we flip it around: we start from a
**finished WebSocket app** and translate it, step by step, to WebTransport as a group.
This teaches you the **systematic migration** you'd do in real life — and shows *why*
you'd do it at all.

## Starting point

- The "before": a complete WebSocket echo app in `websocket-echo/`.
  Start it with `npm run ws-demo`, then open `http://localhost:8090`. Type something — it
  comes back. Same behavior as your Part 1 echo, just built the classic way.
- The "after": the same behavior over WebTransport (your `/echo` from Part 1).

## We go through it together

First we look at the WebSocket client (`websocket-echo/index.html`) side by side with your
WebTransport client from Part 1. Then we translate it line by line using this mapping:

| WebSocket | WebTransport |
|---|---|
| `new WebSocket("ws://…")` | `new WebTransport("https://127.0.0.1:4433/echo", { serverCertificateHashes })` |
| `socket.onopen` | `await transport.ready` |
| one socket object for everything | session **and** stream, separated (`createBidirectionalStream()`) |
| `socket.send("text")` | `writer.write(new TextEncoder().encode("text"))` |
| `socket.onmessage = e => e.data` | `while` loop with `reader.read()` + `TextDecoder` |
| `ws://` (plain) / `wss://` (TLS) | always `https://` (HTTP/3 over QUIC) |

## Reflection (together)

- What got more awkward, what got simpler? (Bytes instead of strings, a reader loop
  instead of an event handler.)
- Why does WebTransport need **two** objects — session and stream — where WebSocket has
  one?
- The real payoff: **head-of-line blocking**. With WebSocket (TCP) a single lost packet
  blocks *all* messages behind it. With WebTransport (QUIC) multiple streams are
  independent — a stall in one doesn't block the others. You don't see it in the simple
  echo yet — but that's exactly what the bonus part is for.

## How to verify it works

The migrated client connects to `/echo` and mirrors messages back — same behavior as the
WebSocket version, but over WebTransport.

## Bonus (if you finish early)

- Open two bidirectional streams in **one** session at the same time and send over both.
  Observe: they don't interfere — that's the QUIC advantage in miniature.
