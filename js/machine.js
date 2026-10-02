(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var reduced = window.SiteMotion && window.SiteMotion.prefersReducedMotion;
  var gbp = Charts.formatGBP;

  var ML = 64, CW = 56, MR = 24, PH = 250, LT = 18;

  function svg(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }

  function h(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeBack(p) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }

  function feeText(m) {
    return "£" + (Number.isInteger(m) ? m : m.toFixed(1)) + "m";
  }

  function seasonForDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    var y = d.getUTCFullYear();
    var start = d.getUTCMonth() >= 4 ? y : y - 1;
    return start + "-" + String((start + 1) % 100).padStart(2, "0");
  }

  function build(root, finance, transfers) {
    // ---- data model: one entry per season, finance rows plus any later signings
    var byFin = {};
    finance.forEach(function (f) { byFin[f.season] = f; });
    var names = finance.map(function (f) { return f.season; });
    transfers.forEach(function (t) {
      var s = seasonForDate(t.date);
      if (names.indexOf(s) === -1) names.push(s);
    });
    names.sort();
    var N = names.length;

    var seasons = names.map(function (name) {
      var f = byFin[name] || null;
      var deals = transfers
        .filter(function (t) { return seasonForDate(t.date) === name && t.fee_gbp != null; })
        .sort(function (a, b) { return b.fee_gbp - a.fee_gbp; });
      var split = f && f.matchday != null && f.broadcast != null && f.commercial != null;
      return { name: name, fin: f, deals: deals, split: !!split };
    });

    // ---- geometry
    function radius(m) { return Math.max(5, 2.3 * Math.sqrt(m)); }
    var maxStack = 0;
    seasons.forEach(function (s) {
      var tot = 0;
      s.deals.forEach(function (d) { tot += radius(d.fee_gbp) * 2 + 3; });
      maxStack = Math.max(maxStack, tot);
    });
    var BH = Math.max(120, Math.ceil(maxStack) + 14);
    var laneBottom = LT + BH;
    var PT = laneBottom + 46;
    var base = PT + PH;
    var W = ML + N * CW + MR;
    var H = base + 74;
    var maxRev = Math.max.apply(null, finance.map(function (f) { return f.revenue_gbp; }));
    var step = Charts.niceStep(maxRev, 4);
    var domainMax = Math.ceil(maxRev / step) * step;
    function yFor(v) { return base - (v / domainMax) * PH; }

    // ---- DOM: counters, controls, stage, detail
    root.textContent = "";
    var tiles = h("div", "mm-tiles", null, root);
    function tile(label, id, accent) {
      var t = h("div", "mm-tile" + (accent ? " is-key" : ""), null, tiles);
      var v = h("p", "mm-tile-val num", "£0.0m", t);
      v.id = id;
      h("p", "mm-tile-label", label, t);
      return v;
    }
    var tRev = tile("Revenue so far", "mm-rev");
    var tWages = tile("Wages so far (seasons with a reported figure)", "mm-wages");
    var tFees = tile("Signing fees so far (named signings)", "mm-fees", true);
    var tRes = tile("Pre-tax result so far", "mm-res");

    var controls = h("div", "mm-controls", null, root);
    var playBtn = h("button", "mm-btn mm-play", "Play", controls);
    playBtn.type = "button";
    var replayBtn = h("button", "mm-btn", "Replay", controls);
    replayBtn.type = "button";
    var speedBtn = h("button", "mm-btn", "1×", controls);
    speedBtn.type = "button";
    speedBtn.setAttribute("aria-label", "Playback speed 1×. Press to switch to 2×");
    var scrub = h("input", "mm-scrub", null, controls);
    scrub.type = "range";
    scrub.min = 0; scrub.max = N; scrub.step = 0.05; scrub.value = 0;
    scrub.setAttribute("aria-label", "Season scrubber");
    var seasonLabel = h("span", "mm-season num", "Before " + names[0], controls);

    var stage = h("div", "chart-scroll mm-stage viz-root", null, root);
    var s = svg("svg", { class: "viz-svg mm-svg", viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
      "aria-label": "Season-by-season replay of City's revenue, wages and signings, 2008-09 onward. The season panel below lists the same figures as text." }, stage);

    // grid + axis
    for (var g = 0; g <= domainMax; g += step) {
      var gy = yFor(g);
      svg("line", { class: "viz-axis-line", x1: ML, x2: ML + N * CW, y1: gy, y2: gy }, s);
      var gt = svg("text", { x: ML - 8, y: gy + 3, "text-anchor": "end" }, s);
      gt.textContent = gbp(g);
    }
    var lane = svg("text", { class: "mm-lane-label", x: ML, y: laneBottom + 24 }, s);
    lane.textContent = "SIGNINGS  (bubble area = fee)";
    names.forEach(function (n, i) {
      var x = ML + i * CW + CW / 2, y = base + 14;
      var lt = svg("text", { x: x, y: y, "text-anchor": "end", transform: "rotate(-40 " + x + " " + y + ")" }, s);
      lt.textContent = n;
    });

    // season columns
    var cols = seasons.map(function (se, i) {
      var x = ML + i * CW + 7, w = CW - 14;
      var grp = svg("g", { class: "mm-col", "data-i": i }, s);
      svg("rect", { class: "mm-hit", x: ML + i * CW, y: PT - 20, width: CW, height: PH + 40, fill: "transparent" }, grp);
      var parts = [];
      if (se.fin && se.split) {
        parts = [
          { key: "matchday", cls: "mm-md", el: svg("rect", { class: "mm-md", x: x, width: w }, grp) },
          { key: "broadcast", cls: "mm-br", el: svg("rect", { class: "mm-br", x: x, width: w }, grp) },
          { key: "commercial", cls: "mm-co", el: svg("rect", { class: "mm-co", x: x, width: w }, grp) }
        ];
      } else if (se.fin) {
        parts = [{ key: "revenue_gbp", cls: "mm-tot", el: svg("rect", { class: "mm-tot", x: x, width: w }, grp) }];
      }
      var wage = se.fin && se.fin.wages != null ? svg("line", { class: "mm-wage", x1: x - 3, x2: x + w + 3 }, grp) : null;
      var pending = !se.fin ? svg("rect", { class: "mm-pending", x: x, y: base - 54, width: w, height: 54 }, grp) : null;
      var pendTxt = !se.fin ? svg("text", { class: "mm-pending-txt", x: x + w / 2, y: base - 60, "text-anchor": "middle" }, grp) : null;
      if (pendTxt) pendTxt.textContent = "n/p";
      return { grp: grp, parts: parts, wage: wage, pending: pending, pendTxt: pendTxt, x: x, w: w };
    });

    // signing bubbles
    var bubbles = [];
    var topFees = transfers.filter(function (t) { return t.fee_gbp != null; }).sort(function (a, b) { return b.fee_gbp - a.fee_gbp; }).slice(0, 3).map(function (t) { return t.player; });
    seasons.forEach(function (se, i) {
      var offset = 0;
      se.deals.forEach(function (d, k) {
        var r = radius(d.fee_gbp);
        var cx = ML + i * CW + CW / 2;
        var cy = laneBottom - r - offset;
        offset += r * 2 + 3;
        var grp = svg("g", { class: "mm-bubble", "data-i": i }, s);
        svg("circle", { cx: cx, cy: cy, r: r }, grp);
        var lab = null;
        if (topFees.indexOf(d.player) > -1) {
          lab = svg("text", { class: "mm-bubble-label", x: cx, y: cy - r - 5, "text-anchor": "middle" }, grp);
          lab.textContent = d.player.split(" ").slice(-1)[0];
        }
        bubbles.push({ grp: grp, season: i, k: k, deal: d, cy: cy, r: r });
      });
    });

    var playhead = svg("line", { class: "mm-playhead", y1: LT - 8, y2: base }, s);

    var detail = h("div", "mm-detail", null, root);
    var legend = h("div", "viz-legend mm-legend", null, root);
    [["mm-md", "Matchday"], ["mm-br", "Broadcast"], ["mm-co", "Commercial"], ["mm-tot", "Revenue (split not reported)"]].forEach(function (l) {
      var it = h("span", "viz-legend-item", null, legend);
      h("span", "viz-legend-swatch " + l[0], null, it);
      it.appendChild(document.createTextNode(l[1]));
    });
    var wl = h("span", "viz-legend-item", null, legend);
    h("span", "mm-wage-key", null, wl);
    wl.appendChild(document.createTextNode("Wage bill (tick)"));
    h("span", "viz-legend-item", "n/p = accounts not yet published", legend);

    var tip = h("div", "viz-tip", null, stage);
    tip.hidden = true;

    // ---- state + rendering
    var state = { v: 0, playing: false, speed: 1, last: 0, raf: 0, active: -2, timer: 0, started: false };

    function progress(i, v) { return clamp(v - i, 0, 1); }

    function render() {
      var v = state.v;
      var cumRev = 0, cumWages = 0, cumFees = 0, cumRes = 0;

      seasons.forEach(function (se, i) {
        var p = progress(i, v), e = reduced && p < 1 ? 0 : easeOut(p);
        var c = cols[i];
        if (se.fin) {
          var cum = 0;
          c.parts.forEach(function (part) {
            var val = se.fin[part.key];
            var top = yFor((cum + val) * e), bottom = yFor(cum * e);
            part.el.setAttribute("y", top);
            part.el.setAttribute("height", Math.max(0, bottom - top));
            part.el.style.opacity = e > 0 ? 1 : 0;
            cum += val;
          });
          if (c.wage) {
            var wy = yFor(se.fin.wages * e);
            c.wage.setAttribute("y1", wy); c.wage.setAttribute("y2", wy);
            c.wage.style.opacity = e > 0.02 ? 1 : 0;
          }
          cumRev += se.fin.revenue_gbp * e;
          if (se.fin.wages != null) cumWages += se.fin.wages * e;
          cumRes += se.fin.pretax_profit * e;
        } else {
          c.pending.style.opacity = e;
          c.pendTxt.style.opacity = e;
        }
      });

      bubbles.forEach(function (b) {
        var p = progress(b.season, v);
        var pb = reduced ? (p >= 1 ? 1 : 0) : clamp(p * 1.5 - b.k * 0.16, 0, 1);
        var dy = -(1 - easeBack(pb)) * (BH + 50);
        b.grp.style.opacity = Math.min(1, pb * 5);
        b.grp.setAttribute("transform", "translate(0," + dy.toFixed(1) + ")");
        cumFees += b.deal.fee_gbp * 1e6 * (reduced ? (p >= 1 ? 1 : 0) : easeOut(p));
      });

      tRev.textContent = gbp(cumRev);
      tWages.textContent = gbp(cumWages);
      tFees.textContent = gbp(cumFees);
      tRes.textContent = gbp(cumRes);
      tRes.classList.toggle("is-neg", cumRes < 0);

      var px = ML + clamp(v, 0, N) * CW;
      playhead.setAttribute("x1", px); playhead.setAttribute("x2", px);
      playhead.style.opacity = v > 0 && v < N ? 1 : 0;
      // On narrow screens the chart scrolls sideways; keep the playhead in view.
      var vis = stage.clientWidth;
      if (stage.scrollWidth > vis + 2) {
        stage.scrollLeft = clamp(px - vis * 0.6, 0, stage.scrollWidth - vis);
      }

      var idx = v <= 0 ? -1 : clamp(Math.ceil(v - 0.0001) - 1, 0, N - 1);
      seasonLabel.textContent = idx < 0 ? "Before " + names[0] : names[idx];
      scrub.value = v;
      scrub.setAttribute("aria-valuetext", seasonLabel.textContent);
      if (idx !== state.active) { state.active = idx; renderDetail(idx); highlight(idx); }
    }

    function highlight(idx) {
      cols.forEach(function (c, i) { c.grp.classList.toggle("is-active", i === idx); });
    }

    function row(dl, name, value) {
      h("dt", null, name, dl);
      h("dd", "num", value, dl);
    }

    function renderDetail(idx) {
      detail.textContent = "";
      if (idx < 0) {
        h("p", "mm-hint", "Press play to replay the money season by season. Scrub the bar, or click any season or bubble, to stop and read it.", detail);
        return;
      }
      var se = seasons[idx];
      var top = h("div", "mm-detail-head", null, detail);
      h("h3", null, se.name, top);
      var dl = h("dl", "mm-dl", null, detail);
      if (se.fin) {
        row(dl, "Revenue", gbp(se.fin.revenue_gbp));
        if (se.split) {
          var t = se.fin.revenue_gbp;
          row(dl, "Matchday", gbp(se.fin.matchday) + " (" + (se.fin.matchday / t * 100).toFixed(1) + "%)");
          row(dl, "Broadcast", gbp(se.fin.broadcast) + " (" + (se.fin.broadcast / t * 100).toFixed(1) + "%)");
          row(dl, "Commercial", gbp(se.fin.commercial) + " (" + (se.fin.commercial / t * 100).toFixed(1) + "%)");
        } else {
          row(dl, "Split", "not reported");
        }
        row(dl, "Wages", se.fin.wages != null ? gbp(se.fin.wages) : "not reported");
        row(dl, "Pre-tax result", gbp(se.fin.pretax_profit));
      } else {
        row(dl, "Accounts", "not yet published");
      }
      var sg = h("div", "mm-signings", null, detail);
      h("h4", null, se.deals.length ? "Signings listed this season" : "No signings listed this season", sg);
      if (se.deals.length) {
        var ul = h("ul", null, null, sg);
        se.deals.forEach(function (d) {
          var li = h("li", null, null, ul);
          var a = h("a", null, d.player, li);
          a.href = d.source_url; a.rel = "noopener"; a.target = "_blank";
          li.appendChild(document.createTextNode(" — " + feeText(d.fee_gbp) + ", from " + d.from_club));
        });
      }
      if (se.fin && se.fin.source_url) {
        var src = h("p", "mm-src", "Accounts: ", detail);
        var sa = h("a", null, "source", src);
        sa.href = se.fin.source_url; sa.rel = "noopener"; sa.target = "_blank";
      }
    }

    // ---- playback
    function frame(ts) {
      if (!state.playing) return;
      var dt = Math.min(0.1, (ts - state.last) / 1000);
      state.last = ts;
      state.v = Math.min(N, state.v + dt * state.speed);
      render();
      if (state.v >= N) pause(); else state.raf = requestAnimationFrame(frame);
    }

    function play() {
      if (state.v >= N) state.v = 0;
      state.playing = true;
      playBtn.textContent = "Pause";
      if (reduced) {
        state.timer = setInterval(function () {
          state.v = Math.min(N, Math.floor(state.v + 0.001) + 1);
          render();
          if (state.v >= N) pause();
        }, 1100 / state.speed);
      } else {
        state.last = performance.now();
        state.raf = requestAnimationFrame(frame);
      }
    }

    function pause() {
      state.playing = false;
      playBtn.textContent = state.v >= N ? "Play again" : "Play";
      cancelAnimationFrame(state.raf);
      clearInterval(state.timer);
    }

    function seek(v) { pause(); state.v = clamp(v, 0, N); render(); }

    playBtn.addEventListener("click", function () { if (state.playing) pause(); else play(); });
    replayBtn.addEventListener("click", function () { pause(); state.v = 0; render(); play(); });
    speedBtn.addEventListener("click", function () {
      state.speed = state.speed === 1 ? 2 : 1;
      speedBtn.textContent = state.speed + "×";
      speedBtn.setAttribute("aria-label", "Playback speed " + state.speed + "×. Press to switch to " + (state.speed === 1 ? 2 : 1) + "×");
      if (state.playing && reduced) { pause(); play(); }
    });
    scrub.addEventListener("input", function () { seek(parseFloat(scrub.value)); });
    scrub.addEventListener("keydown", function (e) {
      var v = state.v;
      if (e.key === "ArrowRight") v = Math.floor(v + 0.001) + 1;
      else if (e.key === "ArrowLeft") v = Math.ceil(v - 0.001) - 1;
      else if (e.key === "Home") v = 0;
      else if (e.key === "End") v = N;
      else return;
      e.preventDefault();
      seek(v);
    });

    // ---- pointer: tooltips + click to jump
    function showTip(e, title, items) {
      tip.textContent = "";
      h("div", "viz-tip-head", title, tip);
      items.forEach(function (it) {
        var r = h("div", "viz-tip-row", null, tip);
        var k = h("span", "viz-tip-key", null, r);
        k.style.background = it.color || "var(--text-muted)";
        h("span", "viz-tip-val num", it.value, r);
        h("span", "viz-tip-name", it.name, r);
      });
      tip.hidden = false;
      var box = stage.getBoundingClientRect();
      var x = e.clientX - box.left + stage.scrollLeft + 14;
      var y = e.clientY - box.top + stage.scrollTop - 10;
      var tw = tip.offsetWidth;
      if (x + tw > stage.scrollWidth - 6) x = x - tw - 28;
      tip.style.left = Math.max(4, x) + "px";
      tip.style.top = Math.max(4, y) + "px";
    }
    function hideTip() { tip.hidden = true; }

    cols.forEach(function (c, i) {
      var se = seasons[i];
      c.grp.addEventListener("pointermove", function (e) {
        if (progress(i, state.v) <= 0) { hideTip(); return; }
        var items = [];
        if (se.fin) {
          items.push({ name: "Revenue", value: gbp(se.fin.revenue_gbp), color: "var(--text-primary)" });
          if (se.split) {
            items.push({ name: "Matchday", value: gbp(se.fin.matchday), color: "var(--chart-ink)" });
            items.push({ name: "Broadcast", value: gbp(se.fin.broadcast), color: "var(--chart-red)" });
            items.push({ name: "Commercial", value: gbp(se.fin.commercial), color: "var(--chart-teal)" });
          }
          items.push({ name: "Wages", value: se.fin.wages != null ? gbp(se.fin.wages) : "not reported", color: "var(--text-primary)" });
          items.push({ name: "Pre-tax result", value: gbp(se.fin.pretax_profit), color: "var(--text-muted)" });
        } else {
          items.push({ name: "Accounts", value: "not yet published" });
        }
        showTip(e, se.name, items);
      });
      c.grp.addEventListener("pointerleave", hideTip);
      c.grp.addEventListener("click", function () { seek(i + 1); });
    });
    bubbles.forEach(function (b) {
      b.grp.addEventListener("pointermove", function (e) {
        e.stopPropagation();
        showTip(e, b.deal.player, [
          { name: "Fee", value: feeText(b.deal.fee_gbp), color: "var(--accent)" },
          { name: "From", value: b.deal.from_club, color: "var(--text-muted)" },
          { name: "Season", value: seasons[b.season].name, color: "var(--text-muted)" }
        ]);
      });
      b.grp.addEventListener("pointerleave", hideTip);
      b.grp.addEventListener("click", function () { seek(b.season + 1); });
    });

    // ---- start: show the finished picture first (safe if never scrolled to), then autoplay once on view
    state.v = N;
    render();
    pause();
    if (!reduced && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !state.started) {
          state.started = true;
          io.disconnect();
          state.v = 0;
          render();
          play();
        }
      }, { threshold: 0.35 });
      io.observe(stage);
    }
  }

  function init() {
    var root = document.getElementById("mm");
    if (!root) return;
    Promise.all([fetch("data/finance.json"), fetch("data/transfers.json")])
      .then(function (rs) {
        if (rs.some(function (r) { return !r.ok; })) throw new Error("fetch failed");
        return Promise.all(rs.map(function (r) { return r.json(); }));
      })
      .then(function (d) { build(root, d[0], d[1]); })
      .catch(function () {
        root.textContent = "";
        h("p", "placeholder-panel", "Could not load this data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.", root);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
