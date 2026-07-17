// Stage the default character art before packaging.
//
// The sprite images are git-ignored (personal art stays out of the repo), so
// they aren't present on a fresh checkout — including the ones CI checks out
// before building the installers. To make sure the packaged app ships with a
// visible buddy, we copy the committed preview loop into the sprites folder
// for any of the core states that don't already have art.
//
// If you've dropped your own idle.gif / walk.gif into sprites/, those are left
// untouched — this only fills in what's missing.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SPRITES = path.join(ROOT, 'sprites');
const SOURCE = path.join(ROOT, 'preview', 'oohnana-loop.gif');

const DEFAULTS = ['idle.gif', 'walk.gif'];

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.warn(
      `[prepare-sprites] ${path.relative(ROOT, SOURCE)} not found — ` +
        'the app will fall back to its built-in placeholder art.'
    );
    return;
  }

  fs.mkdirSync(SPRITES, { recursive: true });

  for (const name of DEFAULTS) {
    const dest = path.join(SPRITES, name);
    if (fs.existsSync(dest)) {
      console.log(`[prepare-sprites] keeping existing sprites/${name}`);
      continue;
    }
    fs.copyFileSync(SOURCE, dest);
    console.log(`[prepare-sprites] added sprites/${name}`);
  }
}

main();
