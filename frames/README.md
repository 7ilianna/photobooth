# Theme frames

Bisque has four themes, and each one shows a drawn placeholder until you add your own artwork.

## Making a frame

1. Open `template.png` in your editor (Photoshop, Procreate, Canva…). It's **1200 × 1800 px**, which is a 4×6 in print at 300 dpi.
2. Design your frame on a layer above it. Keep the **four photo windows transparent**: the photos sit underneath your frame.
3. The bottom strip (below the photos) is where the booth writes the caption and date. Leave it fairly plain, or tell Claude to turn the text off.
4. Export a **PNG with transparency** at exactly 1200 × 1800 px.
5. Save it here as `theme-1.png`, `theme-2.png`, `theme-3.png` or `theme-4.png`.

That's it! When a file exists, the booth uses it instead of the placeholder.

## Renaming themes

Theme names, Japanese labels and fallback colors live in `THEMES` at the top of `js/frames.js`.
