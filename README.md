# Reflect Glass Button

A standalone, framework-free reflect glass button example built around a
shape-specific optical asset pipeline: generated displacement/specular maps,
an inline SVG filter, layered CSS materials, and drag support.

This package is self-contained and does not include any application-specific
logic or branding.

## Preview

Close-up synthetic preview built from local-only assets:

![Reflect Glass Button preview](./demo/readme-preview.png)

## Motion Preview

Animated drag preview with a textless pure glass button:

![Reflect Glass Button motion](./demo/readme-motion.gif)

## Additional Captures

Still captures from the live showcase composition:

<p align="center">
  <img src="./demo/captures/showcase-capture-1.png" width="32%" alt="Reflect Glass Button showcase capture 1" />
  <img src="./demo/captures/showcase-capture-2.png" width="32%" alt="Reflect Glass Button showcase capture 2" />
  <img src="./demo/captures/showcase-capture-3.png" width="32%" alt="Reflect Glass Button showcase capture 3" />
</p>

## Recording

Showcase recording:

<p align="center">
  <a href="./demo/captures/showcase-recording.mov">
    <img src="./demo/captures/showcase-capture-1.png" width="72%" alt="Reflect Glass Button showcase recording poster" />
  </a>
</p>

Open the source file directly:

- [showcase-recording.mov](./demo/captures/showcase-recording.mov)
- `https://github.com/bitifirefly/reflect-glass-button/raw/main/demo/captures/showcase-recording.mov`

## Structure

```text
reflect-glass-button/
├── assets/
│   ├── default-pill/
│   ├── hero-pill/
│   └── motion-pill/
├── demo/
│   ├── captures/
│   │   ├── showcase-capture-1.png
│   │   ├── showcase-capture-2.png
│   │   ├── showcase-capture-3.png
│   │   └── showcase-recording.mov
│   ├── demo.css
│   ├── index.html
│   ├── motion-shot.css
│   ├── motion-shot.html
│   ├── readme-motion.gif
│   ├── readme-preview.png
│   ├── readme-shot.css
│   ├── readme-shot.html
│   ├── showcase.css
│   └── showcase.html
├── scripts/
│   ├── generate-reflect-glass-assets.mjs
│   └── serve.mjs
├── src/
│   ├── reflect-glass-button.css
│   └── reflect-glass-button.js
├── IMPLEMENTATION.md
├── LICENSE
├── package.json
└── README.md
```

## Features

- Plain HTML, CSS, and JavaScript
- Shape-matched displacement/specular PNG assets generated inside the repo
- Chromium-only SVG refraction path that consumes those generated assets
- Draggable button with Pointer Events
- Glass effect built from layered gradients, inner highlights, and `backdrop-filter`
- Same core runtime reused across live demo, README screenshot, and motion capture
- No external artwork or runtime dependencies

## Quick Start

```bash
cd reflect-glass-button
npm run generate:assets
npm run dev
```

Open:

```text
http://127.0.0.1:4173
```

Additional demo pages:

- `http://127.0.0.1:4173/demo/`
- `http://127.0.0.1:4173/demo/showcase.html`
- `http://127.0.0.1:4173/demo/readme-shot.html`
- `http://127.0.0.1:4173/demo/motion-shot.html`

Generate a single preset:

```bash
npm run generate:assets -- --preset hero-pill
```

## Reuse In Another Project

1. Generate optical assets for the exact button shape you want.
2. Copy `src/reflect-glass-button.css`.
3. Copy `src/reflect-glass-button.js`.
4. Register an inline SVG filter that points at the generated
   `displacement-map.png` and `specular-map.png`.
5. Add this markup:

```html
<div class="reflect-glass-anchor" aria-hidden="true"></div>

<a class="reflect-glass-button" data-reflect-glass href="#">
  <span class="reflect-glass-surface" aria-hidden="true"></span>
  <span class="reflect-glass-ornament" aria-hidden="true"></span>
  <span class="reflect-glass-label">Launch</span>
</a>
```

6. Set size, radius, and filter variables for your preset.

```css
.hero-glass-button {
  --reflect-glass-min-width: 430px;
  --reflect-glass-min-height: 128px;
  --reflect-glass-padding: 0 42px;
  --reflect-glass-radius: 38px;
  --reflect-glass-inner-radius: 37px;
  --reflect-glass-highlight-top: 10px;
  --reflect-glass-highlight-height: 24px;
  --reflect-glass-highlight-margin: 24px;
  --reflect-glass-glow-side: 30px;
  --reflect-glass-glow-bottom: 15px;
  --reflect-glass-glow-height: 18px;
  --reflect-glass-label-size: 1.8rem;
  --reflect-glass-label-letter-spacing: -0.02em;
  --reflect-glass-filter: url("#reflectGlassHero");
}
```

7. Load the CSS and JS files.
8. Call:

```html
<script>
  window.ReflectGlassButton.init();
</script>
```

If the button dimensions or corner radius change materially, generate a new
preset. CSS-only resizing is not the same pipeline and will soften or mismatch
the refraction.

## API

The runtime exposes a small browser global:

```js
window.ReflectGlassButton.init(options?)
window.ReflectGlassButton.attach(element, options?)
window.ReflectGlassButton.detectBrowserEngine()
```

Supported options:

- `anchor`: DOM element used for initial placement
- `anchorSelector`: fallback selector for initial placement
- `dragThreshold`: number of pixels before drag suppresses click

## Browser Behavior

- Chromium-based browsers use `backdrop-filter: url(#reflectGlass...)` plus the
  generated optical maps for stronger refraction.
- Other browsers fall back to a simpler frosted-glass treatment.
- Browsers without `backdrop-filter` support get a static translucent fallback.

## Implementation Notes

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for a breakdown of:

- optical asset generation
- SVG filter wiring
- visual layers
- drag behavior
- extraction guidance

## License

[MIT](./LICENSE)
