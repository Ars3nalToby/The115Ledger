(function () {
  "use strict";

  var escapeHtml = Charts.escapeHtml;

  var state = {
    transfers: [],
    sortKey: "date",
    sortDir: "ascending"
  };

  function formatFeeM(n, symbol) {
    if (n === null || n === undefined) return null;
    var val = Number.isInteger(n) ? String(n) : n.toFixed(1);
    return symbol + val + "m";
  }

  function formatDate(isoDate) {
    var d = new Date(isoDate + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  function seasonForDate(isoDate) {
    var d = new Date(isoDate + "T00:00:00Z");
    var year = d.getUTCFullYear();
    var month = d.getUTCMonth(); // 0-indexed; treat May onward as the start of the next season
    var startYear = month >= 4 ? year : year - 1;
    return startYear + "-" + String((startYear + 1) % 100).padStart(2, "0");
  }

  function seasonStartYear(season) {
    return parseInt(season.slice(0, 4), 10);
  }

  function sortTransfers(list, key, dir) {
    var mult = dir === "ascending" ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var av = a[key];
      var bv = b[key];
      if (key === "date") {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      } else if (key === "fee_gbp") {
        av = av === null || av === undefined ? -Infinity : av;
        bv = bv === null || bv === undefined ? -Infinity : bv;
      } else {
        av = String(av || "").toLowerCase();
        bv = String(bv || "").toLowerCase();
      }
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    });
  }

  function renderTable() {
    var body = document.getElementById("transfers-table-body");
    if (!body) return;

    var sorted = sortTransfers(state.transfers, state.sortKey, state.sortDir);

    body.innerHTML = sorted
      .map(function (t, i) {
        var fee = formatFeeM(t.fee_gbp, "£");
        var feeEur = formatFeeM(t.fee_eur, "€");
        var feeCell = fee ? fee + (feeEur ? " / " + feeEur : "") : "n/r";

        var controversyCell = t.controversy_note
          ? escapeHtml(t.controversy_note) +
            (t.controversy_source
              ? ' <a href="' + escapeHtml(t.controversy_source) + '" rel="noopener" target="_blank">(source)</a>'
              : "")
          : "—";

        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 20, 300) : 0;
        return (
          '<tr class="reveal" style="--reveal-delay: ' + delay + 'ms">' +
          "<td>" + escapeHtml(t.player) + "</td>" +
          '<td class="num">' + formatDate(t.date) + "</td>" +
          "<td>" + escapeHtml(t.from_club) + "</td>" +
          '<td class="num">' + feeCell + "</td>" +
          '<td><a href="' + escapeHtml(t.source_url) + '" rel="noopener" target="_blank">Source</a></td>' +
          "<td>" + controversyCell + "</td>" +
          "</tr>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(body);

    document.querySelectorAll("#transfers-table th[data-sort]").forEach(function (th) {
      var key = th.getAttribute("data-sort");
      if (key === state.sortKey) {
        th.setAttribute("aria-sort", state.sortDir);
      } else {
        th.removeAttribute("aria-sort");
      }
    });
  }

  function initSorting() {
    var headers = document.querySelectorAll("#transfers-table th[data-sort]");
    headers.forEach(function (th) {
      function activate() {
        var key = th.getAttribute("data-sort");
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === "ascending" ? "descending" : "ascending";
        } else {
          state.sortKey = key;
          state.sortDir = "ascending";
        }
        renderTable();
      }
      th.addEventListener("click", activate);
      th.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  function renderCumulativeChart(transfers) {
    var el = document.getElementById("chart-cumulative");
    if (!el) return;

    var bySeasonRaw = {};
    transfers.forEach(function (t) {
      if (t.fee_gbp === null || t.fee_gbp === undefined) return;
      var season = seasonForDate(t.date);
      bySeasonRaw[season] = (bySeasonRaw[season] || 0) + t.fee_gbp * 1e6;
    });

    var years = Object.keys(bySeasonRaw).map(seasonStartYear);
    var minYear = Math.min.apply(null, years);
    var maxYear = Math.max.apply(null, years);

    var seasons = [];
    for (var y = minYear; y <= maxYear; y++) {
      seasons.push(y + "-" + String((y + 1) % 100).padStart(2, "0"));
    }

    var cumulative = [];
    var running = 0;
    seasons.forEach(function (s) {
      running += bySeasonRaw[s] || 0;
      cumulative.push(running);
    });

    Charts.buildLineChart(el, seasons, cumulative, { label: "Cumulative fees (named signings)" });
  }

  function showFallback() {
    var body = document.getElementById("transfers-table-body");
    var msg =
      "Could not load the transfer data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    if (body) body.innerHTML = '<tr><td colspan="6">' + msg + "</td></tr>";
    var chart = document.getElementById("chart-cumulative");
    if (chart) chart.innerHTML = '<p class="placeholder-panel">' + msg + "</p>";
  }

  function init() {
    fetch("data/transfers.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to fetch transfers data");
        return res.json();
      })
      .then(function (data) {
        state.transfers = data;
        renderCumulativeChart(data);
        initSorting();
        renderTable();
      })
      .catch(function () {
        showFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
