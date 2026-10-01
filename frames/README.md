# Theme frames

Bisque has four themes. Each one shows a drawn placeholder until you add your own artwork.
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
6. Save it here as `theme-1.png`, `theme-2.png`, `theme-3.png` or `theme-4.png`.
   You can also upload the PNGs to Claude in chat and ask for them to be added.

When a file exists, the booth uses it instead of the placeholder.

## Renaming themes

Theme names, Japanese labels and fallback colors live in `THEMES` at the top of `js/frames.js`.
