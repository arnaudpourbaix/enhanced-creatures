(function () {
  "use strict";

  function initSidebarToggle() {
    var toggle = document.querySelector(".menu-toggle");
    var sidebar = document.querySelector(".sidebar");
    var backdrop = document.querySelector(".backdrop");
    if (!toggle || !sidebar || !backdrop) return;

    function closeSidebar() {
      sidebar.classList.remove("open");
      backdrop.classList.remove("visible");
      toggle.setAttribute("aria-expanded", "false");
    }

    function toggleSidebar() {
      var isOpen = sidebar.classList.toggle("open");
      backdrop.classList.toggle("visible", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    }

    toggle.addEventListener("click", toggleSidebar);
    backdrop.addEventListener("click", closeSidebar);
    sidebar.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeSidebar();
    });
  }

  function initSpellbookTabs() {
    // A mod-variant tab panel can itself contain a nested level-tabs group (a spellbook long
    // enough to need spell-level tabs inside a mod tab - see
    // documentation.service.ts's renderAbilityEntries), reusing the very same
    // spellbook-tab-*/spellbook-tabs classes one level down. `:scope`-qualifying every lookup to
    // this container's own direct children keeps each tab group wired to only its own
    // buttons/panels instead of a deep querySelectorAll also matching the nested group's.
    document.querySelectorAll(".spellbook-tabs").forEach(function (tabs) {
      var buttons = tabs.querySelectorAll(
        ":scope > .spellbook-tab-buttons > .spellbook-tab-button",
      );
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var targetId = button.getAttribute("data-tab");
          // Each mod panel builds its own independent nested level-tabs widget, so a level
          // selection in one doesn't carry over to another by DOM id - but comparing a spellbook
          // across mods is the whole point of the mod tabs, so read off the leaving panel's
          // active level *label* ("Level 3"/"Innate") before switching, and re-select that same
          // label in the panel being entered if it has one - keeping the reader on the same level
          // instead of snapping back to Level 1.
          var activePanel = tabs.querySelector(":scope > .spellbook-tab-panel.active");
          var activeLevelLabel = getActiveNestedTabLabel(activePanel);

          buttons.forEach(function (b) {
            b.classList.toggle("active", b === button);
          });
          var targetPanel = null;
          tabs.querySelectorAll(":scope > .spellbook-tab-panel").forEach(function (panel) {
            var isTarget = panel.id === targetId;
            panel.classList.toggle("active", isTarget);
            if (isTarget) targetPanel = panel;
          });
          if (activeLevelLabel && targetPanel)
            selectNestedTabByLabel(targetPanel, activeLevelLabel);
        });
      });
    });
  }

  function getNestedSpellbookTabs(panel) {
    return panel ? panel.querySelector(":scope > .spellbook-tabs") : null;
  }

  function getActiveNestedTabLabel(panel) {
    var nested = getNestedSpellbookTabs(panel);
    if (!nested) return null;
    var active = nested.querySelector(
      ":scope > .spellbook-tab-buttons > .spellbook-tab-button.active",
    );
    return active ? active.textContent : null;
  }

  function selectNestedTabByLabel(panel, label) {
    var nested = getNestedSpellbookTabs(panel);
    if (!nested) return;
    var match = null;
    nested
      .querySelectorAll(":scope > .spellbook-tab-buttons > .spellbook-tab-button")
      .forEach(function (button) {
        if (button.textContent === label) match = button;
      });
    // No matching level in this mod's spellbook (e.g. it stops at level 5 while the one just left
    // goes to 7) - leave it on its own default rather than forcing a level it doesn't have.
    if (!match || match.classList.contains("active")) return;
    // Reuses that button's own click listener (bound when initSpellbookTabs walked this nested
    // group) rather than duplicating its active-toggling logic here.
    match.click();
  }

  function initTraitPopover() {
    var popover = document.querySelector(".trait-popover");
    var body = popover ? popover.querySelector(".trait-popover-body") : null;
    var closeButton = popover ? popover.querySelector(".trait-popover-close") : null;
    if (!popover || !body || !closeButton) return;

    // Allow the popover to receive programmatic focus, and give assistive
    // tech an accessible name, without needing a template change + regenerate.
    // Generic wording: this popover is shared by trait links and, since the
    // attacks section started linkifying "Cast spell" entries, spell links too.
    popover.setAttribute("tabindex", "-1");
    popover.setAttribute("aria-label", "Description");

    var OPEN_DELAY = 300;
    var CLOSE_DELAY = 250;

    var openLink = null;
    var pinned = false;
    var openTimer = null;
    var closeTimer = null;

    function clearOpenTimer() {
      if (openTimer) {
        window.clearTimeout(openTimer);
        openTimer = null;
      }
    }

    function clearCloseTimer() {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function scheduleClose() {
      closeTimer = window.setTimeout(function () {
        closeTimer = null;
        hidePopover();
      }, CLOSE_DELAY);
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
      if (!popover.hidden && !event.target.closest(".trait-popover")) {
        // Outside click: the browser has typically already moved focus to
        // whatever was clicked. Don't yank it back to the trait link.
        hidePopover(true);
      }
    });

    closeButton.addEventListener("click", function () {
      hidePopover();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !popover.hidden) hidePopover();
    });

    window.addEventListener(
      "scroll",
      function (event) {
        // Scrolling the popover's own (scrollable, overflow-y: auto) content
        // must not dismiss it -- only dismiss on scrolls of the underlying page.
        // Also cancels a pending hover-open timer: the page can scroll without
        // the mouse ever leaving the trait link, which could otherwise pop the
        // popover open mid-scroll only to have the next scroll event close it.
        clearOpenTimer();
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
        scheduleClose();
      });
    });

    popover.addEventListener("mouseenter", function () {
      if (!pinned) clearCloseTimer();
    });

    popover.addEventListener("mouseleave", function () {
      if (pinned) return;
      scheduleClose();
    });
  }

  function initAdjustmentsPanel() {
    var panel = document.querySelector(".adjustments-panel");
    var mount = panel && panel.querySelector(".adjustments-panel-mount");
    var titleEl = panel && panel.querySelector(".adjustments-panel-title");
    var closeButton = panel && panel.querySelector(".adjustments-panel-close");
    var backdrop = document.querySelector(".adjustments-backdrop");
    if (!panel || !mount || !titleEl || !closeButton || !backdrop) return;

    // Move just the .adj-layout into the panel, not the whole <details> - a <details> wraps its
    // content in an implicit box that breaks the flex/height chain the two scroll panes need.
    var active = null; // the .adj-layout currently in the panel
    var home = null; // { parent, next } to move it back to

    function openPanel(details) {
      if (active) restore();
      var layout = details.querySelector(".adj-layout");
      if (!layout) return;
      home = { parent: layout.parentNode, next: layout.nextSibling };
      mount.appendChild(layout);
      titleEl.textContent = details.getAttribute("data-title") || "Adjustments";
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      backdrop.classList.add("visible");
      document.body.classList.add("adjustments-open");
      var content = layout.querySelector(".adj-content");
      if (content) content.scrollTop = 0;
      active = layout;
    }

    function restore() {
      if (!active) return;
      home.parent.insertBefore(active, home.next);
      active = null;
    }

    function closePanel() {
      restore();
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      backdrop.classList.remove("visible");
      document.body.classList.remove("adjustments-open");
    }

    document.addEventListener("click", function (event) {
      var summary = event.target.closest ? event.target.closest("summary") : null;
      if (summary && summary.parentNode.classList.contains("creature-adjustments")) {
        event.preventDefault();
        openPanel(summary.parentNode);
        return;
      }
      var treeLink = event.target.closest ? event.target.closest(".adj-tree a") : null;
      if (treeLink && active) {
        event.preventDefault();
        var target = document.getElementById(treeLink.getAttribute("href").slice(1));
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        active.querySelectorAll(".adj-tree a").forEach(function (link) {
          link.classList.toggle("active", link === treeLink);
        });
      }
    });

    closeButton.addEventListener("click", closePanel);
    backdrop.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) closePanel();
    });
  }

  // Sticky offsets: the toolbar (.type-filter-bar) sticks under the mobile .topbar, the sidebar
  // under both. Their heights change with the window width (the chips wrap), so they are measured
  // into CSS variables instead of guessed.
  function initStickyOffsets() {
    var root = document.documentElement;
    var topbar = document.querySelector(".topbar");
    var bar = document.querySelector(".type-filter-bar");
    function update() {
      // A display: none topbar (desktop) has no offsetParent and takes no room.
      var top = topbar && topbar.offsetParent !== null ? topbar.offsetHeight : 0;
      root.style.setProperty("--topbar-height", top + "px");
      root.style.setProperty("--sticky-offset", top + (bar ? bar.offsetHeight : 0) + "px");
    }
    update();
    window.addEventListener("resize", update);
    if (window.ResizeObserver && bar) new ResizeObserver(update).observe(bar);
  }

  // Creature filters, combined: the type (toolbar chips + type tags on entry/card titles) and the
  // search box. A card stays when it has the type and its name contains the search, or when the
  // search is exactly one of its .cre files (base or adjustment). Entry blocks and sidebar items
  // left without a visible card are hidden, and the sidebar groups the filters opened close again
  // when they change.
  function initFilters() {
    var input = document.querySelector(".creature-search");
    var noMatch = document.querySelector(".no-match");
    var state = { type: "", query: "" };

    // Card id -> lowercase creature name, read from its sidebar link (same text as the card).
    var names = {};
    document.querySelectorAll('.sidebar a[href^="#m"]').forEach(function (a) {
      names[a.getAttribute("href").slice(1)] = a.textContent.toLowerCase();
    });
    // Card id -> its upper-case .cre files, from the page's file index.
    var files = {};
    var dataEl = document.getElementById("file-search-index");
    try {
      JSON.parse((dataEl && dataEl.textContent) || "[]").forEach(function (entry) {
        (files[entry.anchor] = files[entry.anchor] || {})[entry.file] = true;
      });
    } catch (e) {
      files = {};
    }

    function hasType(el, type) {
      return (
        !type ||
        (" " + (el.getAttribute("data-types") || "") + " ").indexOf(" " + type + " ") !== -1
      );
    }
    function matchesQuery(card, query) {
      if (!query) return true;
      if ((names[card.id] || "").indexOf(query.toLowerCase()) !== -1) return true;
      return !!(files[card.id] && files[card.id][query.toUpperCase()]);
    }

    function apply() {
      var filtering = !!(state.type || state.query);
      var anyVisible = false;
      document.querySelectorAll(".type-chip").forEach(function (chip) {
        chip.classList.toggle("on", chip.getAttribute("data-type") === state.type);
      });
      document.querySelectorAll(".content .creature").forEach(function (card) {
        card.hidden = !(hasType(card, state.type) && matchesQuery(card, state.query));
        if (!card.hidden) anyVisible = true;
      });
      document.querySelectorAll(".entry-block").forEach(function (block) {
        block.hidden = !Array.prototype.some.call(
          block.querySelectorAll(".creature"),
          function (c) {
            return !c.hidden;
          },
        );
      });
      document.querySelectorAll(".sidebar li[data-types]").forEach(function (li) {
        var link = li.querySelector("a");
        var card = link && document.getElementById(link.getAttribute("href").slice(1));
        li.hidden = !card || card.hidden;
      });
      document.querySelectorAll(".sidebar li.entry").forEach(function (group) {
        var visible = Array.prototype.some.call(
          group.querySelectorAll("li[data-types]"),
          function (li) {
            return !li.hidden;
          },
        );
        group.hidden = !visible;
        // Open the matching groups while filtering, and close again the ones it opened (not
        // those the reader opened) when the filters change or are cleared.
        var details = group.querySelector("details");
        if (details.hasAttribute("data-filter-opened")) {
          details.open = false;
          details.removeAttribute("data-filter-opened");
        }
        if (filtering && visible && !details.open) {
          details.open = true;
          details.setAttribute("data-filter-opened", "");
        }
      });
      if (noMatch) noMatch.hidden = anyVisible;
    }

    function setType(type) {
      state.type = type || "";
      apply();
    }
    document.querySelectorAll(".type-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        setType(chip.getAttribute("data-type"));
      });
    });
    document.querySelectorAll(".type-tag").forEach(function (tag) {
      tag.addEventListener("click", function (e) {
        e.preventDefault();
        // A tag can sit inside an adjustments <summary>: don't let the click open that panel.
        e.stopPropagation();
        setType(tag.getAttribute("data-type"));
        window.scrollTo(0, 0);
      });
    });
    if (input) {
      input.addEventListener("input", function () {
        state.query = input.value.trim();
        apply();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        input.value = "";
        state.query = "";
        apply();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();
    initSpellbookTabs();
    initTraitPopover();
    initAdjustmentsPanel();
    initStickyOffsets();
    initFilters();
  });
})();
