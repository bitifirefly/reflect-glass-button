# Reflect Glass Button

A standalone, framework-free reflect glass button example with drag support,
backdrop sampling, and optional Chromium-only SVG refraction.

This package is self-contained and does not include any application-specific
logic or branding.

## Structure

```text
reflect-glass-button/
├── demo/
│   ├── demo.css
│   └── index.html
├── scripts/
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
- Draggable button with Pointer Events
- Glass effect built from layered gradients and `backdrop-filter`
- Optional stronger refraction in Chromium via SVG displacement filter
- No external assets or runtime dependencies

## Quick Start

```bash
cd reflect-glass-button
npm run dev
```

Open:

```text
http://127.0.0.1:4173
```

## Reuse In Another Project

1. Copy `src/reflect-glass-button.css`
2. Copy `src/reflect-glass-button.js`
3. Copy the SVG filter block from `demo/index.html` if you want Chromium
   displacement refraction
4. Add this markup:

```html
<div class="reflect-glass-anchor" aria-hidden="true"></div>

<a class="reflect-glass-button" data-reflect-glass href="#">
  <span class="reflect-glass-surface" aria-hidden="true"></span>
  <span class="reflect-glass-ornament" aria-hidden="true"></span>
  <span class="reflect-glass-label">Launch</span>
</a>
```

5. Load the CSS and JS files
6. Call:

```html
<script>
  window.ReflectGlassButton.init();
</script>
```

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

- Chromium-based browsers use `backdrop-filter: url(#reflectGlass)` for stronger
  refraction.
- Other browsers fall back to a simpler frosted-glass treatment.
- Browsers without `backdrop-filter` support get a static translucent fallback.

## Implementation Notes

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for a breakdown of:

- visual layers
- drag behavior
- SVG refraction filter
- extraction guidance

## License

[MIT](./LICENSE)
