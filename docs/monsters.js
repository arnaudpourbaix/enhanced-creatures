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

    var openLink = null;

    function hidePopover() {
      popover.hidden = true;
      popover.setAttribute("aria-hidden", "true");
      if (openLink) {
        var linkToRefocus = openLink;
        openLink = null;
        linkToRefocus.focus();
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

    function showPopover(link, entry) {
      openLink = link;
      body.innerHTML = entry.innerHTML;
      popover.hidden = false;
      popover.setAttribute("aria-hidden", "false");
      positionPopover(link);
      popover.focus();
    }

    document.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a.trait-link") : null;
      if (link) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
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
      function (event) {
        // Scrolling the popover's own (scrollable, overflow-y: auto) content
        // must not dismiss it -- only dismiss on scrolls of the underlying page.
        if (!popover.hidden && !popover.contains(event.target)) hidePopover();
      },
      true,
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();
    initSpellbookTabs();
    initTraitPopover();
  });
})();
