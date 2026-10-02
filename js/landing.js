(function () {
  "use strict";

  var escapeHtml = Charts.escapeHtml;

  var EXPLORE_ITEMS = [
    {
      href: "timeline.html",
      icon: "calendar",
      title: "Timeline",
      desc: "2008 to today, filterable by ownership, transfers, UEFA, the Premier League case, Guardiola and media reports."
    },
    {
      href: "charges.html",
      icon: "bars",
      title: "The 115 Charges",
      desc: "Every charge category, the sanction range under Rule W.51, and how other clubs' PSR cases compare."
    },
    {
      href: "spending.html",
      icon: "trend",
      title: "The Spending",
      desc: "Every major signing since 2008: fee, source, and cumulative net spend by season."
    },
    {
      href: "money.html",
      icon: "pie",
      title: "The Money",
      desc: "Revenue, wages and profit/loss by season, sponsorship deals, the CFG structure, and UEFA's FFP history."
    },
    {
      href: "guardiola.html",
      icon: "quote",
      title: "Guardiola",
      desc: "What he said, when — from the February 2023 charges through his May 2026 departure."
    },
    {
      href: "reporting.html",
      icon: "feed",
      title: "The Reporting",
      desc: "David Ornstein's reporting on the case, plus the key journalism that shaped it."
    },
    {
      href: "sources.html",
      icon: "book",
      title: "Sources & Methodology",
      desc: "Every source on this site, grouped by page, and how the status labels are decided."
    }
  ];

  var ICONS = {
    calendar:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    bars:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    trend:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    pie:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>',
    quote:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    feed:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>',
    book:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'
  };

  function daysSince(isoDate) {
    var start = new Date(isoDate + "T00:00:00Z");
    var now = new Date();
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
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
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(Math.round(eased * target));
      if (progress < 1) window.requestAnimationFrame(step);
      else el.textContent = formatNumber(target);
    }
    window.requestAnimationFrame(step);
  }

  function renderClock(status) {
    var chargesEl = document.getElementById("landing-stat-charges");
    var verdictEl = document.getElementById("landing-stat-verdict");
    if (chargesEl && status.charges_date) animateCount(chargesEl, daysSince(status.charges_date), 1400);
    if (verdictEl && status.verdict_reported_date) animateCount(verdictEl, daysSince(status.verdict_reported_date), 1000);
  }

  function renderFacts(charges, transfers, finance) {
    var wrap = document.getElementById("fact-strip");
    if (!wrap) return;

    var totalCharges = charges.reduce(function (sum, c) { return sum + c.count; }, 0);
    var totalSpendM = transfers.reduce(function (sum, t) { return sum + (t.fee_gbp || 0); }, 0);
    var latestFinance = finance[finance.length - 1];

    var facts = [
      totalCharges + " alleged breaches referred to an independent commission, Feb 2023",
      "£" + Math.round(totalSpendM) + "m+ in transfer fees recorded in this ledger since 2008",
      latestFinance ? Charts.formatGBP(latestFinance.revenue_gbp) + " revenue, season " + latestFinance.season : null,
      "Hearing opened 16 Sept 2024 in London",
      "City lodged an appeal on 1 Oct 2026; hearing expected within 12 weeks; sanction still to be decided (as reported)"
    ].filter(Boolean);

    var chipsHtml = facts
      .map(function (f) {
        return '<span class="fact-chip" role="listitem">' + escapeHtml(f) + "</span>";
      })
      .join("");

    // Duplicated once for a seamless CSS marquee loop; reduced-motion users
    // get the single, static, wrapped set via the CSS override.
    wrap.innerHTML = chipsHtml + chipsHtml;
  }

  function renderChartTeaser(finance) {
    var el = document.getElementById("landing-chart-revenue");
    if (!el) return;
    var seasons = finance.map(function (f) { return f.season; });
    var values = finance.map(function (f) { return f.revenue_gbp; });
    Charts.buildLineChart(el, seasons, values);
  }

  function renderExplore() {
    var el = document.getElementById("explore-grid");
    if (!el) return;
    el.innerHTML = EXPLORE_ITEMS.map(function (item, i) {
      var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 70) : 0;
      return (
        '<a class="explore-card reveal" style="--reveal-delay: ' + delay + 'ms" href="' + item.href + '">' +
        '<span class="explore-icon">' + (ICONS[item.icon] || "") + "</span>" +
        "<h3>" + escapeHtml(item.title) + "</h3>" +
        "<p>" + escapeHtml(item.desc) + "</p>" +
        "</a>"
      );
    }).join("");
    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function renderQuotePreview(quotes, ornstein) {
    var el = document.getElementById("quote-preview-grid");
    if (!el) return;

    var latestQuote = quotes.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); })[0];
    var latestTweet = ornstein.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); })[0];

    var cards = [];
    if (latestQuote) {
      cards.push(
        '<div class="quote-preview-card reveal">' +
        '<blockquote>&ldquo;' + escapeHtml(latestQuote.quote) + "&rdquo;</blockquote>" +
        '<p class="quote-preview-meta">' + escapeHtml(latestQuote.speaker) + " &middot; " + formatDate(latestQuote.date) + "</p>" +
        '<a href="guardiola.html">Read every Guardiola quote &rarr;</a>' +
        "</div>"
      );
    }
    if (latestTweet) {
      cards.push(
        '<div class="quote-preview-card reveal" style="--reveal-delay: 90ms">' +
        '<blockquote>&ldquo;' + escapeHtml(latestTweet.summary) + "&rdquo;</blockquote>" +
        '<p class="quote-preview-meta">David Ornstein, The Athletic &middot; ' + formatDate(latestTweet.date) + "</p>" +
        '<a href="reporting.html">See the reporting &rarr;</a>' +
        "</div>"
      );
    }
    el.innerHTML = cards.join("");
    if (window.SiteMotion) window.SiteMotion.observeReveal(el);
  }

  function showFallback() {
    var msg =
      "Could not load live data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    ["fact-strip", "landing-chart-revenue", "explore-grid", "quote-preview-grid"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="placeholder-panel">' + msg + "</p>";
    });
    var chargesEl = document.getElementById("landing-stat-charges");
    var verdictEl = document.getElementById("landing-stat-verdict");
    if (chargesEl) chargesEl.textContent = "—";
    if (verdictEl) verdictEl.textContent = "—";
  }

  function init() {
    Promise.all([
      fetch("data/status.json"),
      fetch("data/charges.json"),
      fetch("data/transfers.json"),
      fetch("data/finance.json"),
      fetch("data/quotes.json"),
      fetch("data/ornstein.json")
    ])
      .then(function (responses) {
        if (responses.some(function (r) { return !r.ok; })) throw new Error("Failed to fetch data");
        return Promise.all(responses.map(function (r) { return r.json(); }));
      })
      .then(function (data) {
        var status = data[0];
        var charges = data[1];
        var transfers = data[2];
        var finance = data[3];
        var quotes = data[4];
        var ornstein = data[5];

        renderClock(status);
        renderFacts(charges, transfers, finance);
        renderChartTeaser(finance);
        renderExplore();
        renderQuotePreview(quotes, ornstein);
      })
      .catch(function () {
        showFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
