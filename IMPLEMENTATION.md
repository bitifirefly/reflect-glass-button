# Implementation Notes

This document explains the construction of the reflect glass button in a way that
is easy to extract into another codebase.

## 1. Visual Composition

The button is built from several stacked layers:

1. Base container
   - Rounded rectangle
   - Transparent background
   - Main outer shadow

2. Surface layer
   - Semi-transparent white gradient
   - `backdrop-filter` blur and saturation
   - Light inner ring and lower inner shadow

3. Ornament layer
   - Secondary translucent layer
   - Helps fake curved depth

4. Top highlight
   - Narrow bright band near the top edge
   - Suggests reflected light

5. Bottom glow
   - Small blurred accent near the bottom edge
   - Suggests refracted light collecting inside the glass

## 2. Chromium Refraction

Chromium gets a stronger effect through an SVG filter:

1. Blur the sampled background slightly.
2. Generate a displacement map.
3. Distort the background through `feDisplacementMap`.
4. Increase saturation.
5. Blend the result back with a subtle highlight.

This creates a more "liquid" refraction than plain `backdrop-filter`.

Browsers that do not support this path still get the layered frosted glass
version.

## 3. Drag Behavior

Dragging is implemented with Pointer Events:

1. On `pointerdown`
   - Store pointer id
   - Store starting pointer coordinates
   - Store current button offset
   - Capture the pointer

2. On `pointermove`
   - Compute delta from the starting pointer position
   - Clamp movement to viewport bounds
   - Update CSS variables `--drag-x` and `--drag-y`

3. On `pointerup` or `pointercancel`
   - Clear drag state
   - Release pointer capture

4. Click suppression
   - If movement exceeds the drag threshold, the next click is prevented
   - This keeps dragging from accidentally triggering navigation

## 4. Initial Placement

The script reads a placeholder anchor element and positions the button relative
to that anchor.

This has two benefits:

- The button starts in a meaningful place without hard-coded viewport numbers
- The same component can be dropped into different layouts

## 5. Minimal Integration Contract

To integrate the button elsewhere, only three pieces are required:

1. Markup

```html
<div class="reflect-glass-anchor" aria-hidden="true"></div>

<a class="reflect-glass-button" data-reflect-glass href="#">
  <span class="reflect-glass-surface" aria-hidden="true"></span>
  <span class="reflect-glass-ornament" aria-hidden="true"></span>
  <span class="reflect-glass-label">Launch</span>
</a>
```

2. Core stylesheet

- `src/reflect-glass-button.css`

3. Core runtime

- `src/reflect-glass-button.js`

## 6. Why The Demo Is Split From The Core

The repository separates:

- `src/`: reusable implementation
- `demo/`: page layout and presentation only

That separation makes it easier to:

- publish the effect as a snippet or component
- test changes without coupling them to one page design
- embed the button into another system later

## 7. Suggested Open Source Scope

If this example is published independently, the recommended public scope is:

- `src/`
- `demo/`
- `scripts/serve.mjs`
- `README.md`
- `IMPLEMENTATION.md`
- `LICENSE`

No framework adapters are included by default. Those can be added later as
separate examples if needed.
