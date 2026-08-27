---
title: 'Home menu hover treatment'
type: 'bugfix'
created: '2026-08-27'
status: 'done'
route: 'one-shot'
---

# Home menu hover treatment

## Intent

**Problem:** The white angular background was visible behind every Home menu option at rest instead of appearing only during interaction.

**Approach:** Keep the menu clean at rest, reveal the white accent on hover or keyboard focus, and scope the treatment to Home menu links only.

## Suggested Review Order

- Scoped interaction styling prevents the Home treatment from leaking to shared links.
  [`Home.css:128`](../../frontend/src/components/Home/Home.css#L128)

- The accent starts hidden and is revealed only by hover or keyboard focus.
  [`Home.css:134`](../../frontend/src/components/Home/Home.css#L134)

- A darker interactive text color preserves contrast over the white accent.
  [`Home.css:145`](../../frontend/src/components/Home/Home.css#L145)

- Reduced-motion users receive the state change without transition animation.
  [`Home.css:156`](../../frontend/src/components/Home/Home.css#L156)