# sprites/

Drop your character art here. The app looks for these files (configured in
`config/sprites.json`) and falls back to built-in placeholder art for any that
are missing, so you can add them one at a time.

| Filename     | State     | Plays when…                                  |
|--------------|-----------|----------------------------------------------|
| `idle.gif`   | idle      | standing around, breathing/blinking          |
| `walk.gif`   | walk      | wandering across the desktop (auto-mirrored) |
| `happy.png`  | happy     | your cursor comes near, or you pat it        |
| `peek.png`   | peek      | occasional shy peek                          |
| `sleep.png`  | sleep     | after a long idle stretch                    |

Notes:
- PNG or GIF both work. Use a **transparent background** so it floats cleanly.
- Any resolution is fine; on-screen height is set by `height` in
  `config/sprites.json`.
- Want different filenames? Just edit `config/sprites.json`.

These image files are intentionally **git-ignored** — keep your personal art
local rather than committing it to the repo.
