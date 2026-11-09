const keys = { forward: false, backward: false, left: false, right: false };
let jumpPressed = false;

export function initInput() {
  const onKey = (e, down) => {
    switch (e.code) {
      case 'KeyW': keys.forward = down; break;
      case 'KeyS': keys.backward = down; break;
      case 'KeyA': keys.left = down; break;
      case 'KeyD': keys.right = down; break;
      case 'Space': jumpPressed = down; break;
    }
  };
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));
  return {
    getMove: () => ({ x: (keys.right ? 1 : 0) - (keys.left ? 1 : 0), y: (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0) }),
    getJump: () => jumpPressed,
    resetJump: () => { jumpPressed = false; },
  };
}