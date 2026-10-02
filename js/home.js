(function () {
  "use strict";

  var STATUS_META = {
    "SANCTION PENDING": { cls: "status-pending", icon: "clock", label: "Sanction: Pending" },
    "SANCTIONED": { cls: "status-critical", icon: "alert", label: "Sanctioned" },
    "UNDER APPEAL": { cls: "status-appeal", icon: "flag", label: "Under appeal" },
    "FINAL": { cls: "status-final", icon: "check", label: "Final" }
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

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function daysSince(isoDate) {
    var start = new Date(isoDate + "T00:00:00Z");
    var now = new Date();
    var diffMs = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / 86400000));
  }

  function formatNumber(n) {
    return n.toLocaleString("en-GB");
  }

  function formatDate(isoDate) {
    var d = new Date(isoDate + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  function animateCount(el, target, duration) {
    if (!el) return;
    if ((window.SiteMotion && window.SiteMotion.prefersReducedMotion) || target <= 0) {
      el.textContent = formatNumber(target);
      return;
    }
    var startTime = null;
    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = formatNumber(Math.round(eased * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target);
      }
    }
    window.requestAnimationFrame(step);
  }

  function renderClock(status, animate) {
    var chargesEl = document.getElementById("stat-charges-days");
    var verdictEl = document.getElementById("stat-verdict-days");
    if (chargesEl && status.charges_date) {
      var chargesDays = daysSince(status.charges_date);
      if (animate) animateCount(chargesEl, chargesDays, 1400);
      else chargesEl.textContent = formatNumber(chargesDays);
    }
    if (verdictEl && status.verdict_reported_date) {
      var verdictDays = daysSince(status.verdict_reported_date);
      if (animate) animateCount(verdictEl, verdictDays, 1000);
      else verdictEl.textContent = formatNumber(verdictDays);
    }
  }

  function renderStatusBadge(status) {
    var el = document.getElementById("status-badge");
    if (!el) return;
    var meta = STATUS_META[status.sanction_status] || {
      cls: "status-pending",
      icon: "clock",
      label: status.sanction_status || "Unknown"
    };
    el.className = "status-badge " + meta.cls;
    el.innerHTML = (ICONS[meta.icon] || "") + "<span>" + escapeHtml(meta.label) + "</span>";

    // Sanction and appeal are tracked separately, so each gets its own badge.
    var appeal = STATUS_META[status.appeal_status];
    if (appeal && !document.getElementById("appeal-badge")) {
      var row = document.createElement("div");
      row.className = "status-row";
      el.parentNode.insertBefore(row, el);
      row.appendChild(el);
      var ab = document.createElement("div");
      ab.id = "appeal-badge";
      ab.className = "status-badge " + appeal.cls;
      ab.innerHTML = (ICONS[appeal.icon] || "") + "<span>" + escapeHtml(appeal.label) + "</span>";
      row.appendChild(ab);
    }
  }

  function renderLatest(timeline) {
    var container = document.getElementById("latest-list");
    if (!container) return;

    var sorted = timeline.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    var latest = sorted.slice(0, 5);

    container.innerHTML = "";
    latest.forEach(function (item, i) {
      var li = document.createElement("li");
      li.className = "latest-item reveal";
      if (window.SiteMotion) li.style.setProperty("--reveal-delay", window.SiteMotion.staggerDelay(i, 70) + "ms");
      li.innerHTML =
        '<span class="latest-category">' + escapeHtml(item.category) + "</span>" +
        '<a class="latest-title" href="timeline.html#' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + "</a>" +
        '<time class="latest-date" datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + "</time>" +
        '<p class="latest-summary">' + escapeHtml(item.summary) + "</p>";
      container.appendChild(li);
    });

    if (window.SiteMotion) window.SiteMotion.observeReveal(container);
  }

  function showFallback() {
    var badge = document.getElementById("status-badge");
    if (badge) {
      badge.className = "status-badge status-pending";
      badge.innerHTML = "<span>Case status unavailable — could not load data/status.json</span>";
    }
    var latest = document.getElementById("latest-list");
    if (latest) {
      latest.innerHTML =
        '<li class="placeholder-panel">Could not load the timeline data. If you\'re viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.</li>';
    }
  }

  function init() {
    Promise.all([fetch("data/status.json"), fetch("data/timeline.json")])
      .then(function (responses) {
        if (!responses[0].ok || !responses[1].ok) {
          throw new Error("Failed to fetch case data");
        }
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(function (data) {
        var status = data[0];
        var timeline = data[1];
        renderClock(status, true);
        renderStatusBadge(status);
        renderLatest(timeline);

        window.setInterval(function () {
          renderClock(status, false);
        }, 60 * 60 * 1000);
      })
      .catch(function () {
        showFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
