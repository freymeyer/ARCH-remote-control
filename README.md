# Secure Mobile-to-PC Remote Control (Arch Linux, X11)

A production-oriented LAN remote control system:

Mobile Browser → WebSocket (Socket.IO) → Node.js Server → RobotJS → OS Input

## Features

- Node.js + Express + Socket.IO backend
- RobotJS primary backend with xdotool fallback when RobotJS is unavailable
- Mobile-optimized touchpad UI (vanilla JS)
- Mouse move, click (left/right/double), scroll
- Optional keyboard text input
- Token auth for socket connections
- IP allow-list support (single IP or CIDR)
- Basic event rate limiting
- Payload validation and clamping
- CORS origin restrictions
- Optional HTTPS support
- Terminal QR code for quick mobile pairing

## Project Structure

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── auth.js
│   ├── config.js
│   ├── inputController.js
│   ├── rateLimiter.js
│   ├── socket.js
│   └── validators.js
├── .env.example
├── package.json
├── README.md
└── server.js
```

## Arch Linux Installation (X11)

> RobotJS (or xdotool fallback) sends desktop input to X11 sessions. This project is **not for Wayland**.

### 1) Install system packages

```bash
sudo pacman -Syu
sudo pacman -S --needed nodejs npm base-devel python xorg-xhost xdotool libxtst libx11 libxkbfile
```

If your Node version is very new and RobotJS native build fails, install an LTS Node runtime:

```bash
sudo pacman -S --needed nvm
nvm install --lts
nvm use --lts
```

### 2) Clone and install dependencies

```bash
git clone <your-repo-url>
cd ARCH-remote-control
npm install
```

### 3) Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

- Set `REMOTE_TOKEN` to a long random secret.
- Restrict `ALLOWED_IPS` to your LAN subnet (example: `192.168.1.0/24`).
- Restrict `ALLOWED_ORIGINS` to your server URL(s).

Generate a token example:

```bash
openssl rand -hex 32
```

### 4) Run

```bash
npm start
```

Open the printed LAN URL on your phone and enter the token.

## Optional HTTPS

1. Create cert/key (self-signed for LAN test):

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout certs/key.pem -out certs/cert.pem -subj '/CN=remote-control.local'
```

2. Set in `.env`:

```dotenv
ENABLE_HTTPS=true
HTTPS_KEY_PATH=./certs/key.pem
HTTPS_CERT_PATH=./certs/cert.pem
```

3. Restart server and use `https://...` URL.

## Security Notes

- **Auth**: Socket connections require `REMOTE_TOKEN`.
- **Network boundary**: Designed for trusted local network/VPN, not direct internet exposure.
- **IP filtering**: `ALLOWED_IPS` can block unknown clients.
- **CORS**: Only listed `ALLOWED_ORIGINS` can connect from browsers.
- **Validation**: All control payloads are validated and bounded.
- **Rate limiting**: Per-socket event cap to reduce abuse.

### Security Limitations

- Token auth is shared-secret based; no user accounts or revocation list.
- Self-signed HTTPS may still require manual trust on mobile.
- If malware already runs on host, it can still inject input locally.
- xdotool fallback requires the binary to be installed and reachable in PATH.
- RobotJS runs with the same privileges as your user session.

## Gesture Mapping (Mobile UI)

- One-finger drag → `mouseMove`
- Single tap → left click
- Two-finger tap → right click
- Two-finger vertical move → scroll
- Keyboard box + Send → `keyboardInput`

## Future Improvements

- Device pairing flow with one-time PIN and rotating short-lived session tokens
- mTLS or reverse proxy with OAuth2
- Per-device profiles and permissions (mouse-only vs keyboard-enabled)
- Audit logs for control events
- Visual cursor feedback stream back to phone
- Keyboard shortcut mode (Ctrl/Alt/Meta combos)
