const fs = require('fs');
const path = require('path');

function splitCsv(value = '') {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadTlsConfig(enableHttps, keyPath, certPath) {
  if (!enableHttps) return null;

  if (!keyPath || !certPath) {
    throw new Error('ENABLE_HTTPS=true requires HTTPS_KEY_PATH and HTTPS_CERT_PATH');
  }

  const key = fs.readFileSync(path.resolve(keyPath));
  const cert = fs.readFileSync(path.resolve(certPath));
  return { key, cert };
}

module.exports = function getConfig() {
  const enableHttps = process.env.ENABLE_HTTPS === 'true';

  return {
    env: process.env.NODE_ENV || 'production',
    host: process.env.HOST || '0.0.0.0',
    port: parseNumber(process.env.PORT, 3000),
    remoteToken: process.env.REMOTE_TOKEN || '',
    allowedIps: splitCsv(process.env.ALLOWED_IPS),
    allowedOrigins: splitCsv(process.env.ALLOWED_ORIGINS),
    rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 1000),
    rateLimitMaxEvents: parseNumber(process.env.RATE_LIMIT_MAX_EVENTS, 120),
    maxMouseDelta: parseNumber(process.env.MAX_MOUSE_DELTA, 200),
    maxScrollDelta: parseNumber(process.env.MAX_SCROLL_DELTA, 100),
    tls: loadTlsConfig(enableHttps, process.env.HTTPS_KEY_PATH, process.env.HTTPS_CERT_PATH)
  };
};
