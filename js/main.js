(function () {
  "use strict";

  var THEME_KEY = "theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function initThemeToggle() {
    var toggle = document.getElementById("theme-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* localStorage unavailable; theme just won't persist */
      }
    });
  }

  function initNavToggle() {
    var navToggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!navToggle || !nav) return;

    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function markCurrentPage() {
    var links = document.querySelectorAll(".site-nav a");
    var here = window.location.pathname.split("/").pop() || "index.html";
    links.forEach(function (link) {
      var target = link.getAttribute("href");
      if (target === here) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initNavToggle();
    markCurrentPage();
    if (window.SiteMotion) window.SiteMotion.observeReveal();
  });
})();

// Shared scroll-reveal utility for every page's dynamically-rendered
// content. Progressive enhancement only: elements are only hidden by CSS
// when JS runs AND the visitor hasn't asked for reduced motion (see the
// `.reveal` rule in css/style.css), so nothing depends on this running.
window.SiteMotion = (function () {
  "use strict";

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var observer = null;

  function getObserver() {
    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
      );
    }
    return observer;
  }

  // Marks .reveal elements within `root` (or the whole document) so they
  // fade/slide into view as the visitor scrolls to them. Call this again
  // after replacing a container's innerHTML with new .reveal elements.
  function observeReveal(root) {
    var scope = root || document;
    var els = scope.querySelectorAll ? scope.querySelectorAll(".reveal:not(.is-visible)") : [];
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var obs = getObserver();
    els.forEach(function (el) {
      obs.observe(el);
    });
  }

  // A short, capped stagger delay (ms) for the Nth item in a freshly
  // rendered list, so cards cascade in rather than popping in together.
  function staggerDelay(index, stepMs, maxMs) {
    return Math.min(index * (stepMs || 60), maxMs || 360);
  }

  return {
    prefersReducedMotion: prefersReducedMotion,
    observeReveal: observeReveal,
    staggerDelay: staggerDelay
  };
})();
