(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function sourceLinkHtml(source) {
    var match = /^(.*?),\s*(https?:\/\/\S+)/.exec(source);
    if (match) {
      return '<a href="' + escapeHtml(match[2]) + '" rel="noopener" target="_blank">' + escapeHtml(match[1]) + "</a>";
    }
    return escapeHtml(source);
  }

  function renderChargesChart(charges) {
    var body = document.getElementById("charges-chart-body");
    var explanations = document.getElementById("charges-explanations");
    if (!body || !explanations) return;

    var sorted = charges.slice().sort(function (a, b) {
      return b.count - a.count;
    });
    var max = sorted.reduce(function (m, c) {
      return Math.max(m, c.count);
    }, 0);
    var total = charges.reduce(function (sum, c) {
      return sum + c.count;
    }, 0);

    body.innerHTML = sorted
      .map(function (c) {
        var pct = max ? Math.round((c.count / max) * 100) : 0;
        return (
          "<tr>" +
          '<th scope="row">' + escapeHtml(c.category) + "</th>" +
          '<td><div class="bar-cell" title="' + c.count + " of " + total + ' charges">' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="bar-value">' + c.count + "</span>" +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    explanations.innerHTML = sorted
      .map(function (c) {
        return (
          '<div class="charge-card">' +
          "<h3>" + escapeHtml(c.category) + "</h3>" +
          '<span class="charge-meta">' + c.count + " of " + total + " charges &middot; Seasons: " + escapeHtml(c.seasons) + "</span>" +
          "<p>" + escapeHtml(c.explanation) + "</p>" +
          '<p class="charge-source">Source: ' + sourceLinkHtml(c.source) + "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderSanctionsTable(rows) {
    var body = document.getElementById("sanctions-table-body");
    if (!body) return;

    body.innerHTML = rows
      .map(function (r) {
        return (
          "<tr>" +
          "<td>" + escapeHtml(r.club) + "</td>" +
          "<td>" + escapeHtml(r.season) + "</td>" +
          "<td>" + escapeHtml(r.breach) + "</td>" +
          "<td>" + escapeHtml(r.sanction) + "</td>" +
          "<td>" + escapeHtml(r.date) + "</td>" +
          '<td><a href="' + escapeHtml(r.source_url) + '" rel="noopener" target="_blank">Source</a></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  function showFallback() {
    var chartBody = document.getElementById("charges-chart-body");
    var explanations = document.getElementById("charges-explanations");
    var sanctionsBody = document.getElementById("sanctions-table-body");
    var msg =
      "Could not load data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    if (chartBody) chartBody.innerHTML = '<tr><td colspan="2">' + msg + "</td></tr>";
    if (explanations) explanations.innerHTML = "";
    if (sanctionsBody) sanctionsBody.innerHTML = '<tr><td colspan="6">' + msg + "</td></tr>";
  }

  function init() {
    Promise.all([fetch("data/charges.json"), fetch("data/sanctions_compare.json")])
      .then(function (responses) {
        if (!responses[0].ok || !responses[1].ok) throw new Error("Failed to fetch data");
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(function (data) {
        renderChargesChart(data[0]);
        renderSanctionsTable(data[1]);
      })
      .catch(function () {
        showFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
