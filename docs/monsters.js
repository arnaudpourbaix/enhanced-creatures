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

  document.addEventListener("DOMContentLoaded", function () {
    initSidebarToggle();
    initSpellbookTabs();
  });
})();
