# TODO

## Shape System Refactor

- Replace the current single long-pill implementation with a layered structure:
  - `glass core`: refraction, blur, highlights, shadow, browser-specific filter path
  - `shape preset`: pill, circle, rounded square, tile, and other regular shapes
  - `behavior layer`: drag, click suppression, anchor positioning, hover state
- Keep the runtime logic reusable across shapes instead of duplicating one component per shape.
- Use CSS variables and modifier classes for regular shape variants before introducing any SVG mask or custom geometry.
- Reserve separate bespoke implementations only for truly irregular silhouettes such as droplets, tails, or non-rectilinear blobs.

## Future Examples

- Add a multi-shape showcase page demonstrating pill, circular, square, and tile presets from the same glass core.
- Document the minimal API for defining a new shape preset.
