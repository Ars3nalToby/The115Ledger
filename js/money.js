(function () {
  "use strict";

  var escapeHtml = Charts.escapeHtml;
  var formatGBP = Charts.formatGBP;

  function renderRevenue(finance) {
    var seasons = finance.map(function (f) { return f.season; });
    var values = finance.map(function (f) { return f.revenue_gbp; });
    var el = document.getElementById("chart-revenue");
    if (el) Charts.buildLineChart(el, seasons, values);

    var body = document.getElementById("revenue-table-body");
    if (body) {
      body.innerHTML = finance
        .map(function (f) {
          return (
            "<tr><td>" + escapeHtml(f.season) + '</td><td class="num">' + formatGBP(f.revenue_gbp) + '</td><td><a href="' +
            escapeHtml(f.source_url) + '" rel="noopener" target="_blank">Source</a></td></tr>'
          );
        })
        .join("");
    }
  }

  function renderSplit(finance) {
    var withSplit = finance.filter(function (f) {
      return f.matchday != null && f.broadcast != null && f.commercial != null;
    });
    var seasons = withSplit.map(function (f) { return f.season; });
    var seriesDefs = [
      { key: "matchday", label: "Matchday" },
      { key: "broadcast", label: "Broadcast" },
      { key: "commercial", label: "Commercial" }
    ];
    var el = document.getElementById("chart-split");
    if (el) Charts.buildStackedBarChart(el, seasons, withSplit, seriesDefs);

    var body = document.getElementById("split-table-body");
    if (body) {
      body.innerHTML = withSplit
        .map(function (f) {
          return (
            "<tr><td>" + escapeHtml(f.season) + '</td><td class="num">' + formatGBP(f.matchday) + '</td><td class="num">' +
            formatGBP(f.broadcast) + '</td><td class="num">' + formatGBP(f.commercial) + "</td></tr>"
          );
        })
        .join("");
    }
  }

  function renderWages(finance) {
    var seasons = finance.map(function (f) { return f.season; });
    var values = finance.map(function (f) { return f.wages != null ? f.wages : null; });
    var el = document.getElementById("chart-wages");
    if (el) Charts.buildBarChart(el, seasons, values);

    var body = document.getElementById("wages-table-body");
    if (body) {
      body.innerHTML = finance
        .map(function (f) {
          return "<tr><td>" + escapeHtml(f.season) + '</td><td class="num">' + formatGBP(f.wages) + "</td></tr>";
        })
        .join("");
    }
  }

  function renderProfit(finance) {
    var seasons = finance.map(function (f) { return f.season; });
    var values = finance.map(function (f) { return f.pretax_profit; });
    var el = document.getElementById("chart-profit");
    if (el) Charts.buildDivergingBarChart(el, seasons, values);

    var body = document.getElementById("profit-table-body");
    if (body) {
      body.innerHTML = finance
        .map(function (f) {
          return (
            "<tr><td>" + escapeHtml(f.season) + '</td><td class="num">' + formatGBP(f.pretax_profit) + '</td><td><a href="' +
            escapeHtml(f.source_url) + '" rel="noopener" target="_blank">Source</a></td></tr>'
          );
        })
        .join("");
    }
  }

  function renderUefaHistory(timeline) {
    var el = document.getElementById("uefa-history");
    if (!el) return;
    var uefaEvents = timeline
      .filter(function (item) { return item.category === "UEFA"; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

    el.innerHTML = uefaEvents
      .map(function (item, i) {
        var sources = (item.sources || [])
          .map(function (s) {
            return '<a href="' + escapeHtml(s.url) + '" rel="noopener" target="_blank">' + escapeHtml(s.outlet) + "</a>";
          })
          .join(", ");
        var response = item.club_response
          ? '<blockquote class="timeline-response">' + escapeHtml(item.club_response) + "</blockquote>"
          : "";
        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 70) : 0;
        return (
          '<div class="charge-card reveal" style="--reveal-delay: ' + delay + 'ms">' +
          "<h3>" + escapeHtml(item.title) + "</h3>" +
          '<span class="charge-meta">' + escapeHtml(item.date) + "</span>" +
          "<p>" + escapeHtml(item.summary) + "</p>" +
          response +
          '<p class="charge-source">Source: ' + sources + "</p>" +
          "</div>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  // These *_html fields are authored by us (data/sponsorships.json, data/cfg.json),
  // not user input, so they carry trusted inline markup (links) and are not escaped.
  function renderSponsorships(sponsorships) {
    var el = document.getElementById("sponsorship-list");
    if (!el) return;
    el.innerHTML = sponsorships
      .map(function (s, i) {
        var allegation = s.allegation_html
          ? '<div class="sponsorship-allegation"><strong>Allegation:</strong> ' + s.allegation_html + "</div>"
          : "";
        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 90) : 0;
        return (
          '<div class="sponsorship-card reveal" style="--reveal-delay: ' + delay + 'ms">' +
          "<h3>" + escapeHtml(s.sponsor) + "</h3>" +
          '<span class="sponsorship-meta">' + escapeHtml(s.covers) + " &middot; " + escapeHtml(s.signed) + "</span>" +
          "<p>" + s.reported_value_html + "</p>" +
          allegation +
          "</div>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function renderCfg(cfg) {
    var el = document.getElementById("cfg-structure");
    if (!el) return;

    var ownershipRows = (cfg.ownership_breakdown || [])
      .map(function (o) {
        return (
          "<tr><td>" + escapeHtml(o.holder) + '</td><td class="num">' + escapeHtml(o.pct) + '</td><td><a href="' +
          escapeHtml(o.source_url) + '" rel="noopener" target="_blank">' + escapeHtml(o.source) + "</a></td></tr>"
        );
      })
      .join("");

    var clubsHtml = (cfg.clubs || [])
      .map(function (c) {
        var note = c.note ? " <em>(" + escapeHtml(c.note) + ")</em>" : "";
        return "<li>" + escapeHtml(c.name) + " — " + escapeHtml(c.country) + ", " + escapeHtml(c.stake) + note + "</li>";
      })
      .join("");

    el.innerHTML =
      '<div class="reveal">' +
      "<p>" + cfg.summary_html + "</p>" +
      '<div class="table-scroll"><table class="data-table"><thead><tr><th scope="col">Holder</th><th scope="col">Stake</th><th scope="col">Source</th></tr></thead><tbody>' +
      ownershipRows +
      "</tbody></table></div>" +
      "<h3>Member and partner clubs</h3>" +
      '<ul class="cfg-list">' + clubsHtml + "</ul>" +
      '<p class="charge-source">Source: <a href="' + escapeHtml(cfg.clubs_source_url) + '" rel="noopener" target="_blank">' +
      escapeHtml(cfg.clubs_source) + "</a></p>" +
      "</div>";

    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function showFallback(ids) {
    var msg =
      "Could not load this data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="placeholder-panel">' + msg + "</p>";
    });
  }

  function init() {
    Promise.all([fetch("data/finance.json"), fetch("data/timeline.json")])
      .then(function (responses) {
        if (!responses[0].ok || !responses[1].ok) throw new Error("Failed to fetch core data");
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(function (data) {
        var finance = data[0];
        var timeline = data[1];
        renderRevenue(finance);
        renderSplit(finance);
        renderWages(finance);
        renderProfit(finance);
        renderUefaHistory(timeline);
      })
      .catch(function () {
        showFallback([
          "chart-revenue",
          "chart-split",
          "chart-wages",
          "chart-profit",
          "uefa-history"
        ]);
      });

    Promise.all([fetch("data/sponsorships.json"), fetch("data/cfg.json")])
      .then(function (responses) {
        if (!responses[0].ok || !responses[1].ok) throw new Error("Failed to fetch sponsorship/CFG data");
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(function (data) {
        renderSponsorships(data[0]);
        renderCfg(data[1]);
      })
      .catch(function () {
        showFallback(["sponsorship-list", "cfg-structure"]);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
