# oohnana 🐹

A little desktop buddy that wanders your screen and shares positive
affirmations. The window is fully transparent and click-through — only the
character itself is visible and interactive, everything else passes straight
to your desktop.

![oohnana loop](preview/oohnana-loop.webp)

## 📥 Download & run (no coding needed)

Grab the file for your computer from the
**[Releases page](https://github.com/annnabel/oohnana/releases/latest)** and
open it — no Node, no terminal, nothing to install first.

| Your computer | Download this file        | How to open it                                   |
|---------------|---------------------------|--------------------------------------------------|
| **Windows**   | `oohnana-*-portable.exe`  | Double-click it. That's the whole thing — nothing installs. |
| **Windows**   | `oohnana-*-setup.exe`     | Prefer a Start-menu shortcut? Use this installer instead. |
| **macOS**     | `oohnana-*.dmg`           | Open it, drag **oohnana** to Applications, then launch it. |
| **Linux**     | `oohnana-*.AppImage`      | Right-click → Properties → allow "execute", then double-click. |

The buddy appears and starts wandering your screen. To quit: right-click the
character and choose **Quit**, or press **Ctrl+Shift+Q** (⌘⇧Q on macOS).

> **First-launch safety prompt (this is normal).** The app is *unsigned* —
> code-signing certificates cost money, and this is a free hobby app — so your
> OS will warn you the first time:
> - **Windows:** "Windows protected your PC" → click **More info** → **Run
>   anyway**.
> - **macOS:** if it says the app "can't be opened", **right-click** the app →
>   **Open** → **Open**. You only do this once.
>
> There's no network access in the app at all (see [Security notes](#security-notes)),
> so once it's open it just sits on your screen and does its thing.

## 🛠️ Build the app yourself

Want to produce those download files (e.g. to share your own build)? With
[Node.js](https://nodejs.org) installed:

```sh
npm ci
npm run dist          # builds for the computer you're on
```

The finished file lands in the `dist/` folder. You can only build the
**Windows** `.exe` on Windows and the **macOS** `.dmg` on a Mac — each OS makes
its own file. To build all three at once, push a version tag and let GitHub do
it for you: tag `v1.0.1`, push it, and the
[build workflow](.github/workflows/build.yml) compiles Windows, macOS, and
Linux on their own machines and posts every file to the Releases page. (Run it
by hand any time from the repo's **Actions** tab.)

Platform-specific builds are also available: `npm run dist:win`,
`npm run dist:mac`, `npm run dist:linux`.

## Run from source

Prefer to run it straight from the code (or hack on it)? Takes about five
minutes.

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
