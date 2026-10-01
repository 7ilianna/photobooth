# Bisque · the doll photo studio 🎀

A dark gothic lolita photobooth that runs in your browser: think a misty 2000s survival-horror title screen, but lace, pearls and porcelain dolls ♱

## How it works

1. **Title screen**: press START (or hit Enter) for the menu: New Session, How to Play and Credits.
2. **Select Frame** (`#/themes`): a tarot reading. The deck shuffles and deals itself into a fan of face-down cards (lace-doily backs, silver key emblem), which tilt towards your cursor with a foil glare. Turn one over and it flips, bursts into sparkles and the deck types out your fortune in a PS2-style dialogue box; *Shuffle again* riffles and re-deals. Plain Black / Plain White sit underneath. Each frame has a character-profile card with sweetness & gloom ratings, mood, motifs and a one-tap "pairs with" look (*Locked Lattice*, *Angel Lullaby* and *Biscuit Waltz*). Every print is a 1080×1350 Instagram post (4:5) with four photos, two on top and two on the bottom.
3. **Shoot** (`#/booth`): through a camera viewfinder with a focus ring, shot counter and live clock. choose a filter (Natural, Digicam, Faded, Monochrome or Pixel), its intensity, and a timer, then strike four poses.
   Tap a thumbnail to retake just that one, or upload photos instead of using the camera.
4. **Print** (`#/result`): switch frame, filter or intensity, write a caption, add an orange digicam date stamp, add stickers
   (ribbons, hearts, crosses, cherries, teacups, shortcake, bats, red & lilac roses, crowns, candles, coffins, moons…) and drag them around.
   Then download it as a 1080×1350 PNG, sized exactly for an Instagram post.

Every button plays a little music-box chime (toggle it with *♪ sound* in the top bar), and the cursor is a tiny silver key.

Everything stays on your device. No photos are uploaded anywhere.

## Designing your own themes

See [`frames/README.md`](frames/README.md): design on top of `frames/template.png`, export a transparent 1080×1350 PNG,
and add it to `frames/` plus the `THEMES` list in `js/frames.js`.

## Run it locally

It's plain HTML/CSS/JS with no build step:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Browsers only allow camera access on `https://` or `localhost`.)

## Put it online (GitHub Pages)

Repo **Settings → Pages → Deploy from a branch**, then choose your branch and `/ (root)`.

## Files

- `index.html`: the four screens
- `styles.css`: drifting fog, chrome script titles, the profile card, pearls and filigree
- `assets/doily.png`: the lace doily turning behind the title screen
- `frames/`: your theme artwork and the design template
- `js/frames.js`: print layout, the frame list and the renderer
- `js/filters.js`: photo filters (baked into the print)
- `js/stickers.js`: vector stickers
- `js/app.js`: router, camera, booth, tarot frame select, sticker editing and download
- `js/sound.js`: the music-box chime and dealing notes (synthesised, no audio files)
