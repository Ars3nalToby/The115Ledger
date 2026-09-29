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

  // "Outlet, https://..." possibly several joined with "; "
  function parseInlineSource(str) {
    if (!str) return [];
    return str
      .split(/;\s*/)
      .map(function (part) {
        var m = /^(.*?),\s*(https?:\/\/\S+)$/.exec(part.trim());
        return m ? { label: m[1].trim(), url: m[2].trim() } : null;
      })
      .filter(Boolean);
  }

  // Pulls {label, url} out of trusted, site-authored HTML strings (sponsorships.json, cfg.json).
  function extractLinksFromHtml(html) {
    if (!html) return [];
    var div = document.createElement("div");
    div.innerHTML = html;
    return Array.prototype.slice.call(div.querySelectorAll("a")).map(function (a) {
      return { label: a.textContent.trim(), url: a.getAttribute("href") };
    });
  }

  function addAll(map, entries) {
    entries.forEach(function (e) {
      if (e && e.url && !map.has(e.url)) map.set(e.url, e.label || e.url);
    });
  }

  function renderGroups(groups) {
    var el = document.getElementById("sources-by-page");
    if (!el) return;

    el.innerHTML = groups
      .map(function (group, gi) {
        var entries = Array.from(group.map.entries())
          .map(function (pair) {
            return { url: pair[0], label: pair[1] };
          })
          .sort(function (a, b) {
            return a.label.localeCompare(b.label);
          });

        if (!entries.length) return "";

        var items = entries
          .map(function (e) {
            return '<li><a href="' + escapeHtml(e.url) + '" rel="noopener" target="_blank">' + escapeHtml(e.label) + "</a></li>";
          })
          .join("");

        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(gi, 80) : 0;
        return (
          '<div class="source-group reveal" style="--reveal-delay: ' + delay + 'ms">' +
          "<h3>" + escapeHtml(group.title) + "</h3>" +
          (group.note ? '<p class="chart-note">' + escapeHtml(group.note) + "</p>" : "") +
          "<ul>" + items + "</ul>" +
          "</div>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function renderCorrections(corrections) {
    var el = document.getElementById("corrections-log");
    if (!el) return;

    var sorted = corrections.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    el.innerHTML = sorted
      .map(function (c, i) {
        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 80) : 0;
        return (
          '<li class="reveal" style="--reveal-delay: ' + delay + 'ms">' +
          '<span class="correction-date">' + formatDate(c.date) + "</span>" +
          "<span>" + escapeHtml(c.description) + "</span>" +
          "</li>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function showFallback() {
    var msg =
      "Could not load this data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    var sources = document.getElementById("sources-by-page");
    var log = document.getElementById("corrections-log");
    if (sources) sources.innerHTML = '<p class="placeholder-panel">' + msg + "</p>";
    if (log) log.innerHTML = '<li class="placeholder-panel">' + msg + "</li>";
  }

  function init() {
    var files = [
      "data/timeline.json",
      "data/charges.json",
      "data/sanctions_compare.json",
      "data/transfers.json",
      "data/finance.json",
      "data/sponsorships.json",
      "data/cfg.json",
      "data/quotes.json",
      "data/ornstein.json",
      "data/articles.json",
      "data/corrections.json",
      "data/scale.json"
    ];

    Promise.all(files.map(function (f) { return fetch(f); }))
      .then(function (responses) {
        if (responses.some(function (r) { return !r.ok; })) throw new Error("Failed to fetch data");
        return Promise.all(responses.map(function (r) { return r.json(); }));
      })
      .then(function (data) {
        var timeline = data[0];
        var charges = data[1];
        var sanctionsCompare = data[2];
        var transfers = data[3];
        var finance = data[4];
        var sponsorships = data[5];
        var cfg = data[6];
        var quotes = data[7];
        var ornstein = data[8];
        var articles = data[9];
        var corrections = data[10];
        var scale = data[11];

        var timelineMap = new Map();
        timeline.forEach(function (item) {
          addAll(
            timelineMap,
            (item.sources || []).map(function (s) {
              return { label: s.outlet, url: s.url };
            })
          );
        });

        var chargesMap = new Map();
        charges.forEach(function (c) {
          addAll(chargesMap, parseInlineSource(c.source));
        });
        sanctionsCompare.forEach(function (s) {
          addAll(chargesMap, [{ label: s.club + " sanction (" + s.date + ")", url: s.source_url }]);
        });

        var spendingMap = new Map();
        transfers.forEach(function (t) {
          addAll(spendingMap, [{ label: t.player + " transfer", url: t.source_url }]);
          if (t.controversy_source) {
            addAll(spendingMap, [{ label: t.player + " (controversy)", url: t.controversy_source }]);
          }
        });

        var moneyMap = new Map();
        finance.forEach(function (f) {
          addAll(moneyMap, [{ label: f.season + " accounts", url: f.source_url }]);
        });
        sponsorships.forEach(function (s) {
          addAll(moneyMap, extractLinksFromHtml(s.reported_value_html));
          addAll(moneyMap, extractLinksFromHtml(s.allegation_html));
        });
        (cfg.ownership_breakdown || []).forEach(function (o) {
          addAll(moneyMap, [{ label: o.source, url: o.source_url }]);
        });
        addAll(moneyMap, [{ label: cfg.clubs_source, url: cfg.clubs_source_url }]);

        (scale.references || []).forEach(function (r) {
          addAll(moneyMap, (r.sources || []).map(function (src) { return { label: r.label + " cost / price: " + src.outlet, url: src.url }; }));
        });
        (scale.revenue_mix || []).forEach(function (r) {
          addAll(moneyMap, (r.sources || []).map(function (src) { return { label: r.club + " " + r.season + " revenue mix: " + src.outlet, url: src.url }; }));
        });
        var ctx = scale.context || {};
        Object.keys(ctx).forEach(function (k) {
          addAll(moneyMap, (ctx[k].sources || []).map(function (src) { return { label: src.outlet, url: src.url }; }));
        });

        var guardiolaMap = new Map();
        quotes.forEach(function (q) {
          addAll(guardiolaMap, [{ label: "Guardiola, " + q.date, url: q.source_url }]);
        });

        var reportingMap = new Map();
        ornstein.forEach(function (t) {
          addAll(reportingMap, [{ label: "Ornstein on X, " + t.date, url: t.tweet_url }]);
        });
        articles.forEach(function (a) {
          addAll(reportingMap, [{ label: a.title, url: a.url }]);
        });

        renderGroups([
          { title: "Home & Timeline", map: timelineMap },
          { title: "The Charges", map: chargesMap },
          { title: "The Spending", map: spendingMap },
          {
            title: "The Money",
            map: moneyMap,
            note: "UEFA FFP history sources are listed under Home & Timeline, since that page reuses the same timeline entries."
          },
          {
            title: "Guardiola",
            map: guardiolaMap,
            note: "His departure and Enzo Maresca's appointment are sourced under Home & Timeline."
          },
          { title: "The Reporting", map: reportingMap }
        ]);

        renderCorrections(corrections);
      })
      .catch(function () {
        showFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
