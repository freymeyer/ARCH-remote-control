require('dotenv').config();

const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode-terminal');
const getConfig = require('./src/config');
const setupSocket = require('./src/socket');

const config = getConfig();
const app = express();

app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: config.env });
});

function getLanUrl(port, useHttps = false) {
  const interfaces = os.networkInterfaces();
  for (const values of Object.values(interfaces)) {
    for (const item of values || []) {
      if (item.family === 'IPv4' && !item.internal) {
        return `${useHttps ? 'https' : 'http'}://${item.address}:${port}`;
      }
    }
  }
  return `${useHttps ? 'https' : 'http'}://localhost:${port}`;
}

const isHttps = Boolean(config.tls);
const server = isHttps ? https.createServer(config.tls, app) : http.createServer(app);

setupSocket(server, config);

server.listen(config.port, config.host, () => {
  const url = getLanUrl(config.port, isHttps);
  console.log(`Remote control server listening on ${url}`);
  console.log('Open this URL on mobile and enter your token to pair.');

  // Extra credit: terminal QR for quick mobile access.
  qrcode.generate(url, { small: true });
});
