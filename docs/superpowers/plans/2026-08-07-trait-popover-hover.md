# Trait Popover Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hover as a second way to open the trait popover (`docs/monsters.js`), alongside the existing click behavior, without weakening anything the click path already does for touch and keyboard/screen-reader users.

**Architecture:** `initTraitPopover()` gains a `pinned` flag: click opens the popover pinned (today's full behavior — focus moves in, only closes via close-button/outside-click/Escape/scroll), hover opens it unpinned (a lighter preview — no focus theft, closes on mouse-out via a short delay instead). Two debounce timers (`openTimer`, `closeTimer`) manage the hover delays and are shared with the popover element itself so moving the pointer from a trait link onto the popover (to read/scroll a long description) doesn't dismiss it.

**Tech Stack:** Plain ES5-ish JS (`docs/monsters.js`, no build step, no test runner for this file — same as the popover's original implementation).

## Global Constraints

- Click keeps opening the popover **pinned**: focus moves into it, and it's dismissed only via the close button, an outside click, Escape, or scroll — identical to current behavior.
- Hover opens the popover **unpinned**: no focus is taken, and it's dismissed by mouse-out (via a delay) or by scroll — not by outside-click or Escape.
- Hover-open delay: **300ms** after `mouseenter`, cancelled if the pointer leaves before it fires.
- Hover-close delay: **250ms** after `mouseleave`, cancelled if the pointer enters the popover itself before it fires (and restarted if the pointer then leaves the popover without pinning it).
- If the pointer moves directly from one trait link to another while the popover is already visible and unpinned, it swaps to the new link's content immediately — no open-delay on that swap.
- Scroll dismisses the popover unconditionally (pinned or not) — the page can scroll without the mouse leaving the link, which would otherwise strand an unpinned popover next to where the link used to be.
- No touch-device or keyboard behavior changes: `mouseenter`/`mouseleave` don't fire on touch, and Tab+Enter keeps exactly today's click flow.
- No changes to `docs/monsters.css` or the generated template — same popover element, same styling, just new triggers.

---

### Task 1: Add hover open/close alongside the existing click behavior

**Files:**
- Modify: `docs/monsters.js:46-135` (the entire `initTraitPopover()` function)

**Interfaces:**
- Consumes: `.trait-link` anchors, `.trait-entry` glossary entries by id, `.trait-popover`/`.trait-popover-close`/`.trait-popover-body` — all unchanged from the existing feature, no new markup or CSS needed.
- Produces: nothing consumed elsewhere — this is the only task in this plan.

There is no test runner for this file. Verification is static: careful line-by-line tracing of every call site, the same method used to verify the original click-only implementation.

- [ ] **Step 1: Replace `initTraitPopover()` with the hover-aware version**

In `docs/monsters.js`, replace the entire `initTraitPopover` function (currently lines 46-135, from `function initTraitPopover() {` through its closing `}`) with:

```js
  function initTraitPopover() {
    var popover = document.querySelector(".trait-popover");
    var body = popover ? popover.querySelector(".trait-popover-body") : null;
    var closeButton = popover ? popover.querySelector(".trait-popover-close") : null;
    if (!popover || !body || !closeButton) return;

    // Allow the popover to receive programmatic focus, and give assistive
    // tech an accessible name, without needing a template change + regenerate.
    popover.setAttribute("tabindex", "-1");
    popover.setAttribute("aria-label", "Trait description");

    var OPEN_DELAY = 300;
    var CLOSE_DELAY = 250;

    var openLink = null;
    var pinned = false;
    var openTimer = null;
    var closeTimer = null;

    function clearOpenTimer() {
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = null;
      }
    }

    function clearCloseTimer() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function hidePopover(skipRefocus) {
      popover.hidden = true;
      popover.setAttribute("aria-hidden", "true");
      pinned = false;
      if (openLink && !skipRefocus) {
        var linkToRefocus = openLink;
        openLink = null;
        linkToRefocus.focus();
      } else {
        openLink = null;
      }
    }

    function positionPopover(link) {
      var rect = link.getBoundingClientRect();
      var margin = 8;
      // Must match .trait-popover's max-width in docs/monsters.css. The
      // popover's width can't be measured live (offsetWidth) because it is
      // shrink-to-fit and its own `left` depends on knowing the width first.
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

    function showPopover(link, entry, isPinned) {
      pinned = isPinned;
      openLink = isPinned ? link : null;
      body.innerHTML = entry.innerHTML;
      popover.hidden = false;
      popover.setAttribute("aria-hidden", "false");
      positionPopover(link);
      if (isPinned) {
        popover.focus();
      }
    }

    document.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a.trait-link") : null;
      if (link) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var targetId = link.getAttribute("href").slice(1);
        var entry = document.getElementById(targetId);
        if (!entry) return;
        event.preventDefault();
        clearOpenTimer();
        clearCloseTimer();
        showPopover(link, entry, true);
        return;
      }
      if (pinned && !popover.hidden && !event.target.closest(".trait-popover")) {
        // Outside click: the browser has typically already moved focus to
        // whatever was clicked. Don't yank it back to the trait link.
        hidePopover(true);
      }
    });

    closeButton.addEventListener("click", function () {
      hidePopover();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && pinned && !popover.hidden) hidePopover();
    });

    window.addEventListener(
      "scroll",
      function (event) {
        // Scrolling the popover's own (scrollable, overflow-y: auto) content
        // must not dismiss it -- only dismiss on scrolls of the underlying page.
        // Unlike outside-click/Escape, this fires whether or not the popover
        // is pinned: the page can scroll without the mouse ever leaving the
        // trait link, which would otherwise strand a hover-opened popover
        // next to where the link used to be.
        if (!popover.hidden && !popover.contains(event.target)) hidePopover();
      },
      true,
    );

    document.querySelectorAll("a.trait-link").forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        if (pinned) return;
        clearCloseTimer();
        var targetId = link.getAttribute("href").slice(1);
        var entry = document.getElementById(targetId);
        if (!entry) return;
        if (!popover.hidden) {
          // Already showing another link's content (pointer moved directly
          // from one trait link to another) - swap immediately, no delay.
          showPopover(link, entry, false);
          return;
        }
        clearOpenTimer();
        openTimer = window.setTimeout(function () {
          openTimer = null;
          showPopover(link, entry, false);
        }, OPEN_DELAY);
      });

      link.addEventListener("mouseleave", function () {
        if (pinned) return;
        clearOpenTimer();
        closeTimer = window.setTimeout(function () {
          closeTimer = null;
          hidePopover();
        }, CLOSE_DELAY);
      });
    });

    popover.addEventListener("mouseenter", function () {
      if (!pinned) clearCloseTimer();
    });

    popover.addEventListener("mouseleave", function () {
      if (pinned) return;
      closeTimer = window.setTimeout(function () {
        closeTimer = null;
        hidePopover();
      }, CLOSE_DELAY);
    });
  }
```

- [ ] **Step 2: Verify every call site by static trace**

Re-read the full function and confirm, for each path:

- **Click on a trait link** (`document`'s click listener, trait-link branch): clears both timers (so a click immediately overrides any in-flight hover), calls `showPopover(link, entry, true)` — `pinned` becomes `true`, `openLink` is set, focus moves into the popover. Unchanged from before this task except the two `clear*Timer()` calls and the new third argument.
- **Modifier-click** (Ctrl/Cmd/Shift/Alt): still returns before `preventDefault()`/`showPopover()`, unchanged.
- **Outside click**: only calls `hidePopover(true)` when `pinned` is true. When an unpinned (hover) popover is open and the user clicks elsewhere, this branch now does nothing — confirm that's fine because clicking anything else necessarily means the pointer already left the trait link, which already started (or completed) the 250ms close timer via `mouseleave`.
- **Close button click**: calls `hidePopover()` with no args, unchanged — works correctly whether the popover was pinned (refocuses the link) or unpinned (`openLink` is `null`, so the `else` branch just no-ops on refocus).
- **Escape**: only calls `hidePopover()` when `pinned` is true, so it no longer does anything for a hover-only popover — confirm this matches the constraint (unpinned relies on mouse-out, not Escape).
- **Scroll**: unchanged condition (`!popover.hidden && !popover.contains(event.target)`) — still dismisses regardless of `pinned`, per the Global Constraints.
- **`mouseenter` on a trait link**: no-ops entirely if `pinned`. Otherwise clears any pending close timer, resolves the entry, and either (a) swaps immediately if the popover is already visible (mid-hover-sequence case), or (b) starts a fresh 300ms open timer.
- **`mouseleave` on a trait link**: no-ops if `pinned`. Otherwise clears any pending open timer (cancels an open that hadn't fired yet) and starts a 250ms close timer.
- **`mouseenter`/`mouseleave` on the popover itself**: entering cancels a pending close (only relevant when unpinned, but harmless to call when there's nothing pending); leaving restarts the close timer unless pinned.
- **`hidePopover` always resets `pinned = false`** — confirm no path can leave a stale `pinned = true` after the popover is actually hidden (would incorrectly block a later hover-open's mouseenter no-op check, since the popover would appear "pinned" while actually closed).

You likely can't interact with a real browser in this environment — that's expected. Do your best with the static trace above; final visual/interaction QA (hover timing feel, the pin/unpin transition, moving the pointer from a link onto the popover) is done by the user afterward.

- [ ] **Step 3: Commit**

```bash
git add docs/monsters.js
git commit -m "feat: open the trait popover on hover, alongside click"
```
