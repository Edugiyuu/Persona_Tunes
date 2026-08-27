---
title: 'Animate Home menu clip path'
type: 'bugfix'
created: '2026-08-27'
status: 'done'
route: 'one-shot'
---

# Animate Home menu clip path

## Intent

**Problem:** A GSAP tween targeted `.HomeButtons .Link:hover` during mount even though no hovered element or pseudo-element was available to animate.

**Approach:** Animate the white `::before` accent with reversible CSS transitions, coordinate its geometry and timing, and limit hover behavior to precise pointing devices while preserving keyboard focus.

## Suggested Review Order

- Coordinates text and accent timing through the same easing curve.
  [`Home.css:128`](../../frontend/src/components/Home/Home.css#L128)

- Animates the accent from the initial polygon and right-side anchor.
  [`Home.css:136`](../../frontend/src/components/Home/Home.css#L136)

- Preserves the complete animated state for keyboard navigation.
  [`Home.css:152`](../../frontend/src/components/Home/Home.css#L152)

- Prevents sticky hover behavior on touch devices.
  [`Home.css:163`](../../frontend/src/components/Home/Home.css#L163)

- Removes transitions when reduced motion is requested.
  [`Home.css:176`](../../frontend/src/components/Home/Home.css#L176)