# WebTransport as an alternative to WebSockets — Workshop

Workshop for the module *Web Technologien* (Weaving the Web, TH Köln).
Hands-on introduction to WebTransport (HTTP/3 / QUIC): bidirectional streams,
migrating a WebSocket app, and unreliable datagrams.

- **Date:** Tuesday, 21 July 2026 · **Room:** 3.215 · **Author:** Michel Haurand
- **Abstract:** see the Weaving the Web site.

## Repository structure

```
.
├── starter/       # participant version — has // TODO gaps to fill in
├── solution/      # complete, tested reference implementation
├── exercises/     # task sheets (start here)
│   ├── part-1-echo-stream.md
│   ├── part-2-migration.md
│   └── bonus-datagrams.md
└── slides/        # presentation
```

Participants work in **`starter/`**. **`solution/`** is the reference to peek at when
stuck.

## Prerequisites

- **Node.js** (incl. npm) — a recent LTS.
- A **Chromium-based browser** (Chrome or Edge). WebTransport support and self-signed
  certs via `serverCertificateHashes` are most reliable there.
- Build tools for the native module (see the warning below).

## Setup

All commands are run **inside `starter/`** (or `solution/` if you want to run the
reference). Each folder needs its own `cert.pem` because the server reads it relative to
its working directory.

### 1. Install dependencies

```bash
cd starter
npm install
```

> ⚠️ **Test this before the workshop.** `@fails-components/webtransport` compiles a
> native binary and clones third-party sources during install. It needs a C/C++
> toolchain (Xcode Command Line Tools on macOS, build-essential on Linux, Build Tools on
> Windows) and network access to Google's git servers. If `npm install` fails here, you
> cannot run anything — so verify it works on your machine ahead of time.

### 2. Generate a self-signed certificate

WebTransport requires HTTPS. For local dev a self-signed ECDSA/P-256 cert is enough.
Keep it **≤ 14 days** — Chrome rejects longer-lived certs when using
`serverCertificateHashes`:

```bash
openssl req -new -x509 -nodes -out cert.pem -keyout key.pem \
  -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -subj '/CN=127.0.0.1' -days 10
```

Place `cert.pem` and `key.pem` next to `server.js`. They are git-ignored (the private key
must never be committed).

### 3. Run

```bash
npm start
```

Then open **`http://localhost:8080`** in Chrome/Edge.

For the migration part (WebSocket "before" example):

```bash
npm run ws-demo        # then open http://localhost:8090
```

To try packet loss in the datagram bonus:

```bash
LOSS_RATE=0.3 npm start
```

## How it works (two things that trip everyone up)

**Self-signed cert without browser flags.** The server computes the SHA-256 of its
certificate and serves it at `/cert-hash`. The clients fetch it and pass it as
`serverCertificateHashes` to `new WebTransport(...)`. That's why you don't need to launch
Chrome with any special flags.

**Connect to `127.0.0.1`, not `localhost`.** The server binds IPv4. `localhost` resolves
to IPv6 (`::1`) first in Chromium, where nothing is listening → `ERR_CONNECTION_REFUSED`.
All client URLs therefore use `127.0.0.1`.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `npm install` fails cloning `quiche.googlesource.com` | No network to Google git or no build toolchain. Install build tools; retry on an open network. |
| `net::ERR_CONNECTION_REFUSED` | You're connecting to `localhost` (IPv6). Use `127.0.0.1`. |
| `WebTransportError: Opening handshake failed` | Cert not trusted. Ensure the server serves `/cert-hash`, the client uses `serverCertificateHashes`, and the cert is ECDSA/P-256 with ≤ 14 days validity. |
| Nothing at `https://127.0.0.1:4433` in the browser | Expected — WebTransport is UDP/QUIC; a normal (TCP) page load shows nothing. |
| `datagrams.writable is deprecated` (server log) | Use `session.datagrams.createWritable()` instead of `.writable`. |
| `[echo] Session beendet` on the server | Normal — a client closed the tab / navigated away (clean close, code 0). |
```
