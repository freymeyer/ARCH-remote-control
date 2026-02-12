const { execFileSync } = require('child_process');

let robot = null;
try {
  // Prefer RobotJS when available.
  robot = require('robotjs');
} catch (_err) {
  robot = null;
}

function runXdotool(args) {
  execFileSync('xdotool', args, { stdio: 'ignore' });
}

function moveMouseRelative(dx, dy) {
  if (robot) {
    const current = robot.getMousePos();
    robot.moveMouse(current.x + dx, current.y + dy);
    return;
  }
  runXdotool(['mousemove_relative', '--', String(dx), String(dy)]);
}

function performClick(button, clickType) {
  if (robot) {
    robot.mouseClick(button, clickType === 'double');
    return;
  }

  const map = { left: '1', middle: '2', right: '3' };
  const btn = map[button] || '1';
  if (clickType === 'double') {
    runXdotool(['click', '--repeat', '2', '--delay', '120', btn]);
    return;
  }
  runXdotool(['click', btn]);
}

function performScroll(dy) {
  if (robot) {
    robot.scrollMouse(0, -dy);
    return;
  }

  const amount = Math.abs(dy);
  if (amount === 0) return;
  const button = dy > 0 ? '5' : '4';
  const repeat = Math.max(1, Math.min(30, Math.round(amount / 4)));
  runXdotool(['click', '--repeat', String(repeat), button]);
}

function typeText(text) {
  if (robot) {
    robot.typeString(text);
    return;
  }
  runXdotool(['type', '--delay', '1', text]);
}

module.exports = {
  moveMouseRelative,
  performClick,
  performScroll,
  typeText
};
