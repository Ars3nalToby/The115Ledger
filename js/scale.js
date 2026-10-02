(function () {
  "use strict";

  var escapeHtml = Charts.escapeHtml;
  var reduced = window.SiteMotion && window.SiteMotion.prefersReducedMotion;

  var ICONS = {
    stadium:
      '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<ellipse cx="16" cy="12" rx="14.6" ry="10.4"></ellipse><ellipse cx="16" cy="12" rx="11.2" ry="7.4"></ellipse>' +
      '<rect x="9" y="8.6" width="14" height="6.8" rx="0.8"></rect><path d="M16 8.6v6.8"></path><circle cx="16" cy="12" r="1.7"></circle></svg>',
    car:
      '<svg viewBox="0 0 32 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M2 12l2-5c.5-1.3 1.7-2 3-2h11c1 0 1.9.5 2.5 1.2L24 10l4 1c1.2.3 2 1.3 2 2.5V15H2z"></path>' +
      '<circle cx="9" cy="15" r="2.4"></circle><circle cx="23" cy="15" r="2.4"></circle></svg>'
  };

  var state = { metric: "fees", data: null, shown: 0 };

  function fmtMoney(raw) {
    if (raw >= 1e9) return "£" + (raw / 1e9).toFixed(2) + "bn";
    return "£" + (raw / 1e6).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "m";
  }

  function fmtRef(v) {
    if (v < 1e6) return "£" + v.toLocaleString("en-GB");
    if (v >= 1e9) {
      var g = (v / 1e9).toFixed(2);
      if (g.indexOf(".") > -1) g = g.replace(/\.?0+$/, "");
      return "£" + g + "bn";
    }
    return "£" + Math.round(v / 1e6) + "m";
  }

  function fmtCount(n) {
    if (n >= 100) return Math.round(n).toLocaleString("en-GB");
    return n.toFixed(1);
  }

  function fmtDate(iso) {
    return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }

  function tween(el, from, to, dur, format) {
    if (!el) return;
    if (reduced || from === to) {
      el.textContent = format(to);
      return;
    }
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = format(to);
    }
    requestAnimationFrame(step);
  }

  function whenVisible(el, fn) {
    if (reduced || !("IntersectionObserver" in window)) {
      el.classList.add("in-view");
      fn();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          io.disconnect();
          el.classList.add("in-view");
          fn();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
  }

  function sourcesLine(sources) {
    return (sources || [])
      .map(function (s) {
        return '<a href="' + escapeHtml(s.url) + '" rel="noopener" target="_blank">' + escapeHtml(s.outlet) + "</a>";
      })
      .join(", ");
  }

  function computeTotals(transfers, finance) {
    var fees = transfers.filter(function (t) { return t.fee_gbp != null; });
    var feeTotal = fees.reduce(function (s, t) { return s + t.fee_gbp * 1e6; }, 0);
    var firstDate = fees.reduce(function (m, t) { return t.date < m ? t.date : m; }, fees[0].date);
    var wageRows = finance.filter(function (f) { return f.wages != null; });
    var wageTotal = wageRows.reduce(function (s, f) { return s + f.wages; }, 0);
    var revTotal = finance.reduce(function (s, f) { return s + f.revenue_gbp; }, 0);
    var days = Math.max(1, Math.floor((Date.now() - new Date(firstDate + "T00:00:00Z").getTime()) / 86400000));

    return {
      fees: {
        total: feeTotal,
        label: "Fees paid for the " + fees.length + " signings listed in this ledger",
        detail:
          "That is a floor, not the full bill: many more signings are not listed here. Averaged out, it is about " +
          "£" + Math.round(feeTotal / days / 1000).toLocaleString("en-GB") + ",000 for every day since " + fmtDate(firstDate) +
          " (an average, not actual daily spending)."
      },
      wages: {
        total: wageTotal,
        label: "Wages paid in the " + wageRows.length + " seasons with a sourced figure",
        detail:
          (finance.length - wageRows.length) + " of the " + finance.length + " seasons have no sourced wage figure and are left out, so this is also a floor. " +
          "About " + fmtMoney(wageTotal / wageRows.length) + " a season on average."
      },
      revenue: {
        total: revTotal,
        label: "Revenue across all " + finance.length + " seasons, " + finance[0].season + " to " + finance[finance.length - 1].season,
        detail: "About " + fmtMoney(revTotal / finance.length) + " a season on average. Revenue is money in, not money spent; it shows how large the operation is."
      }
    };
  }

  function pictogram(count, ref) {
    var steps = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];
    var m = steps.find(function (s) { return Math.ceil(count / s) <= 20; }) || 100000;
    var units = count / m;
    var full = Math.floor(units);
    var frac = units - full;
    var svg = ICONS[ref.icon];
    var html = "";
    for (var i = 0; i < full; i++) {
      html += '<span class="pic" style="--d:' + i * 32 + 'ms">' + svg + "</span>";
    }
    if (frac > 0.02) {
      html +=
        '<span class="pic pic-partial" style="--d:' + full * 32 + 'ms">' +
        '<span class="pic-base">' + svg + "</span>" +
        '<span class="pic-fill" style="clip-path: inset(0 ' + ((1 - frac) * 100).toFixed(1) + '% 0 0)">' + svg + "</span></span>";
    }
    var legend = m === 1 ? "1 icon = 1 " + ref.label : "1 icon = " + m.toLocaleString("en-GB") + " " + ref.plural;
    return { html: html, legend: legend };
  }

  function renderTabs() {
    var tabs = [
      { id: "fees", label: "Signing fees" },
      { id: "wages", label: "Wage bill" },
      { id: "revenue", label: "Revenue" }
    ];
    var el = document.getElementById("scale-tabs");
    el.innerHTML = tabs
      .map(function (t) {
        return '<button type="button" class="scale-tab" data-metric="' + t.id + '" aria-pressed="' + (t.id === state.metric) + '">' + t.label + "</button>";
      })
      .join("");
    el.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (state.metric === b.getAttribute("data-metric")) return;
        state.metric = b.getAttribute("data-metric");
        el.querySelectorAll("button").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        renderMetric(true);
      });
    });
  }

  function raceHtml(total, refs) {
    var stadiums = refs.filter(function (r) { return r.icon === "stadium"; });
    var max = Math.max(total, Math.max.apply(null, stadiums.map(function (r) { return r.value_gbp; })));
    var rows = [{ label: "The total above", value: total, cls: "race-total" }].concat(
      stadiums.map(function (r) { return { label: "Cost to build the " + r.label, value: r.value_gbp, cls: "race-ref" }; })
    );
    return (
      '<div class="race" aria-hidden="true"><p class="race-title">Against the cost of building whole stadiums</p>' +
      rows
        .map(function (row, i) {
          return (
            '<div class="race-row" style="--d:' + i * 120 + 'ms"><span class="race-label">' + escapeHtml(row.label) +
            '</span><span class="race-track"><span class="race-bar ' + row.cls + '" style="width:' + ((row.value / max) * 100).toFixed(2) +
            '%"></span></span><span class="race-val num">' + (row.cls === "race-total" ? fmtMoney(row.value) : fmtRef(row.value)) + "</span></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function replayEquivCounts() {
    document.querySelectorAll("#scale-equiv .equiv-count").forEach(function (el) {
      tween(el, 0, parseFloat(el.getAttribute("data-target")), 1100, fmtCount);
    });
  }

  function renderMetric(animate) {
    var d = state.data;
    var m = d.totals[state.metric];
    var hero = document.getElementById("scale-hero");
    var equiv = document.getElementById("scale-equiv");
    var refs = d.scale.references;

    var etihad = refs.filter(function (r) { return r.id === "etihad"; })[0];
    var tesla = refs.filter(function (r) { return r.id === "tesla"; })[0];

    var press = d.scale.context.press_transfer_estimate;
    var pressHtml =
      state.metric === "fees"
        ? '<p class="scale-press">For scale: ' + escapeHtml(press.label) + " — €" +
          (press.spent_eur_m / 1000).toFixed(2) + "bn spent, €" + (press.recouped_eur_m / 1000).toFixed(2) +
          "bn recouped from sales, €" + (press.net_eur_m / 1000).toFixed(2) + "bn net. " + escapeHtml(press.note) +
          " <span class=\"scale-src\">Source: " + sourcesLine(press.sources) + "</span></p>"
        : "";

    var prev = animate ? state.shown : m.total;
    hero.innerHTML =
      '<p class="scale-hero-label">' + escapeHtml(m.label) + "</p>" +
      '<p class="scale-hero-number num" id="scale-number">' + fmtMoney(prev) + "</p>" +
      '<p class="scale-hero-punch">That equals about <strong>' + fmtCount(m.total / etihad.value_gbp) + " " + etihad.plural +
      "</strong> — City's own ground — or <strong>" + fmtCount(m.total / tesla.value_gbp) + " " + tesla.plural + "</strong>.</p>" +
      raceHtml(m.total, refs) +
      '<p class="scale-hero-detail">' + escapeHtml(m.detail) + "</p>" + pressHtml;

    state.shown = m.total;
    if (animate) tween(document.getElementById("scale-number"), prev, m.total, 900, fmtMoney);

    equiv.innerHTML = refs
      .map(function (r, i) {
        var count = m.total / r.value_gbp;
        var p = pictogram(count, r);
        return (
          '<div class="equiv-card" style="--d:' + i * 90 + 'ms">' +
          '<p class="equiv-count num" data-target="' + count + '">' + fmtCount(count) + "</p>" +
          '<p class="equiv-name">' + escapeHtml(r.plural) + "</p>" +
          '<div class="pics" aria-hidden="true">' + p.html + "</div>" +
          '<p class="equiv-legend">' + escapeHtml(p.legend) + " &middot; " + fmtRef(r.value_gbp) + " each</p>" +
          "</div>"
        );
      })
      .join("");

    if (animate) replayEquivCounts();

    document.getElementById("scale-summary").textContent =
      m.label + ": " + fmtMoney(m.total) + ". " +
      refs.map(function (r) { return fmtCount(m.total / r.value_gbp) + " " + r.plural; }).join("; ") + ".";
  }

  function renderCaveat() {
    var refs = state.data.scale.references;
    document.getElementById("scale-caveat").innerHTML =
      '<p><strong>How to read this.</strong> Each figure is the total divided by a reported price. Build costs are nominal — not adjusted for inflation — and come from different years, so treat the counts as a way to picture the scale, not as an audit. Where a cost is uncertain, the lower figure is used, which makes the comparison conservative.</p>' +
      '<details class="table-details"><summary>The prices used, and where they come from</summary><ul class="scale-refs">' +
      refs
        .map(function (r) {
          return (
            "<li><strong>" + escapeHtml(r.label) + ": " + fmtRef(r.value_gbp) + ".</strong> " +
            escapeHtml(r.basis) + (r.note ? " " + escapeHtml(r.note) : "") +
            ' <span class="scale-src">Sources: ' + sourcesLine(r.sources) + "</span></li>"
          );
        })
        .join("") +
      "</ul></details>";
  }

  function pct(part, total) {
    return (part / total) * 100;
  }

  function renderMix() {
    var rows = state.data.scale.revenue_mix;
    var sym = { GBP: "£", EUR: "€" };
    var city = rows[0];
    var cityMd = pct(city.matchday, city.total);
    var cityCom = pct(city.commercial, city.total);

    var bars = rows
      .map(function (r, i) {
        var md = pct(r.matchday, r.total);
        var br = pct(r.broadcast, r.total);
        var co = pct(r.commercial, r.total);
        function seg(cls, v) {
          return '<span class="mix-seg ' + cls + '" style="width:' + v.toFixed(2) + '%"></span>';
        }
        function key(cls, name, v) {
          return '<span class="mix-key-item"><span class="viz-legend-swatch ' + cls + '"></span>' + name + ' <b class="num">' + v.toFixed(1) + "%</b></span>";
        }
        return (
          '<div class="mix-row" style="--d:' + i * 180 + 'ms">' +
          '<div class="mix-head"><span class="mix-club">' + escapeHtml(r.club) + '</span><span class="mix-season num">' +
          escapeHtml(r.season) + " &middot; " + sym[r.currency] + r.total.toLocaleString("en-GB", { maximumFractionDigits: 1 }) + "m total</span></div>" +
          '<div class="mix-bar" role="img" aria-label="' + escapeHtml(r.club) + ": matchday " + md.toFixed(1) + "%, broadcast " + br.toFixed(1) + "%, commercial " + co.toFixed(1) + '% of revenue">' +
          seg("mix-md", md) + seg("mix-br", br) + seg("mix-co", co) + "</div>" +
          '<div class="mix-key">' + key("mix-md", "Matchday", md) + key("mix-br", "Broadcast", br) + key("mix-co", "Commercial", co) + "</div></div>"
        );
      })
      .join("");

    var callouts =
      '<div class="mix-callouts">' +
      rows
        .map(function (r) {
          var md = pct(r.matchday, r.total);
          return (
            '<div class="mix-callout"><p class="mix-big num" data-target="' + md.toFixed(1) + '">' + md.toFixed(1) + "%</p>" +
            "<p>of " + escapeHtml(r.club) + "'s revenue came from matchday (" + escapeHtml(r.season) + ")</p></div>"
          );
        })
        .join("") +
      "</div>";

    var story =
      '<p class="mix-story">For every £1 of revenue in 2024-25, about <strong>' + Math.round(cityMd) + "p</strong> reached City through matchday income. " +
      "At Arsenal it was <strong>" + Math.round(pct(rows[1].matchday, rows[1].total)) + "p</strong>; at Real Madrid, <strong>" +
      Math.round(pct(rows[2].matchday, rows[2].total)) + "p</strong>. About <strong>" + Math.round(cityCom) +
      "p</strong> of City's pound was commercial income — sponsorship and partnerships. See <a href=\"#sponsorship-heading\">Sponsorship</a> below, " +
      "including what has been alleged about how some of it was reported.</p>";

    var el = document.getElementById("mix");
    el.innerHTML = bars + callouts + story;

    var att = state.data.scale.context.attendance;
    document.getElementById("mix-caveat").innerHTML =
      "<p><strong>For balance.</strong> " + escapeHtml(att.label) + ": " + att.value.toLocaleString("en-GB") + ". " +
      "The matchday share describes the revenue mix, not how many fans attend; City's crowds are large. " +
      escapeHtml(att.note) + ' <span class="scale-src">Source: ' + sourcesLine(att.sources) + "</span></p>" +
      "<p>Shares, not amounts, are compared because the clubs report in different currencies and seasons differ (for example Arsenal played 30 home fixtures in 2024-25). " +
      rows
        .map(function (r) {
          return escapeHtml(r.club) + ": " + escapeHtml(r.note) + ' <span class="scale-src">Sources: ' + sourcesLine(r.sources) + "</span>";
        })
        .join(" ") +
      "</p>";

    whenVisible(el, function () {
      el.querySelectorAll(".mix-big").forEach(function (b) {
        tween(b, 0, parseFloat(b.getAttribute("data-target")), 1200, function (v) { return v.toFixed(1) + "%"; });
      });
    });
  }

  function renderIsnt() {
    var v = state.data.timeline
      .filter(function (e) { return e.club_response && e.date >= "2026-09-25"; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); })[0];
    var box = document.getElementById("scale-isnt");
    box.innerHTML =
      "<p><strong>Spending money is not against the rules.</strong> The Premier League's 115 charges are about whether City gave accurate financial information, disclosed player and manager pay in full, stayed within profitability and sustainability limits, and cooperated with the investigation. They are <em>alleged</em> breaches.</p>" +
      '<p><span class="status-badge status-badge--sm status-reported">FOUND (reported)</span> On 25 September 2026 The Athletic reported a finding on 114 of the 115 charges. On 29 September the Premier League issued a statement on the commission\'s decision, and later coverage describes the finding as all but one of the charges. <span class="status-badge status-badge--sm status-appeal">UNDER APPEAL</span> City lodged an appeal on 1 October; an independent three-member board will hear it, with a hearing expected within 12 weeks, and sanction is still to be decided. This site has not yet confirmed that the commission\'s written opinion is public, so it does not label the finding a published decision.</p>' +
      (v && v.club_response
        ? '<blockquote class="timeline-response">' + escapeHtml(v.club_response) + "</blockquote>"
        : "") +
      '<p>See the full <a href="timeline.html">timeline</a> for both of the club\'s statements, and <a href="sources.html">Sources &amp; Methodology</a> for every figure above.</p>';
  }

  function showFallback() {
    var msg =
      "Could not load this data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    ["scale-hero", "mix", "scale-isnt"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="placeholder-panel">' + msg + "</p>";
    });
  }

  function init() {
    if (!document.getElementById("scale-hero")) return;
    Promise.all(
      ["data/scale.json", "data/transfers.json", "data/finance.json", "data/timeline.json"].map(function (f) { return fetch(f); })
    )
      .then(function (rs) {
        if (rs.some(function (r) { return !r.ok; })) throw new Error("fetch failed");
        return Promise.all(rs.map(function (r) { return r.json(); }));
      })
      .then(function (d) {
        state.data = { scale: d[0], totals: computeTotals(d[1], d[2]), timeline: d[3] };
        renderTabs();
        renderCaveat();
        renderMix();
        renderIsnt();

        // Render final values immediately (safe if the section is never scrolled to),
        // then replay the count-up from zero once it is actually on screen.
        renderMetric(false);
        var equiv = document.getElementById("scale-equiv");
        whenVisible(document.getElementById("scale-hero"), function () {});
        whenVisible(equiv, function () {
          tween(document.getElementById("scale-number"), 0, state.data.totals[state.metric].total, 1400, fmtMoney);
          replayEquivCounts();
        });
      })
      .catch(showFallback);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
