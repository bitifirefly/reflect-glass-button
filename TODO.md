# TODO

## Shape Presets

- Add more preset generators for circle, rounded square, and tile buttons.
- Keep the runtime logic reusable across shapes instead of duplicating behavior code.
- For any shape that should match the current "correct pipeline", generate
  shape-specific displacement/specular assets instead of only stretching CSS.
- Reserve bespoke implementations only for genuinely irregular silhouettes such
  as droplets, tails, or non-rectilinear blobs.

## Future Examples

- Add a multi-shape showcase page demonstrating pill, circular, square, and tile presets from the same glass core.
- Document the minimal API for defining a new optical preset and matching SVG filter block.
