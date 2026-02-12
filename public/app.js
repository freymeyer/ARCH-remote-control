(() => {
  const statusEl = document.getElementById('status');
  const authPanel = document.getElementById('authPanel');
  const tokenInput = document.getElementById('tokenInput');
  const connectBtn = document.getElementById('connectBtn');
  const touchpad = document.getElementById('touchpad');

  const leftClickBtn = document.getElementById('leftClickBtn');
  const rightClickBtn = document.getElementById('rightClickBtn');
  const doubleClickBtn = document.getElementById('doubleClickBtn');

  const keyboardInput = document.getElementById('keyboardInput');
  const sendKeyboardBtn = document.getElementById('sendKeyboardBtn');

  let socket;
  let activeTouches = new Map();
  let touchStartTs = 0;
  let moved = false;

  function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#fca5a5' : '#93c5fd';
  }

  function connect() {
    const token = tokenInput.value.trim();
    if (!token) {
      setStatus('Token is required', true);
      return;
    }

    socket = io({
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      setStatus('Connected');
      authPanel.style.display = 'none';
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected', true);
      authPanel.style.display = 'grid';
    });

    socket.on('connect_error', (err) => {
      setStatus(`Auth/connection failed: ${err.message}`, true);
      authPanel.style.display = 'grid';
    });

    socket.on('controlError', (error) => {
      setStatus(`Control error: ${error.message}`, true);
    });
  }

  function emitSafe(event, payload) {
    if (!socket || !socket.connected) {
      setStatus('Not connected', true);
      return;
    }
    socket.emit(event, payload);
  }

  connectBtn.addEventListener('click', connect);

  leftClickBtn.addEventListener('click', () => emitSafe('mouseClick', { button: 'left', clickType: 'single' }));
  rightClickBtn.addEventListener('click', () => emitSafe('mouseClick', { button: 'right', clickType: 'single' }));
  doubleClickBtn.addEventListener('click', () => emitSafe('mouseClick', { button: 'left', clickType: 'double' }));

  sendKeyboardBtn.addEventListener('click', () => {
    const text = keyboardInput.value;
    if (!text.trim()) return;
    emitSafe('keyboardInput', { text });
    keyboardInput.value = '';
  });

  function onTouchStart(ev) {
    ev.preventDefault();
    touchStartTs = Date.now();
    moved = false;

    for (const touch of ev.changedTouches) {
      activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
  }

  function onTouchMove(ev) {
    ev.preventDefault();

    const currentCount = ev.touches.length;
    for (const touch of ev.changedTouches) {
      const prev = activeTouches.get(touch.identifier);
      if (!prev) continue;

      const dx = touch.clientX - prev.x;
      const dy = touch.clientY - prev.y;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        moved = true;
      }

      if (currentCount === 1) {
        emitSafe('mouseMove', { dx: dx * 1.2, dy: dy * 1.2 });
      } else if (currentCount === 2) {
        emitSafe('scroll', { dy });
      }

      activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
  }

  function onTouchEnd(ev) {
    ev.preventDefault();
    const duration = Date.now() - touchStartTs;
    const wasTwoFinger = ev.touches.length === 0 && activeTouches.size === 2;

    for (const touch of ev.changedTouches) {
      activeTouches.delete(touch.identifier);
    }

    if (!moved && duration < 220) {
      if (wasTwoFinger) {
        emitSafe('mouseClick', { button: 'right', clickType: 'single' });
      } else {
        emitSafe('mouseClick', { button: 'left', clickType: 'single' });
      }
    }
  }

  touchpad.addEventListener('touchstart', onTouchStart, { passive: false });
  touchpad.addEventListener('touchmove', onTouchMove, { passive: false });
  touchpad.addEventListener('touchend', onTouchEnd, { passive: false });
  touchpad.addEventListener('touchcancel', onTouchEnd, { passive: false });
})();
