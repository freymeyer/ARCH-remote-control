const { Server } = require('socket.io');
const { authMiddleware } = require('./auth');
const createRateLimiter = require('./rateLimiter');
const {
  validateMouseMove,
  validateMouseClick,
  validateScroll,
  validateKeyboardInput
} = require('./validators');
const { moveMouseRelative, performClick, performScroll, typeText } = require('./inputController');

module.exports = function setupSocket(server, config) {
  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        // Allow non-browser clients and same-origin requests.
        if (!origin || !config.allowedOrigins.length || config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Origin is not allowed by CORS'));
      },
      methods: ['GET', 'POST']
    }
  });

  io.use(authMiddleware(config));

  const enforceRateLimit = createRateLimiter(config.rateLimitWindowMs, config.rateLimitMaxEvents);

  io.on('connection', (socket) => {
    socket.emit('connected', { message: 'Controller authenticated', ip: socket.clientIp });

    socket.on('mouseMove', (payload) => {
      if (!enforceRateLimit(socket, 'mouseMove')) return;

      const safe = validateMouseMove(payload, config.maxMouseDelta);
      if (!safe) return socket.emit('controlError', { event: 'mouseMove', message: 'Invalid payload' });
      moveMouseRelative(safe.dx, safe.dy);
    });

    socket.on('mouseClick', (payload) => {
      if (!enforceRateLimit(socket, 'mouseClick')) return;

      const safe = validateMouseClick(payload);
      if (!safe) return socket.emit('controlError', { event: 'mouseClick', message: 'Invalid payload' });
      performClick(safe.button, safe.clickType);
    });

    socket.on('scroll', (payload) => {
      if (!enforceRateLimit(socket, 'scroll')) return;

      const safe = validateScroll(payload, config.maxScrollDelta);
      if (!safe) return socket.emit('controlError', { event: 'scroll', message: 'Invalid payload' });
      performScroll(safe.dy);
    });

    socket.on('keyboardInput', (payload) => {
      if (!enforceRateLimit(socket, 'keyboardInput')) return;

      const safe = validateKeyboardInput(payload);
      if (!safe) return socket.emit('controlError', { event: 'keyboardInput', message: 'Invalid payload' });
      typeText(safe.text);
    });
  });

  return io;
};
