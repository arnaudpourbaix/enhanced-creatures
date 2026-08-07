# Trait overlay popover — design

## Problem

On the monster documentation page (`docs/monsters.html`), each creature card lists its "trait"-type immunities as links (e.g. `<a href="#firstAid">First Aid</a>`) that jump down to a shared glossary section at the bottom of the page (`.traits-glossary`, populated by `DocumentationService.getTraits()`). Jumping away from the creature card to read a one-line trait description is disruptive, especially on long pages with many creatures.

## Goal

Clicking a trait link shows its description immediately, in a small popover anchored near the link, without leaving the creature card. The link's `href` is preserved so it still works as a plain anchor jump if JavaScript is unavailable or the user opens it in a new tab.

## Non-goals

- No change to non-"trait" immunities or item traits — those already render their full description inline on the creature card and are untouched.
- No duplication of trait description text into every creature card. The popover reads its content from the existing glossary section at click time, so there is exactly one copy of each trait's text in the generated HTML (as today).
- No modal/backdrop-dimming treatment — this is a lightweight anchored popover, not a full-screen dialog.

## Data flow

Content is not duplicated. The popover is populated by reading the existing glossary entry for the clicked trait, at click time, from the DOM.

### Generator changes (`generator/lib/src/services/doc/documentation.service.ts`)

**`getCreatureTraits()`** — trait links gain a `trait-link` class so the client JS can target them. The `href="#<name>"` is unchanged:

```html
<a href="#firstAid" class="trait-link">First Aid</a>
```

**`getTraits()`** — each glossary entry is wrapped in a single container carrying the `id` (currently the `id` sits on a bare `<a>` nested inside the `<h5>`, with the title and description as loose sibling tags following it — that makes it impossible to grab "this trait's whole entry" as one DOM node). New shape:

```html
<div class="trait-entry" id="firstAid">
  <h5>First Aid</h5>
  <p>Description text…</p>
</div>
```

The anchor `href="#firstAid"` still resolves to this element for non-JS navigation (browsers scroll to match on `id`, same as they previously scrolled to match on the nested `<a id>`).

### Template changes (`generator/lib/templates/index.html`)

A single reusable popover element is added once, near the end of `<body>`, hidden by default:

```html
<div class="trait-popover" role="dialog" aria-hidden="true" hidden>
  <button type="button" class="trait-popover-close" aria-label="Close">&times;</button>
  <div class="trait-popover-body"></div>
</div>
```

## Client behavior (`docs/monsters.js`)

New `initTraitPopover()`, wired up alongside the existing `initSidebarToggle()` / `initSpellbookTabs()` on `DOMContentLoaded`:

- Click on `a.trait-link`: `preventDefault()`, resolve the target glossary entry via `document.getElementById(...)` from the link's `href` fragment.
  - If found: copy its `innerHTML` into `.trait-popover-body`, position the popover (see below), show it (`hidden = false`, `aria-hidden = "false"`).
  - If not found (defensive — shouldn't happen since every trait link is generated from `State.immunities`): let the default anchor navigation proceed instead.
- Positioning: `position: fixed`, anchored just below the clicked link using its `getBoundingClientRect()`; flips above the link if there isn't enough room below; horizontal position is clamped so the popover stays within the viewport (accounts for a capped max-width, ~320px).
- Dismiss on: clicking the close button, clicking anywhere outside the popover, `Escape`, or page scroll (scroll dismissal avoids having to continuously reposition a popover anchored to content that's moving under it).
- Clicking a different trait link while one is already open just repositions/repopulates the same popover element (no stacking).

## Styling (`docs/monsters.css`)

`.trait-popover` reuses the existing panel look (`var(--color-panel)` background, `var(--color-gold)` border, same font vars as `.sidebar`), fixed positioning, `max-width: 320px`, drop shadow, `z-index` above `.sidebar`/`.backdrop` (which top out at 25) so it's never hidden behind the mobile sidebar.

## Testing

- `documentation.service.test.ts`: update assertions for the new `trait-link` class on trait anchors and the new wrapping `<div class="trait-entry" id="...">` around glossary entries.
- Manual verification in a browser: click a trait link and confirm the popover shows correct content and positions sensibly near the link (including near viewport edges), verify all three dismiss paths (outside click, Escape, scroll) and the close button, and check mobile width behavior.
