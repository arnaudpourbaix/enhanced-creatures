# Trait Overlay Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking a creature's trait link on `docs/monsters.html` shows that trait's description in a small popover anchored next to the link, instead of jumping down to the page's glossary section.

**Architecture:** The generator (`generator/lib/src/services/doc/documentation.service.ts`) marks up trait links with a `trait-link` class and wraps each glossary entry in a container keyed by the trait's id — no new content is generated, this only adds hooks for client-side JS. `docs/monsters.js` adds a click handler that reads the matching glossary entry's `innerHTML` straight out of the DOM and displays it in a single reusable popover element, positioned next to the clicked link. `docs/monsters.css` styles that popover to match the site's existing panel look.

**Tech Stack:** TypeScript (generator, Vitest for tests), vanilla ES5-style JS and hand-written CSS for the static doc site (no build step for `docs/*.js`/`docs/*.css`).

## Global Constraints

- Trait description text must not be duplicated into every creature card — the popover reads it from the existing glossary section at click time (one copy of each trait's text in the generated HTML, same as today).
- Trait links keep their `href="#<name>"` so they still work as a plain anchor jump with JavaScript disabled or on middle-click-to-new-tab.
- One reusable popover element, not one per trait link or per creature.
- Popover `z-index` must sit above `.sidebar`/`.backdrop` (currently top out at 25).
- No full-screen modal / backdrop dimming — this is a lightweight anchored popover.

---

### Task 1: Generator — tag creature trait links for the popover

**Files:**
- Modify: `generator/lib/src/services/doc/documentation.service.ts:142-146` (`getCreatureTraits`)
- Test: `generator/lib/src/services/doc/documentation.service.test.ts:153-173`

**Interfaces:**
- Consumes: nothing new.
- Produces: trait links now carry `class="trait-link"` in addition to their existing `href="#<name>"`. Task 4's JS selects on `a.trait-link`.

- [ ] **Step 1: Update the existing test to expect the new class**

In `generator/lib/src/services/doc/documentation.service.test.ts`, change the `"wraps trait content in a detail-section with a Traits heading when present"` test's assertion:

```ts
    expect(template.text).toBe(
      '<div class="detail-section"><h4>Traits</h4><div class="traits">' +
        '<h5><a href="#construct" class="trait-link">Construct</a></h5>' +
        "</div></div>",
    );
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `generator/`): `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: FAIL on the updated assertion (current output is missing `class="trait-link"`).

- [ ] **Step 3: Add the class in the implementation**

In `generator/lib/src/services/doc/documentation.service.ts`, in `getCreatureTraits`, change:

```ts
      traits.push(
        `<a href="#${immunity.name}">${translationService.fromOptional(immunity.stringRef)}</a>`,
      );
```

to:

```ts
      traits.push(
        `<a href="#${immunity.name}" class="trait-link">${translationService.fromOptional(
          immunity.stringRef,
        )}</a>`,
      );
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: PASS (all tests in the file, not just the one touched).

- [ ] **Step 5: Commit**

```bash
git add generator/lib/src/services/doc/documentation.service.ts generator/lib/src/services/doc/documentation.service.test.ts
git commit -m "feat: tag creature trait links with a class for the trait popover"
```

---

### Task 2: Generator — wrap glossary entries for the popover

**Files:**
- Modify: `generator/lib/src/services/doc/documentation.service.ts:252-268` (`getTraits`)
- Test: `generator/lib/src/services/doc/documentation.service.test.ts:238-269`

**Interfaces:**
- Consumes: nothing new.
- Produces: each glossary entry becomes `<div class="trait-entry" id="<name>"><h5>Title</h5>[<p>Description</p>]</div>` (previously the `id` sat on a bare `<a>` nested in the `<h5>`, with the paragraph as a loose sibling). `href="#<name>"` from Task 1 still resolves to this element. Task 4's JS reads this element's `innerHTML` via `document.getElementById(name)`.

- [ ] **Step 1: Write a failing test locking in the new wrapper shape**

Add to the `describe("getTraits", ...)` block in `generator/lib/src/services/doc/documentation.service.test.ts`:

```ts
  it("wraps each trait entry in a container div keyed by the trait's name", () => {
    State.immunities = [
      {
        name: "construct",
        type: "trait",
        doc: true,
        stringRef: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    expect(documentationService.getTraits()).toBe(
      '<div class="trait-entry" id="construct"><h5>Construct</h5></div>',
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `generator/`): `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: FAIL — current output is `<h5><a id="construct">Construct</a></h5>` (no wrapping div, `id` on the nested anchor instead).

- [ ] **Step 3: Rework the implementation to wrap each entry**

In `generator/lib/src/services/doc/documentation.service.ts`, replace `getTraits`'s body:

```ts
  getTraits() {
    let result = "";
    // State.immunities is sorted once when loaded (see stateService.loadImmunities()) - both
    // this trait listing and weiduFunctionService's generated function order rely on that same
    // invariant rather than either one re-sorting (or silently depending on the other having
    // sorted first).
    for (const immunity of State.immunities) {
      if (immunity.type === "trait" && immunity.doc) {
        let entry = `<h5>${translationService.fromOptional(immunity.stringRef)}</h5>`;
        if (immunity.description) {
          entry += `<p>${translationService.from(immunity.description)}</p>`;
        }
        result += `<div class="trait-entry" id="${immunity.name}">${entry}</div>`;
      }
    }
    return result;
  }
```

(Keep the existing comment above the loop — the sort-order invariant it documents still applies.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: PASS — including the two pre-existing tests (`"appends the description paragraph..."`, `"omits the description paragraph..."`), which use `toContain("<p>")` / `not.toContain("<p>")` and remain valid since the paragraph is still present, just nested one level deeper.

- [ ] **Step 5: Commit**

```bash
git add generator/lib/src/services/doc/documentation.service.ts generator/lib/src/services/doc/documentation.service.test.ts
git commit -m "feat: wrap trait glossary entries in a container keyed by trait name"
```

---

### Task 3: Add the popover container to the page template and regenerate the docs

**Files:**
- Modify: `generator/lib/templates/index.html:59-63`
- Regenerate (build artifact, no manual edits): `docs/monsters.html`

**Interfaces:**
- Consumes: nothing new.
- Produces: a hidden `.trait-popover` element present once in `docs/monsters.html`, with a `.trait-popover-close` button and a `.trait-popover-body` content area. Task 4's JS queries these by class; Task 5's CSS styles `.trait-popover` / `.trait-popover-close` / `.trait-popover-body`.

- [ ] **Step 1: Add the popover markup to the template**

In `generator/lib/templates/index.html`, change:

```html
  <footer class="site-footer">
    Licensed under CC BY-NC-SA 3.0.
  </footer>
  <script src="monsters.js" defer></script>
```

to:

```html
  <footer class="site-footer">
    Licensed under CC BY-NC-SA 3.0.
  </footer>
  <div class="trait-popover" role="dialog" aria-hidden="true" hidden>
    <button type="button" class="trait-popover-close" aria-label="Close">&times;</button>
    <div class="trait-popover-body traits"></div>
  </div>
  <script src="monsters.js" defer></script>
```

(`trait-popover-body` also gets the existing `traits` class so it picks up the `.traits h5` / `.traits p` sizing rules already defined in `docs/monsters.css`, the same way the on-page trait sections do — no need to redeclare that sizing for the popover.)

- [ ] **Step 2: Regenerate the docs**

Run (from `generator/`): `npm run generate`
Expected: exits with `Finished!` and no errors; `docs/monsters.html` is rewritten.

- [ ] **Step 3: Verify the regenerated output**

Run (from repo root): `grep -c "trait-popover" docs/monsters.html`
Expected: `1` (the container appears exactly once, near the end of the file).

Run: `grep -c "trait-link" docs/monsters.html`
Expected: a number greater than `0` (creature trait links picked up the class from Task 1).

Run: `grep -c "trait-entry" docs/monsters.html`
Expected: a number greater than `0` (glossary entries picked up the wrapper from Task 2).

- [ ] **Step 4: Commit**

```bash
git add generator/lib/templates/index.html docs/monsters.html
git commit -m "feat: add trait popover container to the monster docs template"
```

---

### Task 4: Implement the trait popover click behavior

**Files:**
- Modify: `docs/monsters.js`

**Interfaces:**
- Consumes: `.trait-link` anchors (Task 1) with `href="#<name>"`; `#<name>` elements from `.trait-entry` (Task 2); `.trait-popover` / `.trait-popover-close` / `.trait-popover-body` (Task 3).
- Produces: `initTraitPopover()`, called from the existing `DOMContentLoaded` listener alongside `initSidebarToggle()` and `initSpellbookTabs()`.

There is no test runner wired up for this plain JS file (no bundler/build step for `docs/*.js`), so this task is verified manually in a browser.

- [ ] **Step 1: Add `initTraitPopover()`**

In `docs/monsters.js`, add this function above the `document.addEventListener("DOMContentLoaded", ...)` block at the bottom of the file:

```js
  function initTraitPopover() {
    var popover = document.querySelector(".trait-popover");
    var body = popover ? popover.querySelector(".trait-popover-body") : null;
    var closeButton = popover ? popover.querySelector(".trait-popover-close") : null;
    if (!popover || !body || !closeButton) return;

    function hidePopover() {
      popover.hidden = true;
      popover.setAttribute("aria-hidden", "true");
    }

    function positionPopover(link) {
      var rect = link.getBoundingClientRect();
      var margin = 8;
      var maxWidth = 320;

      var left = Math.min(rect.left, window.innerWidth - maxWidth - margin);
      left = Math.max(margin, left);
      popover.style.left = left + "px";

      var popoverHeight = popover.offsetHeight;
      var top = rect.bottom + margin;
      if (top + popoverHeight > window.innerHeight && rect.top - popoverHeight - margin > 0) {
        top = rect.top - popoverHeight - margin;
      }
      popover.style.top = top + "px";
    }

    function showPopover(link, entry) {
      body.innerHTML = entry.innerHTML;
      popover.hidden = false;
      popover.setAttribute("aria-hidden", "false");
      positionPopover(link);
    }

    document.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a.trait-link") : null;
      if (link) {
        var targetId = link.getAttribute("href").slice(1);
        var entry = document.getElementById(targetId);
        if (!entry) return;
        event.preventDefault();
        showPopover(link, entry);
        return;
      }
      if (!popover.hidden && !event.target.closest(".trait-popover")) {
        hidePopover();
      }
    });

    closeButton.addEventListener("click", hidePopover);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !popover.hidden) hidePopover();
    });

    window.addEventListener(
      "scroll",
      function () {
        if (!popover.hidden) hidePopover();
      },
      true,
    );
  }
```

- [ ] **Step 2: Wire it up on load**

Change:

```js
  document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();
    initSpellbookTabs();
  });
```

to:

```js
  document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();
    initSpellbookTabs();
    initTraitPopover();
  });
```

- [ ] **Step 3: Manually verify in a browser**

Open `docs/monsters.html` directly in a browser (e.g. on Windows: `start docs/monsters.html` from the repo root, or double-click the file).

Verify:
- Click any trait link on a creature card (e.g. a construct's "Construct" trait) → the page does NOT jump/scroll, and a box appears near the link containing that trait's title (and description, if it has one). It'll look unstyled/plain until Task 5 — that's expected at this point.
- Click elsewhere on the page → the box disappears.
- Open it again, press `Escape` → it disappears.
- Open it again, click its close button (the `×`) → it disappears.
- Open it again, scroll the page → it disappears.
- Right-click a trait link → "Open in new tab" still works (the `href` fallback is intact).

- [ ] **Step 4: Commit**

```bash
git add docs/monsters.js
git commit -m "feat: show trait descriptions in an anchored popover on click"
```

---

### Task 5: Style the popover and final QA pass

**Files:**
- Modify: `docs/monsters.css`

**Interfaces:**
- Consumes: `.trait-popover`, `.trait-popover-close`, `.trait-popover-body` (Task 3/4).
- Produces: nothing consumed elsewhere — this is the last task.

No test runner for CSS either; verified manually in a browser.

- [ ] **Step 1: Add the popover styles**

In `docs/monsters.css`, add after the existing `.traits-glossary` rule (before the `@media (max-width: 860px)` block):

```css
.trait-popover {
  position: fixed;
  z-index: 30;
  max-width: 320px;
  background: var(--color-panel);
  border: 1px solid var(--color-gold);
  border-radius: 4px;
  padding: 14px 16px;
  box-shadow: 0 4px 14px rgba(59, 42, 23, 0.35);
}

.trait-popover-close {
  float: right;
  background: none;
  border: none;
  font-size: 1.1rem;
  line-height: 1;
  color: var(--color-ink-soft);
  cursor: pointer;
  padding: 0 0 4px 8px;
}

.trait-popover-close:hover {
  color: var(--color-red);
}

.trait-popover-body {
  clear: both;
}

.trait-popover-body h5:first-child {
  margin-top: 0;
}
```

(`max-width: 320px` here must stay in sync with the `maxWidth = 320` constant in `docs/monsters.js`'s `positionPopover` — that JS uses the same number to keep the popover from being clamped off-screen horizontally.)

- [ ] **Step 2: Manually verify in a browser**

Reload `docs/monsters.html` (no regeneration needed — only the linked CSS changed) and re-run the full checklist from Task 3 Step 3, now checking appearance too:

- Click a trait link on a creature card near the middle of the page → popover appears just below the link, styled like the site's panels (matches `.sidebar`'s look), with a visible close `×` in the top-right corner.
- Click a trait link near the right edge of the viewport → popover stays fully within the viewport (doesn't overflow off the right edge).
- Click a trait link near the bottom of the viewport → popover flips to appear above the link instead of being cut off below.
- Resize the browser to a narrow/mobile width (< 860px, matching the existing responsive breakpoint) → popover still fits on screen and is readable.
- Re-check all four dismiss paths (click outside, `Escape`, close button, scroll) still work with the new styles.

- [ ] **Step 3: Commit**

```bash
git add docs/monsters.css
git commit -m "style: style the trait popover to match the site's panel look"
```
