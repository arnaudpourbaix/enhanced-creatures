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

  document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();
    initSpellbookTabs();
    initTraitPopover();
  });
})();
