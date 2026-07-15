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
- Build tools for the native module (C/C++ toolchain: Xcode Command Line Tools on macOS,
  build-essential on Linux, Build Tools on Windows).

## Setup

All commands are run **inside `starter/`** (or `solution/` if you want to run the
reference). Each folder needs its own `cert.pem` because the server reads it relative to
its working directory.

### 1. Install dependencies

```bash
cd starter
npm install
```

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

## Design notes

- **Self-signed cert without browser flags:** the server computes the SHA-256 of its
  certificate and serves it at `/cert-hash`; the clients fetch it and pass it as
  `serverCertificateHashes` to `new WebTransport(...)`. No Chrome launch flags needed.
- **Clients connect to `127.0.0.1`** (the server binds IPv4), not `localhost`.
```
