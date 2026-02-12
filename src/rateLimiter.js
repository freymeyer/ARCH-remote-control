module.exports = function createRateLimiter(windowMs, maxEvents) {
  return function enforceRateLimit(socket, eventName) {
    const now = Date.now();
    if (!socket.rateWindow || now - socket.rateWindow.start > windowMs) {
      socket.rateWindow = { start: now, count: 0 };
    }

    socket.rateWindow.count += 1;
    if (socket.rateWindow.count > maxEvents) {
      socket.emit('controlError', {
        event: eventName,
        message: 'Rate limit exceeded; slow down control messages.'
      });
      return false;
    }

    return true;
  };
};
