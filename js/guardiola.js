(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function formatDate(isoDate) {
    var d = new Date(isoDate + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  function renderQuotes(quotes) {
    var el = document.getElementById("quote-grid");
    if (!el) return;

    var sorted = quotes.slice().sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });

    el.innerHTML = sorted
      .map(function (q, i) {
        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 70) : 0;
        return (
          '<div class="quote-card reveal" style="--reveal-delay: ' + delay + 'ms">' +
          '<blockquote class="quote-text">“' + escapeHtml(q.quote) + "”</blockquote>" +
          '<div class="quote-meta">' +
          '<span class="quote-date">' + formatDate(q.date) + "</span>" +
          "<span>" + escapeHtml(q.context) + "</span>" +
          "</div>" +
          '<p class="quote-source">Source: <a href="' + escapeHtml(q.source_url) + '" rel="noopener" target="_blank">' +
          new URL(q.source_url).hostname.replace(/^www\./, "") +
          "</a></p>" +
          "</div>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function renderDeparture(timeline) {
    var el = document.getElementById("departure-events");
    if (!el) return;

    var ids = ["2026-05-guardiola-departs", "2026-06-maresca-appointed"];
    var events = ids
      .map(function (id) {
        return timeline.find(function (item) {
          return item.id === id;
        });
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
      });

    el.innerHTML = events
      .map(function (item, i) {
        var sources = (item.sources || [])
          .map(function (s) {
            return '<a href="' + escapeHtml(s.url) + '" rel="noopener" target="_blank">' + escapeHtml(s.outlet) + "</a>";
          })
          .join(", ");
        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 90) : 0;
        return (
          '<div class="charge-card reveal" style="--reveal-delay: ' + delay + 'ms">' +
          "<h3>" + escapeHtml(item.title) + "</h3>" +
          '<span class="charge-meta">' + formatDate(item.date) + "</span>" +
          "<p>" + escapeHtml(item.summary) + "</p>" +
          '<p class="charge-source">Source: ' + sources + "</p>" +
          "</div>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function showFallback() {
    var msg =
      "Could not load this data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    var quoteGrid = document.getElementById("quote-grid");
    var departure = document.getElementById("departure-events");
    if (quoteGrid) quoteGrid.innerHTML = '<p class="placeholder-panel">' + msg + "</p>";
    if (departure) departure.innerHTML = "";
  }

  function init() {
    Promise.all([fetch("data/quotes.json"), fetch("data/timeline.json")])
      .then(function (responses) {
        if (!responses[0].ok || !responses[1].ok) throw new Error("Failed to fetch data");
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(function (data) {
        renderQuotes(data[0]);
        renderDeparture(data[1]);
      })
      .catch(function () {
        showFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
