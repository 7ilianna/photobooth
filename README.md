# Bisque · 人形写真館 🎀

A dark gothic lolita photobooth that runs in your browser: think a 2000s game title screen, but lace, pearls and filigree ♱

## How it works

1. **Title screen**: press START (or hit Enter).
2. **Select Theme** (`#/themes`): pick one of four themes. Every print is a 1080×1350 Instagram post (4:5) with four photos, two on top and two on the bottom.
3. **Shoot** (`#/booth`): choose a filter (Natural, Digicam, Faded, Monochrome, Lilac, Rosé, Dreamy) and a timer, then strike four poses.
   Tap a thumbnail to retake just that one, or upload photos instead of using the camera.
4. **Print** (`#/result`): switch theme or filter, write a caption, add an orange digicam date stamp, add stickers
   (ribbons, hearts, crosses, cherries, teacups, shortcake, bats, red & lilac roses, crowns, candles, coffins, moons…) and drag them around.
   Then download it as a 1080×1350 PNG, sized exactly for an Instagram post.

Everything stays on your device. No photos are uploaded anywhere.

## Designing your own themes

The four themes are placeholders for now. See [`frames/README.md`](frames/README.md): design on top of `frames/template.png`,
export a transparent PNG and save it as `frames/theme-1.png` … `theme-4.png`.

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
- `styles.css`: the night sky, glossy script titles, pearls and filigree
- `frames/`: your theme artwork and the design template
- `js/frames.js`: print layout, the four themes and the renderer
- `js/filters.js`: photo filters (baked into the print)
- `js/stickers.js`: vector stickers
- `js/app.js`: router, camera, booth, sticker editing and download
