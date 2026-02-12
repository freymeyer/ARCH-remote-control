function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function validateMouseMove(payload, maxDelta) {
  if (!payload || !isNumber(payload.dx) || !isNumber(payload.dy)) return null;
  return {
    dx: clamp(Math.round(payload.dx), -maxDelta, maxDelta),
    dy: clamp(Math.round(payload.dy), -maxDelta, maxDelta)
  };
}

function validateMouseClick(payload) {
  if (!payload || typeof payload.button !== 'string') return null;
  const button = payload.button.toLowerCase();
  const clickType = payload.clickType === 'double' ? 'double' : 'single';

  if (!['left', 'right', 'middle'].includes(button)) return null;

  return { button, clickType };
}

function validateScroll(payload, maxScrollDelta) {
  if (!payload || !isNumber(payload.dy)) return null;
  return {
    dy: clamp(Math.round(payload.dy), -maxScrollDelta, maxScrollDelta)
  };
}

function validateKeyboardInput(payload) {
  if (!payload || typeof payload.text !== 'string') return null;
  const text = payload.text.slice(0, 256);
  if (!text.trim()) return null;
  return { text };
}

module.exports = {
  validateMouseMove,
  validateMouseClick,
  validateScroll,
  validateKeyboardInput
};
