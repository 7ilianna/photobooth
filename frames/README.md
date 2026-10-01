# Theme frames

Frames live in this folder: **Locked Lattice** (`theme-1.png`), **Angel Lullaby** (`theme-2.png`) and **Biscuit Waltz** (`theme-3.png`).
Every print is an **Instagram portrait post: 1080 × 1350 px (4:5)**, with four 4:5 photos in a 2×2 grid.

## Making a frame

1. Open `template.png` in your editor (Photoshop, Procreate, Canva, Ibis Paint…). It's 1080 × 1350 px.
2. Design your frame on a layer above it. Keep the **four photo windows transparent**: the photos sit underneath your frame.
   | photo | x | y | size |
   |---|---|---|---|
   | 1 | 90 | 64 | 440 × 550 |
   | 2 | 550 | 64 | 440 × 550 |
   | 3 | 90 | 634 | 440 × 550 |
   | 4 | 550 | 634 | 440 × 550 |
3. Instagram crops posts to 3:4 on your profile grid, which cuts 34 px off each side (the dashed lines).
   The full post still shows when opened, but keep anything important inside the lines.
4. The strip under the photos (from y 1184) is where the booth writes the caption and date. Leave it fairly plain, or ask Claude to turn the text off.
5. Export a **PNG with transparency** at exactly 1080 × 1350 px. Hide or delete the template layer first.
   (Can't export transparency? Send the same design twice, once on white and once on a flat colour,
   and Claude can rebuild the transparency from the pair, glows included.)
6. Save it here as `theme-2.png`, `theme-3.png`… and add an entry for it in `THEMES` at the top of `js/frames.js`,
   or just upload it to Claude in chat and ask for it to be added.

If your art fills the bottom strip, set `footer: false` on the theme so the booth doesn't write a caption or date over it.
