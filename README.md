# oohnana 🐹

A little desktop buddy that wanders your screen and shares positive
affirmations. The window is fully transparent and click-through — only the
character itself is visible and interactive, everything else passes straight
to your desktop.

![oohnana loop](preview/oohnana-loop.webp)

## Install on your desktop

Works on macOS, Windows, and Linux. Takes about five minutes.

### 1. Install Node.js

Download the **LTS** installer from the official site only:
<https://nodejs.org> — don't use random "Node installer" links from search
ads. On macOS you can also use `brew install node`.

Check it worked:

```sh
node --version   # v20 or newer is fine
npm --version
```

### 2. Get the code

```sh
git clone https://github.com/annnabel/oohnana.git
cd oohnana
```

(Or download the ZIP from the GitHub page and unzip it — same thing.)

### 3. Install dependencies with the lockfile

```sh
npm ci
```

Use `npm ci` rather than `npm install`: it installs **exactly** what
`package-lock.json` pins — Electron and nothing else, verified against a
cryptographic integrity hash — and refuses to run if anything doesn't match.

### 4. Add the character art

The sprite images are git-ignored (personal art stays local), so drop the
animation in yourself:

```sh
cp preview/oohnana-loop.gif sprites/idle.gif
cp preview/oohnana-loop.gif sprites/walk.gif
```

Both loop files have transparent backgrounds, so the character floats
cleanly over whatever's behind it. See `sprites/README.md` for the other
optional states (`happy.png`, `peek.png`, `sleep.png`).

### 5. Run it

```sh
npm start
```

The buddy appears and starts wandering. To quit: right-click the character
and choose **Quit**, or press **Ctrl+Shift+Q** (⌘⇧Q on macOS) from anywhere.

### Optional: start automatically at login

- **macOS** — System Settings → General → Login Items → add a small script
  or Automator app that runs `npm start` in the project folder.
- **Windows** — press `Win+R`, run `shell:startup`, and drop in a shortcut
  to a `.bat` file containing `cd /d C:\path\to\oohnana && npm start`.
- **Linux** — add a `.desktop` entry in `~/.config/autostart/` that runs
  `npm start` in the project directory.

## Security notes

Things this app deliberately does — and doesn't do — so you can trust what's
running on your screen all day:

- **No network access at all.** The app never phones home, fetches remote
  content, or auto-updates. Affirmations and art are local files. The
  renderer's Content-Security-Policy (`default-src 'none'`) blocks any
  remote resource as defense in depth.
- **One dependency, pinned.** The only dependency is Electron itself, pinned
  in `package-lock.json` with an integrity hash; `npm ci` verifies it.
- **Locked-down renderer.** The window runs sandboxed with context isolation
  on and Node integration off; the page can't navigate anywhere or open new
  windows. The only bridge to the system is four tiny read-only/UI calls in
  `src/main/preload.js` (~10 lines — read it!).
- **Never takes focus.** The window is non-focusable and click-through
  except directly over the character, so it can't intercept your typing.
- **Run it as your normal user.** No admin/root needed — if anything asks
  for elevated permissions, that's a red flag.
- **Small enough to audit.** The whole app is three short files under
  `src/`. Reading them before running is encouraged.
