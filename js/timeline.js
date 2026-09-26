(function () {
  "use strict";

  var CATEGORIES = [
    "Ownership",
    "Transfers",
    "Revenue/Finance",
    "UEFA",
    "Premier League case",
    "Guardiola",
    "Media reports"
  ];

  var CATEGORY_EMPTY_HINT = {
    "Transfers": 'No major-event entries in this category yet — see <a href="spending.html">The Spending</a> for every signing.',
    "Revenue/Finance": 'No major-event entries in this category yet — see <a href="money.html">The Money</a> for season-by-season figures.'
  };

  var STATUS_BADGE = {
    "CHARGED / ALLEGED": { cls: "status-pending", icon: "clock" },
    "ALLEGED": { cls: "status-pending", icon: "clock" },
    "FOUND (reported)": { cls: "status-reported", icon: "alert" },
    "FOUND (published decision)": { cls: "status-critical", icon: "alert" },
    "SANCTION PENDING": { cls: "status-pending", icon: "clock" },
    "UNDER APPEAL": { cls: "status-appeal", icon: "flag" },
    "FINAL": { cls: "status-final", icon: "check" }
  };

  var ICONS = {
    clock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
    alert:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    flag:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path></svg>'
  };

  var activeFilters = new Set();
  var allEntries = [];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function formatDate(isoDate) {
    var d = new Date(isoDate + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  function statusBadgeHtml(statusTag) {
    var meta = STATUS_BADGE[statusTag] || { cls: "status-pending", icon: "clock" };
    return (
      '<span class="status-badge status-badge--sm ' +
      meta.cls +
      '">' +
      (ICONS[meta.icon] || "") +
      "<span>" +
      escapeHtml(statusTag) +
      "</span></span>"
    );
  }

  function sourcesHtml(sources) {
    if (!sources || !sources.length) return "";
    var items = sources
      .map(function (s) {
        return (
          '<li><a href="' +
          escapeHtml(s.url) +
          '" rel="noopener" target="_blank">' +
          escapeHtml(s.outlet) +
          (s.date ? " (" + escapeHtml(s.date) + ")" : "") +
          "</a></li>"
        );
      })
      .join("");
    return '<ul class="timeline-sources">' + items + "</ul>";
  }

  function clubResponseHtml(clubResponse) {
    if (!clubResponse) return "";
    return '<blockquote class="timeline-response">' + escapeHtml(clubResponse) + "</blockquote>";
  }

  function entryHtml(item) {
    return (
      '<div class="timeline-card">' +
      '<time class="timeline-date" datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + "</time>" +
      '<div class="timeline-header">' +
      '<span class="latest-category">' + escapeHtml(item.category) + "</span>" +
      statusBadgeHtml(item.status_tag) +
      "</div>" +
      '<h3 class="timeline-title">' + escapeHtml(item.title) + "</h3>" +
      '<p class="timeline-summary">' + escapeHtml(item.summary) + "</p>" +
      clubResponseHtml(item.club_response) +
      sourcesHtml(item.sources) +
      "</div>"
    );
  }

  function renderFilters() {
    var container = document.getElementById("timeline-filters");
    if (!container) return;

    var counts = {};
    allEntries.forEach(function (item) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    var html = '<button type="button" class="filter-chip is-active" data-filter="all">All (' + allEntries.length + ")</button>";
    html += CATEGORIES.map(function (cat) {
      return (
        '<button type="button" class="filter-chip" data-filter="' +
        escapeHtml(cat) +
        '">' +
        escapeHtml(cat) +
        " (" + (counts[cat] || 0) + ")</button>"
      );
    }).join("");
    container.innerHTML = html;

    container.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-chip");
      if (!btn) return;
      var filter = btn.getAttribute("data-filter");

      if (filter === "all") {
        activeFilters.clear();
      } else if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
      } else {
        activeFilters.add(filter);
      }

      updateFilterButtons();
      renderList();
    });
  }

  function updateFilterButtons() {
    var buttons = document.querySelectorAll("#timeline-filters .filter-chip");
    buttons.forEach(function (btn) {
      var filter = btn.getAttribute("data-filter");
      var isActive = filter === "all" ? activeFilters.size === 0 : activeFilters.has(filter);
      btn.classList.toggle("is-active", isActive);
    });
  }

  function renderList() {
    var container = document.getElementById("timeline-list");
    if (!container) return;

    var filtered =
      activeFilters.size === 0
        ? allEntries
        : allEntries.filter(function (item) {
            return activeFilters.has(item.category);
          });

    if (!filtered.length) {
      var hints = Array.from(activeFilters)
        .map(function (cat) {
          return CATEGORY_EMPTY_HINT[cat];
        })
        .filter(Boolean);
      container.innerHTML =
        '<li class="timeline-empty">No timeline entries match the selected filter' +
        (activeFilters.size > 1 ? "s" : "") +
        "." +
        (hints.length ? " " + hints.join(" ") : "") +
        "</li>";
      return;
    }

    container.innerHTML = filtered
      .map(function (item) {
        return '<li class="timeline-entry" id="' + escapeHtml(item.id) + '">' + entryHtml(item) + "</li>";
      })
      .join("");
  }

  function scrollToHash() {
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function showFallback() {
    var container = document.getElementById("timeline-list");
    if (container) {
      container.innerHTML =
        '<li class="placeholder-panel">Could not load the timeline data. If you\'re viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.</li>';
    }
  }

  function init() {
    fetch("data/timeline.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to fetch timeline data");
        return res.json();
      })
      .then(function (data) {
        allEntries = data.slice().sort(function (a, b) {
          return new Date(a.date) - new Date(b.date);
        });
        renderFilters();
        renderList();
        scrollToHash();
      })
      .catch(function () {
        showFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
