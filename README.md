# 喫茶 黒薔薇 · Kurobara Photo Booth 🎀

A gothic lolita × retro Tokyo kissaten photo booth that runs in your browser. Lace, pearls and coffee jelly ♰

## How it works

1. **Menu** (`#/menu`): pick a *set* (Classic Strip, Trio, Duo or Postcard grid) and a *tablecloth* (frame):
   Requiem, Vampire Tea Party, Black Lace, Pearl Cream, Strawberry Parfait, Coffee Jelly, Bordeaux Rose or Melon Soda Velvet.
2. **Booth** (`#/booth`): choose a filter (Natural, Kissaten, Noir, Rosé, Showa Film, Dreamy) and a timer,
   then strike your poses. Tap any thumbnail to retake that one, or upload photos instead of using the camera.
3. **Print** (`#/result`): switch frames and filters, write a caption, add stickers (ribbons, hearts, crosses,
   cherries, coffee, bats, roses, crowns, candles, coffins, moons…) and drag them around. Then download your strip as a PNG.

Everything stays on your device. No photos are uploaded anywhere.

## Run it locally

It's plain HTML/CSS/JS with no build step:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Browsers only allow camera access on `https://` or `localhost`.)

## Put it online (GitHub Pages)

Repo **Settings → Pages → Deploy from a branch**, then choose your branch and `/ (root)`.
Your booth will be live at `https://<username>.github.io/photobooth/`.

## Files

- `index.html`: the four screens
- `styles.css`: lace, pearls and the kissaten theme
- `js/frames.js`: layouts, frame designs and the strip renderer
- `js/filters.js`: photo filters (baked into the print)
- `js/stickers.js`: vector stickers
- `js/app.js`: router, camera, booth, sticker editing and download
