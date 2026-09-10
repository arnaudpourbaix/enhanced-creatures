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
    document.querySelectorAll(".spellbook-tabs").forEach(function (tabs) {
      var buttons = tabs.querySelectorAll(".spellbook-tab-button");
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var targetId = button.getAttribute("data-tab");
          buttons.forEach(function (b) {
            b.classList.toggle("active", b === button);
          });
          tabs.querySelectorAll(".spellbook-tab-panel").forEach(function (panel) {
            panel.classList.toggle("active", panel.id === targetId);
          });
        });
      });
    });
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

  function initFileSearch() {
    var input = document.querySelector(".file-search-input");
    var results = document.querySelector(".file-search-results");
    var dataEl = document.getElementById("file-search-index");
    if (!input || !results || !dataEl) return;

    var index;
    try {
      index = JSON.parse(dataEl.textContent || "[]");
    } catch (e) {
      return;
    }
    if (!Array.isArray(index) || !index.length) return;
    index.sort(function (a, b) {
      return a.file < b.file ? -1 : a.file > b.file ? 1 : 0;
    });

    var MAX_RESULTS = 12;
    var activeIndex = -1;
    var currentHits = [];

    function hideResults() {
      results.hidden = true;
      results.innerHTML = "";
      activeIndex = -1;
      currentHits = [];
    }

    function score(entry, query) {
      var i = entry.file.indexOf(query);
      if (i === -1) return -1;
      return i === 0 ? 0 : 1; // prefix matches rank above mid-string matches
    }

    function search(raw) {
      var query = raw.trim().toUpperCase();
      if (!query) {
        hideResults();
        return;
      }
      currentHits = index
        .map(function (entry) {
          return { entry: entry, rank: score(entry, query) };
        })
        .filter(function (hit) {
          return hit.rank !== -1;
        })
        .sort(function (a, b) {
          return a.rank - b.rank || (a.entry.file < b.entry.file ? -1 : 1);
        })
        .slice(0, MAX_RESULTS)
        .map(function (hit) {
          return hit.entry;
        });
      render();
    }

    function render() {
      results.innerHTML = "";
      activeIndex = -1;
      if (!currentHits.length) {
        var empty = document.createElement("li");
        empty.className = "file-search-empty";
        empty.textContent = "No matching file";
        results.appendChild(empty);
        results.hidden = false;
        return;
      }
      currentHits.forEach(function (entry) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.className = "file-search-hit";
        a.href = "#" + entry.anchor;
        a.dataset.anchor = entry.anchor;
        a.dataset.kind = entry.kind;
        a.dataset.file = entry.file;
        var file = document.createElement("span");
        file.className = "file-search-file";
        file.textContent = entry.file;
        var meta = document.createElement("span");
        meta.className = "file-search-meta";
        meta.textContent = entry.creature;
        a.appendChild(file);
        a.appendChild(meta);
        li.appendChild(a);
        results.appendChild(li);
      });
      results.hidden = false;
    }

    function setActive(next) {
      var hits = results.querySelectorAll(".file-search-hit");
      if (!hits.length) return;
      activeIndex = (next + hits.length) % hits.length;
      hits.forEach(function (hit, i) {
        hit.classList.toggle("active", i === activeIndex);
      });
      hits[activeIndex].scrollIntoView({ block: "nearest" });
    }

    function flash(el) {
      el.classList.add("file-search-target");
      window.setTimeout(function () {
        el.classList.remove("file-search-target");
      }, 1600);
    }

    function activate(hit) {
      var anchor = hit.dataset.anchor;
      var kind = hit.dataset.kind;
      var file = hit.dataset.file;
      var card = document.getElementById(anchor);
      hideResults();
      input.value = "";
      input.blur();
      if (!card) return;
      // For anything other than a plain replacement, the detail the reader wants is inside the
      // adjustments panel - open it via the same summary click initAdjustmentsPanel() listens for,
      // then scroll to the card that owns this file (its data-files carries the resref).
      var summary =
        kind !== "replaces" ? card.querySelector(".creature-adjustments > summary") : null;
      if (summary) {
        summary.click();
        var panel = document.querySelector(".adjustments-panel");
        var target =
          panel && file
            ? panel.querySelector('[data-files~="' + file.replace(/["\\]/g, "\\$&") + '"]')
            : null;
        if (target) {
          window.requestAnimationFrame(function () {
            // "center" rather than "start" so the sticky .adj-tree at the top of the scroll
            // container never covers the card we just jumped to.
            target.scrollIntoView({ block: "center" });
            flash(target);
          });
        }
        return;
      }
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      flash(card);
    }

    input.addEventListener("input", function () {
      search(input.value);
    });

    input.addEventListener("keydown", function (event) {
      if (results.hidden) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === "Enter") {
        var hits = results.querySelectorAll(".file-search-hit");
        var target = activeIndex >= 0 ? hits[activeIndex] : hits[0];
        if (target) {
          event.preventDefault();
          activate(target);
        }
      } else if (event.key === "Escape") {
        hideResults();
      }
    });

    results.addEventListener("click", function (event) {
      var hit = event.target.closest ? event.target.closest(".file-search-hit") : null;
      if (!hit) return;
      event.preventDefault();
      activate(hit);
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest || !event.target.closest(".file-search")) hideResults();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();
    initSpellbookTabs();
    initTraitPopover();
    initAdjustmentsPanel();
    initFileSearch();
  });
})();
