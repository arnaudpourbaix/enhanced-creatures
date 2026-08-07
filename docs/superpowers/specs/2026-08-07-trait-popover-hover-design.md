# Trait popover: add hover alongside click — design

## Problem

The trait popover added in [2026-08-07-trait-overlay-design.md](2026-08-07-trait-overlay-design.md) only opens on click. A mouse user has to click, read, then explicitly dismiss (close button / click elsewhere / Escape / scroll) even for a quick glance at a trait's description.

## Goal

Add hover as a second way to open the popover, without weakening anything the click path already does for touch and keyboard/screen-reader users.

## Non-goals

- No change to touch behavior (no `mouseenter` fires on touch; touch users keep exactly today's click flow).
- No change to keyboard behavior (Tab + Enter keeps exactly today's click flow, including focus-into-popover and focus-return-on-dismiss).
- No new CSS needed — same popover, same styling, just a second way to trigger `showPopover`/`hidePopover`.

## Behavior

**Hover-open:** `mouseenter` on a `.trait-link` starts a **300ms** timer; if the pointer is still over the link when it fires, the popover opens as **unpinned**. Moving the pointer off before the timer fires cancels it (no flash-open on a fast pass-by). If the popover is already visible and unpinned (the pointer moved directly from one trait link to another) when `mouseenter` fires on the new link, it updates to the new link's content immediately, with no open-delay — the delay is only for the first link in a hover sequence, so moving across several trait links in a row feels responsive rather than sluggish.

**Hover-close:** `mouseleave` on a `.trait-link` starts a **250ms** timer; if the pointer hasn't entered the popover itself by the time it fires, an unpinned popover closes. The popover element gets its own `mouseenter`/`mouseleave` pair: entering it cancels the pending close, leaving it (without having moved onto another trait link) restarts the same 250ms close timer. This lets a user move the pointer from the link onto the popover to read/scroll a long description without it vanishing.

**Click still pins:** Clicking a trait link — whether or not it's already open from hover — opens it **pinned** (today's behavior, unchanged): focus moves into the popover, and it only closes via the close button, an outside click, Escape, or scroll. Mouse-out no longer closes a pinned popover.

**Unpinned popovers ignore outside-click/Escape, but not scroll:** since mouse-out already handles closing an unpinned (hover-only) popover, the outside-click and Escape listeners only need to act when the popover is pinned — moving the mouse anywhere else to click something necessarily leaves the trait link first, which the 250ms close timer already handles well before a click lands. (The close button is only reachable by mouse, and reaching it means the pointer is inside the popover, which already cancels the close timer — not a functional gap, just scoping outside-click/Escape to the pinned case so they don't fight with the hover close timer.) Scroll is different: the page can scroll without the mouse ever leaving the link (keyboard paging, trackpad), which would leave an unpinned popover visually stranded next to where the link used to be. Scroll dismissal stays unconditional — it closes the popover whether pinned or not.

## Implementation shape

`docs/monsters.js`, inside `initTraitPopover()`:

- `showPopover(link, entry, pinned)` — new `pinned` param. When `pinned` is true: behaves exactly as today (sets `openLink`, moves focus into the popover). When false: shows content and positions the popover, but does not move focus and does not set `openLink` (so the existing focus-management in `hidePopover()` has nothing to return focus to, since none was taken).
- `hidePopover(skipRefocus)` — unchanged signature/behavior; still only relevant to the pinned path.
- A new `var pinned = false;` (or equivalent) tracks whether the currently-open popover was click-opened. The click handler sets it true and calls `showPopover(link, entry, true)`. The hover-open timer calls `showPopover(link, entry, false)` only if nothing is already pinned open (a click-pinned popover is never interrupted by hovering a different trait link — hovering while one is already pinned open does nothing until the pinned one is dismissed).
- The outside-click / Escape / scroll listeners each add a `pinned` check up front and no-op when the currently open popover isn't pinned (hover popovers are closed by their own mouseleave timer instead).
- Two new timer variables (`openTimer`, `closeTimer`) hold the pending `setTimeout` handles; both are cleared on the opposing event so a link that's rapidly entered/left/re-entered doesn't stack timers.

## Testing

No test runner exists for `docs/monsters.js` (pre-existing project constraint, unchanged by this addition). Verified by static code reading; final visual/interaction QA (hover timing feel, pin/unpin transitions, moving the pointer onto the popover) done by the user in a real browser, as with the original feature.
