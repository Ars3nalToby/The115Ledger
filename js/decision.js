(function () {
  "use strict";

  var reduced = window.SiteMotion && window.SiteMotion.prefersReducedMotion;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function utcDay(iso) {
    return Date.parse(iso + "T00:00:00Z");
  }

  function fmtDate(iso) {
    return new Date(utcDay(iso)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
  }

  function tween(el, to, dur, delay) {
    if (reduced || to <= 0) {
      el.textContent = String(to);
      return;
    }
    var t0 = null;
    el.textContent = "0";
    function step(ts) {
      if (t0 === null) t0 = ts + delay;
      if (ts < t0) return requestAnimationFrame(step);
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // The banner is described entirely by status.json -> banner, so a new
  // development is a data edit: {date, label, headline, note, link, clock:{start,end,label,ended}}
  function render(slot, b) {
    var now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var clock = "";
    var daysLeft = null;

    if (b.clock) {
      var end = utcDay(b.clock.end);
      var start = utcDay(b.clock.start);
      daysLeft = Math.round((end - today) / 86400000);
      var windowDays = Math.max(1, Math.round((end - start) / 86400000));
      var ratio = Math.min(1, Math.max(0, daysLeft / windowDays));

      if (daysLeft < 0) {
        clock = '<div class="decision-clock"><p class="decision-days-label">' + escapeHtml(b.clock.ended || "") + "</p></div>";
      } else if (daysLeft === 0) {
        clock =
          '<div class="decision-clock"><p class="decision-days-label">The window ends today</p>' +
          '<span class="decision-track" aria-hidden="true"><span class="decision-fill" style="--r:0"></span></span></div>';
      } else {
        clock =
          '<div class="decision-clock">' +
          '<p class="decision-days num" id="decision-days" aria-hidden="true">' + daysLeft + "</p>" +
          '<p class="decision-days-label"><span class="visually-hidden">' + daysLeft + " </span>" + escapeHtml(daysLeft === 1 ? b.clock.label.replace(/^days\b/, "day") : b.clock.label) + "</p>" +
          '<span class="decision-track" aria-hidden="true"><span class="decision-fill" style="--r:' + ratio.toFixed(3) + '"></span></span>' +
          "</div>";
      }
    }

    slot.innerHTML =
      '<section class="decision" aria-label="Latest development in the case">' +
      '<div class="decision-rule" aria-hidden="true"></div>' +
      '<div class="container decision-inner">' +
      '<span class="decision-dot" aria-hidden="true"><i></i></span>' +
      '<div class="decision-text">' +
      '<p class="decision-kicker num">' + escapeHtml(b.label) + " &middot; " + fmtDate(b.date) + "</p>" +
      '<p class="decision-head"><a href="' + escapeHtml(b.link) + '">' + escapeHtml(b.headline) + " &rarr;</a></p>" +
      '<p class="decision-note">' + escapeHtml(b.note) + "</p>" +
      "</div>" + clock + "</div></section>";

    slot.classList.add("is-ready");
    var num = document.getElementById("decision-days");
    if (num && daysLeft > 0) tween(num, daysLeft, 900, 500);
  }

  function init() {
    var slot = document.getElementById("decision-slot");
    if (!slot) return;
    fetch("data/status.json")
      .then(function (r) {
        if (!r.ok) throw new Error("status fetch failed");
        return r.json();
      })
      .then(function (s) {
        if (!s.banner || !s.banner.headline) {
          slot.classList.add("is-empty");
          return;
        }
        render(slot, s.banner);
      })
      .catch(function () {
        slot.classList.add("is-empty");
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
