// oohnana — a little desktop buddy.
// State machine + movement + cursor reactions + drag + affirmation bubbles.

const petEl = document.getElementById('pet');
const spriteEl = document.getElementById('sprite');
const bubbleEl = document.getElementById('bubble');

// ---- Tunables -------------------------------------------------------------
const WALK_SPEED = 55; // px per second
const NEAR_RADIUS = 150; // cursor "gets close" distance
const FLOOR_MARGIN = 6; // gap between feet and screen bottom
const GRAVITY = 2600; // px/s^2 when dropped
const IDLE_MIN = 2.2; // seconds
const IDLE_MAX = 5.5;
const SLEEP_AFTER = 22; // seconds of calm before dozing off
const BUBBLE_MIN = 22; // seconds between affirmations
const BUBBLE_MAX = 45;
const DRAG_THRESHOLD = 4; // px of movement before a click becomes a drag

// ---- Config (filled in from the main process) -----------------------------
let affirmations = ['you’re doing great ✨'];
let spriteURLs = {}; // { state: url|null }
let spriteHeight = 130;

// ---- Live state -----------------------------------------------------------
const S = {
  name: 'idle', // idle | walk | happy | sleep | peek | grabbed | falling
  x: window.innerWidth / 2, // center x (px)
  feetY: floorY(), // y of the feet (px)
  facing: 1, // 1 = right, -1 = left
  targetX: null, // walk destination
  vy: 0, // vertical velocity while falling
  calmFor: 0, // seconds spent calm (for sleep)
  stateTimer: 0, // seconds until the current idle/walk ends
  cursor: { x: -9999, y: -9999, inside: false },
  resumeAfterHappy: 'idle',
};

let petW = 90; // measured once the sprite loads
let petH = spriteHeight;
let bubbleTimer = null;
let lastTs = performance.now();

function floorY() {
  return window.innerHeight - FLOOR_MARGIN;
}

// ---- Placeholder art ------------------------------------------------------
// Original rounded-blob character, used until you add your own sprites.
// (Kept deliberately generic — no third-party artwork.)
function placeholder(state) {
  const eyesOpen = `
    <circle cx="34" cy="52" r="4.6" fill="#3f3a37"/>
    <circle cx="66" cy="52" r="4.6" fill="#3f3a37"/>`;
  const eyesClosed = `
    <path d="M28 52 q6 5 12 0" stroke="#3f3a37" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M60 52 q6 5 12 0" stroke="#3f3a37" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const eyes = state === 'sleep' ? eyesClosed : eyesOpen;
  const blushR = state === 'happy' ? 7.5 : 6;
  const mouth =
    state === 'happy'
      ? `<path d="M42 62 q8 8 16 0" stroke="#3f3a37" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M46 62 q4 4 8 0" stroke="#3f3a37" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const zzz =
    state === 'sleep'
      ? `<text x="74" y="30" font-family="sans-serif" font-size="16" fill="#9aa0a6">z</text>
         <text x="84" y="20" font-family="sans-serif" font-size="11" fill="#c2c6cb">z</text>`
      : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" width="100" height="110">
      <ellipse cx="30" cy="20" rx="11" ry="12" fill="#ffffff" stroke="#3f3a37" stroke-width="3.5"/>
      <ellipse cx="70" cy="20" rx="11" ry="12" fill="#ffffff" stroke="#3f3a37" stroke-width="3.5"/>
      <ellipse cx="50" cy="58" rx="40" ry="42" fill="#ffffff" stroke="#3f3a37" stroke-width="3.5"/>
      <ellipse cx="26" cy="60" rx="${blushR}" ry="4.6" fill="#ffb7c9"/>
      <ellipse cx="74" cy="60" rx="${blushR}" ry="4.6" fill="#ffb7c9"/>
      ${eyes}
      ${mouth}
      <ellipse cx="36" cy="98" rx="9" ry="6" fill="#ffffff" stroke="#3f3a37" stroke-width="3.5"/>
      <ellipse cx="64" cy="98" rx="9" ry="6" fill="#ffffff" stroke="#3f3a37" stroke-width="3.5"/>
      ${zzz}
    </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function srcFor(state) {
  return spriteURLs[state] || placeholder(state);
}

// ---- State transitions ----------------------------------------------------
function setState(name) {
  if (S.name === name) return;
  S.name = name;
  const url = srcFor(name);
  // Avoid restarting a GIF if the src is unchanged.
  if (spriteEl.getAttribute('src') !== url) spriteEl.setAttribute('src', url);
  petEl.classList.toggle('grabbed', name === 'grabbed');
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function beginIdle() {
  setState('idle');
  S.stateTimer = rand(IDLE_MIN, IDLE_MAX);
}

function beginWalk() {
  const margin = petW;
  S.targetX = rand(margin, window.innerWidth - margin);
  S.facing = S.targetX >= S.x ? 1 : -1;
  setState('walk');
}

function beginSleep() {
  setState('sleep');
}

// Occasional shy peek — a brief flavor beat during idle.
function maybePeek() {
  if (Math.random() < 0.25 && spriteURLs.peek !== undefined) {
    setState('peek');
    S.stateTimer = rand(1.4, 2.6);
    return true;
  }
  return false;
}

// ---- Main loop ------------------------------------------------------------
function tick(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;

  const cursorNear = S.cursor.inside && distanceToCursor() < NEAR_RADIUS;

  switch (S.name) {
    case 'grabbed':
      // Position is driven by the drag handlers.
      break;

    case 'falling': {
      S.vy += GRAVITY * dt;
      S.feetY += S.vy * dt;
      if (S.feetY >= floorY()) {
        S.feetY = floorY();
        S.vy = 0;
        beginIdle();
      }
      break;
    }

    case 'happy': {
      // Face the cursor and stay happy until it wanders off.
      if (S.cursor.x < S.x) S.facing = -1;
      else S.facing = 1;
      if (!cursorNear) {
        S.calmFor = 0;
        if (S.resumeAfterHappy === 'walk') beginWalk();
        else beginIdle();
      }
      break;
    }

    case 'sleep': {
      if (cursorNear) {
        S.calmFor = 0;
        S.resumeAfterHappy = 'idle';
        setState('happy');
      }
      break;
    }

    case 'walk': {
      if (cursorNear) {
        S.resumeAfterHappy = 'walk';
        setState('happy');
        break;
      }
      const dir = S.targetX >= S.x ? 1 : -1;
      S.facing = dir;
      S.x += dir * WALK_SPEED * dt;
      if (Math.abs(S.x - S.targetX) < 3) {
        S.x = S.targetX;
        beginIdle();
      }
      S.calmFor += dt;
      break;
    }

    case 'idle':
    case 'peek':
    default: {
      if (cursorNear) {
        S.resumeAfterHappy = 'idle';
        setState('happy');
        break;
      }
      S.calmFor += dt;
      S.stateTimer -= dt;
      if (S.stateTimer <= 0) {
        if (S.calmFor > SLEEP_AFTER) {
          beginSleep();
        } else if (S.name === 'idle' && maybePeek()) {
          // showing a peek beat
        } else {
          Math.random() < 0.6 ? beginWalk() : beginIdle();
        }
      }
      break;
    }
  }

  // Keep the buddy on screen if the display was resized.
  S.x = Math.max(petW / 2, Math.min(window.innerWidth - petW / 2, S.x));
  render();
  requestAnimationFrame(tick);
}

function distanceToCursor() {
  const cx = S.x;
  const cy = S.feetY - petH / 2;
  return Math.hypot(S.cursor.x - cx, S.cursor.y - cy);
}

function render() {
  petEl.style.left = `${Math.round(S.x - petW / 2)}px`;
  petEl.style.top = `${Math.round(S.feetY - petH)}px`;
  petEl.classList.toggle('face-left', S.facing === -1);
}

// ---- Affirmation bubbles --------------------------------------------------
function showBubble() {
  if (S.name === 'grabbed' || S.name === 'sleep') {
    scheduleBubble(); // try again later; don't interrupt
    return;
  }
  const text = affirmations[Math.floor(Math.random() * affirmations.length)];
  bubbleEl.textContent = text;
  bubbleEl.classList.remove('hidden');
  setTimeout(() => bubbleEl.classList.add('hidden'), 5200);
  scheduleBubble();
}

function scheduleBubble() {
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(showBubble, rand(BUBBLE_MIN, BUBBLE_MAX) * 1000);
}

// ---- Pointer: hover click-through toggle + drag + pat ---------------------
let hovering = false;
let pointer = { down: false, dragging: false, startX: 0, startY: 0, dx: 0, dy: 0 };

function overPet(px, py) {
  const pad = 4;
  const left = S.x - petW / 2 - pad;
  const right = S.x + petW / 2 + pad;
  const top = S.feetY - petH - pad;
  const bottom = S.feetY + pad;
  return px >= left && px <= right && py >= top && py <= bottom;
}

// Fires for both forwarded (click-through) and real pointer moves.
window.addEventListener('mousemove', (e) => {
  S.cursor.x = e.clientX;
  S.cursor.y = e.clientY;
  S.cursor.inside = true;

  if (pointer.down && pointer.dragging) {
    S.x = e.clientX + pointer.dx;
    S.feetY = e.clientY + pointer.dy;
    return;
  }
  if (pointer.down && !pointer.dragging) {
    if (Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY) > DRAG_THRESHOLD) {
      pointer.dragging = true;
      setState('grabbed');
    }
    return;
  }

  // Not dragging: enable mouse capture only while the pointer is over the buddy
  // so clicks pass through to the desktop everywhere else.
  const on = overPet(e.clientX, e.clientY);
  if (on !== hovering) {
    hovering = on;
    window.pet.setIgnoreMouse(!on);
  }
});

window.addEventListener('mousedown', (e) => {
  if (!overPet(e.clientX, e.clientY)) return;
  if (e.button === 2) return; // right-click handled below
  pointer.down = true;
  pointer.dragging = false;
  pointer.startX = e.clientX;
  pointer.startY = e.clientY;
  pointer.dx = S.x - e.clientX;
  pointer.dy = S.feetY - e.clientY;
});

window.addEventListener('mouseup', () => {
  if (!pointer.down) return;
  const wasDragging = pointer.dragging;
  pointer.down = false;
  pointer.dragging = false;

  if (wasDragging) {
    setState('falling'); // let it drop back to the floor
  } else {
    // A pat: quick happy + an affirmation.
    S.resumeAfterHappy = 'idle';
    setState('happy');
    S.calmFor = 0;
    showBubble();
  }
});

window.addEventListener('contextmenu', (e) => {
  if (overPet(e.clientX, e.clientY)) {
    e.preventDefault();
    window.pet.contextMenu();
  }
});

// ---- Boot -----------------------------------------------------------------
async function boot() {
  try {
    const cfg = await window.pet.getConfig();
    if (Array.isArray(cfg.affirmations) && cfg.affirmations.length) {
      affirmations = cfg.affirmations;
    }
    spriteURLs = cfg.sprites || {};
    spriteHeight = cfg.height || 130;
  } catch (err) {
    console.error('Failed to load config, using defaults:', err);
  }

  petH = spriteHeight;
  spriteEl.style.height = `${spriteHeight}px`;

  spriteEl.addEventListener('load', () => {
    petW = spriteEl.offsetWidth || petW;
    petH = spriteEl.offsetHeight || spriteHeight;
  });

  setState('idle');
  beginIdle();
  S.feetY = floorY();
  render();

  scheduleBubble();
  requestAnimationFrame((ts) => {
    lastTs = ts;
    tick(ts);
  });
}

window.addEventListener('resize', () => {
  S.feetY = Math.min(S.feetY, floorY());
});

boot();
