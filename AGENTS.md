# Agent guide: Figma → banner build pipeline

This repo turns Figma ad designs into static HTML/CSS/JS banners (Vite + GSAP). The Figma → banner mapping is **not** part of the project's built-in tooling — it lives in `.context/` and was built ad-hoc to handle a single recruitment campaign (`tex25830`). Treat it as an authoring helper, not part of the deploy pipeline.

## Directory map

- `tex25830/banners/<size>-<variant>/` — one folder per banner. Standard layout: `index.html`, `fallback.jpg`, `assets/{css,js,img}/`. Names use `300x250-1`, `300x250-2`, etc. (the Vite config + `banner-generator.js` rely on the `WIDTHxHEIGHT` prefix).
- `tex25830/banners/_banner-template/` — reference banner used by `npm run generate:banners`. Don't break it.
- `.context/` — agent workspace. `gitignored`. Holds the manifest and build script described below.
- `.context/banner-manifest.json` — every banner's layer specs (Figma asset URLs, positions, sizes).
- `.context/build-banners.js` — Node script that reads the manifest and writes each banner folder.
- `.context/package.json` — pins `sharp` (the only runtime dep for the build script).

## The build script

Run from `.context/`:

```bash
node build-banners.js                       # rebuild all 20
node build-banners.js --only=300x250-1      # rebuild one
node build-banners.js --only=300x250-1,728x90-2  # rebuild several
```

What it does per banner:

1. Downloads each layer's SVG from its Figma asset URL.
2. Renders SVG → raster with `sharp` at `SCALE=2` (retina).
3. Bg specifically: renders at the bg vector's native size, then **crops to the visible intersection with the banner viewport** and writes `bg.jpg` (mozjpeg q85). The cropped pos/size are mutated back onto `banner.bg` so HTML/CSS/fallback all use the new coords.
4. Headlines come straight from Figma as PNG (the designer flattens "Title" text layers in Figma — see "Headlines" below).
5. Writes `index.html`, `assets/css/source.css` (and a copy as `style.css`), `assets/js/script.js`.
6. Composites a `fallback.jpg` from all layers in z-order.

The HTML uses GSAP for a simple fade/slide-in timeline. Layers are absolutely-positioned `<img>` tags inside `.frame`. The white footer behind the logo lockup is a `<div class="footer-bg">`, not an image.

## Manifest format

Each banner entry:

```jsonc
{
  "name": "300x250-1",          // becomes the folder name
  "size": [300, 250],           // banner viewport
  "campaign": "v1",             // free-form tag

  "headlineAsset": "https://www.figma.com/api/mcp/asset/<uuid>",
  "headlinePos":  [22.10, 23.63],
  "headlineSize": [143.36, 126.37],
  "headlineColor": "white",      // unused now (kept for legacy SVG-text path)

  "bg":     { "url": "...", "pos": [-51, -29], "size": [501, 334] },
  "logo":   { "url": "...", "pos": [21, 208],  "size": [129.5, 30.1] },
  "cta":    { "url": "...", "pos": [173, 196], "size": [129, 54] },
  "footer": { "pos": [0, 196], "size": [173, 54], "color": "white" },

  // Optional layers (banner-shape dependent):
  "ctaBar": { "url": "...", "pos": [...], "size": [...] },  // full-width blue bar interstitials
  "logo1":  { ... }, "logo2": { ... },                       // 320x50 splits the lockup
  "image1": { ... }, "image2": { ... },                      // 320x50-2 has dual photos
  "line":   { "url": "...", "pos": [...], "length": 35 }     // vertical separator
}
```

Positions/sizes are in banner coordinate space. Negative bg `pos` is normal — bgs are usually wider than the viewport.

## Working with Figma MCP

Use `mcp__figma__get_metadata` first (cheap; returns the frame's children with names + bbox), then `mcp__figma__get_design_context` on a specific layer node to get its asset URL. Asset URLs expire in **7 days**.

Two important quirks:

- The asset endpoint returns **SVG** even though the URL looks like a PNG. The build script converts via sharp (`density: 300`).
- When you re-fetch a design context after the designer edits, the asset URLs change. Update the manifest. Don't trust cached URLs.

URL form: `https://figma.com/design/:fileKey/:fileName?node-id=:nodeId`. In MCP calls, replace `-` with `:` in the nodeId. Current file key: `MezBZlHwi0KEZwv1qxO9ie`.

## Common workflows

### Update one banner's bg (designer changed the image)

1. Call `mcp__figma__get_metadata` on the banner's frame node to find the bg vector node id and its updated `width`/`height`/`x`/`y`.
2. Call `mcp__figma__get_design_context` on the bg vector node to get the fresh asset URL.
3. Edit `.context/banner-manifest.json`: replace the `bg.url`, `bg.pos`, and `bg.size` for that banner.
4. `cd .context && node build-banners.js --only=<name>`.
5. **Purge `_review/`** before running `npm run review` — Vite caches built assets by content hash but won't notice if the source changed and a stale entry still exists. Symptom: built CSS shows the *old* dimensions.

### Add a new banner size

1. Add a new entry to `banner-manifest.json` following the format above. Pick the right optional layer set by looking at the Figma frame's children.
2. `node build-banners.js --only=<name>` to generate the folder.
3. The Vite config auto-discovers via `glob.sync('banners/*/index.html')` — no config edits needed.

### Re-pull all flattened headlines

If the designer re-flattens Title layers in Figma:

1. Get fresh metadata for each banner frame to find new title node ids (they typically change).
2. For each, get design context → grab `imgTitle` URL.
3. Bulk-update the `headlineAsset` URLs and `headlinePos`/`headlineSize` in the manifest.
4. Rebuild all.

### Headlines

Two code paths exist for headlines, both still in `build-banners.js`:

- **Current**: download the flattened headline PNG from `banner.headlineAsset`. Used because the designer flattened the type so we don't have to render text. Pixel-perfect Proxima Nova.
- **Legacy/fallback**: render the headline as SVG `<text>` using Avenir Next Light (closest local font to Proxima Nova), with a width-fit auto-shrink. This is what the script did before the designer flattened the type. Don't use it unless `headlineAsset` is missing — Avenir's metrics are wider than Proxima and the auto-shrink looks off at large sizes.

If you remove the legacy path, also remove the `headline` (string array), `headlineFontSize`, `headlineLineHeight`, `headlineTracking` fields from the manifest — they're dead.

## Sharp gotchas (pre-loaded landmines)

- **Chained `composite().extract()` runs in the wrong order.** Sharp's pipeline is not literal — `extract` evaluates before `composite`, which clips the canvas before layers are added. Workaround used in `buildFallback`: composite to a buffer with `.png().toBuffer()`, then `sharp(buffer).extract(...)`.
- **"Image to composite must have same dimensions or smaller"** — the canvas must be at least as big as every layer's *placement extent* (left + width, top + height). The fallback compositor builds an over-sized canvas (`maxRight + offsetX` × `maxBottom + offsetY`) then extracts the banner viewport from it.
- **`extract_area: bad extract area`** — your crop rect went outside the source image. Almost always means the bg vector doesn't fully cover the banner viewport (e.g. 728x90's bg is ~250px wide, banner is 728px). The bg crop logic in `buildBgJpg` clamps to the intersection, so check that logic if you change it.

## Old folders to delete on a fresh campaign

The repo started with `300x50`, `970x90`, `970x250` from a prior campaign that have no Figma equivalent in `tex25830`. They were deleted. If the next campaign brings them back, add manifest entries — don't reuse the old static folders.

## Verifying changes

```bash
cd tex25830
npm run review              # builds + writes _review/index.html (iframe grid)
npm run preview             # serves _review at http://localhost:4173
```

For a single banner without the Vite build step, open `tex25830/banners/<name>/index.html` directly in a browser. Animations play on load.

The fallback `.jpg` in each folder is the source of truth for "what should this look like statically." Compare against Figma screenshots when verifying.

## What this pipeline is *not*

- It's not wired into `npm run build`. Editing `banner-manifest.json` doesn't trigger anything until you re-run `node .context/build-banners.js`.
- It doesn't validate against Figma. If the manifest drifts from the Figma file (renamed nodes, expired URLs, changed bbox), the script happily rebuilds with stale data. Fetch fresh metadata when in doubt.
- It doesn't publish anywhere. `npm run deploy` zips the *built* `_review/` output for ad networks; that's a separate step the user runs.
