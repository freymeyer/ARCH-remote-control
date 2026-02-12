function ipToLong(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + parts[3];
}

function isInCidr(ip, cidr) {
  const [range, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(range);
  if (ipLong === null || rangeLong === null) return false;

  const mask = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1) >>> 0);
  return (ipLong & mask) === (rangeLong & mask);
}

function isIpAllowed(ip, allowList) {
  if (!allowList.length) return true;
  return allowList.some((entry) => {
    if (entry.includes('/')) return isInCidr(ip, entry);
    return entry === ip;
  });
}

function getClientIp(socket) {
  const xff = socket.handshake.headers['x-forwarded-for'];
  const raw = xff ? xff.split(',')[0].trim() : socket.handshake.address;
  return raw.replace('::ffff:', '');
}

function authMiddleware(config) {
  return (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const ip = getClientIp(socket);

    if (!config.remoteToken) {
      return next(new Error('Server token is not configured'));
    }

    if (token !== config.remoteToken) {
      return next(new Error('Invalid token'));
    }

    if (!isIpAllowed(ip, config.allowedIps)) {
      return next(new Error('IP is not in allow list'));
    }

    socket.clientIp = ip;
    return next();
  };
}

module.exports = {
  authMiddleware,
  getClientIp,
  isIpAllowed
};
