// Shared inline-SVG chart helpers, used by js/money.js and js/spending.js.
// Plain HTML/SVG, no external chart library, per CLAUDE.md's tech-stack rules.
window.Charts = (function () {
  "use strict";

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function formatGBP(n) {
    if (n === null || n === undefined) return "n/r";
    var m = n / 1e6;
    var abs = Math.abs(m);
    var str, unit;
    if (abs >= 1000) {
      str = (abs / 1000).toFixed(2).replace(/\.?0+$/, "");
      unit = "bn";
    } else {
      var val = abs >= 100 ? Math.round(abs) : Math.round(abs * 10) / 10;
      str = Number.isInteger(val) ? String(val) : val.toFixed(1);
      unit = "m";
    }
    return (n < 0 ? "−£" : "£") + str + unit;
  }

  function niceStep(maxAbs, targetTicks) {
    if (maxAbs <= 0) return 1;
    var roughStep = maxAbs / targetTicks;
    var magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    var residual = roughStep / magnitude;
    var step;
    if (residual > 5) step = 10 * magnitude;
    else if (residual > 2) step = 5 * magnitude;
    else if (residual > 1) step = 2 * magnitude;
    else step = magnitude;
    return step;
  }

  function roundedTopPath(x, y, w, h, r) {
    if (h <= 0) return "";
    r = Math.min(r, w / 2, h);
    return (
      "M" + x + "," + (y + h) +
      " L" + x + "," + (y + r) +
      " Q" + x + "," + y + " " + (x + r) + "," + y +
      " L" + (x + w - r) + "," + y +
      " Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) +
      " L" + (x + w) + "," + (y + h) + " Z"
    );
  }

  function roundedBottomPath(x, y, w, h, r) {
    if (h <= 0) return "";
    r = Math.min(r, w / 2, h);
    return (
      "M" + x + "," + y +
      " L" + (x + w) + "," + y +
      " L" + (x + w) + "," + (y + h - r) +
      " Q" + (x + w) + "," + (y + h) + " " + (x + w - r) + "," + (y + h) +
      " L" + (x + r) + "," + (y + h) +
      " Q" + x + "," + (y + h) + " " + x + "," + (y + h - r) +
      " Z"
    );
  }

  // Shared chart geometry
  var CAT_WIDTH = 52;
  var MARGIN_LEFT = 64;
  var MARGIN_RIGHT = 56;
  var MARGIN_TOP = 20;
  var MARGIN_BOTTOM = 66;
  var PLOT_HEIGHT = 220;

  function seasonLabelsHtml(seasons, x0) {
    return seasons
      .map(function (s, i) {
        var x = x0 + i * CAT_WIDTH + CAT_WIDTH / 2;
        var y = MARGIN_TOP + PLOT_HEIGHT + 14;
        return (
          '<text x="' + x + '" y="' + y + '" text-anchor="end" transform="rotate(-40 ' + x + " " + y + ')">' +
          escapeHtml(s) +
          "</text>"
        );
      })
      .join("");
  }

  function gridlinesHtml(ticks, x0, width, valueToY) {
    return ticks
      .map(function (t) {
        var y = valueToY(t);
        return (
          '<line class="viz-axis-line" x1="' + x0 + '" x2="' + (x0 + width) + '" y1="' + y + '" y2="' + y + '"></line>' +
          '<text x="' + (x0 - 8) + '" y="' + (y + 3) + '" text-anchor="end">' + formatGBP(t) + "</text>"
        );
      })
      .join("");
  }

  function svgWrap(width, height, inner) {
    return (
      '<svg class="viz-svg" viewBox="0 0 ' + width + " " + height + '" width="' + width + '" height="' + height +
      '" role="img" aria-label="Chart">' + inner + "</svg>"
    );
  }

  function buildLineChart(container, seasons, values) {
    var n = seasons.length;
    var width = MARGIN_LEFT + n * CAT_WIDTH + MARGIN_RIGHT;
    var height = MARGIN_TOP + PLOT_HEIGHT + MARGIN_BOTTOM;
    var max = Math.max.apply(null, values.filter(function (v) { return v !== null; }));
    var step = niceStep(max, 5);
    var domainMax = Math.ceil(max / step) * step;
    var ticks = [];
    for (var t = 0; t <= domainMax; t += step) ticks.push(t);

    function valueToY(v) {
      return MARGIN_TOP + PLOT_HEIGHT - (v / domainMax) * PLOT_HEIGHT;
    }

    var points = values.map(function (v, i) {
      return { x: MARGIN_LEFT + i * CAT_WIDTH + CAT_WIDTH / 2, y: valueToY(v), v: v, s: seasons[i] };
    });

    var pathD = points
      .map(function (p, i) {
        return (i === 0 ? "M" : "L") + p.x + "," + p.y;
      })
      .join(" ");

    var circles = points
      .map(function (p) {
        return (
          '<circle cx="' + p.x + '" cy="' + p.y + '" r="4.5" fill="var(--series-1)" stroke="var(--surface-1)" stroke-width="2">' +
          "<title>" + escapeHtml(p.s) + ": " + formatGBP(p.v) + "</title>" +
          "</circle>"
        );
      })
      .join("");

    var last = points[points.length - 1];
    var endLabel =
      '<text class="viz-value-label" x="' + (last.x + 8) + '" y="' + (last.y + 4) + '" text-anchor="start">' +
      formatGBP(last.v) +
      "</text>";

    var inner =
      gridlinesHtml(ticks, MARGIN_LEFT, n * CAT_WIDTH, valueToY) +
      seasonLabelsHtml(seasons, MARGIN_LEFT) +
      '<path d="' + pathD + '" fill="none" stroke="var(--series-1)" stroke-width="2"></path>' +
      circles +
      endLabel;

    container.innerHTML = svgWrap(width, height, inner);
    container.classList.add("viz-root");
  }

  function buildBarChart(container, seasons, values) {
    var n = seasons.length;
    var width = MARGIN_LEFT + n * CAT_WIDTH + MARGIN_RIGHT;
    var height = MARGIN_TOP + PLOT_HEIGHT + MARGIN_BOTTOM;
    var present = values.filter(function (v) { return v !== null; });
    var max = Math.max.apply(null, present);
    var step = niceStep(max, 5);
    var domainMax = Math.ceil(max / step) * step;
    var ticks = [];
    for (var t = 0; t <= domainMax; t += step) ticks.push(t);

    function valueToY(v) {
      return MARGIN_TOP + PLOT_HEIGHT - (v / domainMax) * PLOT_HEIGHT;
    }

    var barW = CAT_WIDTH - 16;
    var bars = values
      .map(function (v, i) {
        var x = MARGIN_LEFT + i * CAT_WIDTH + 8;
        if (v === null) {
          var ny = MARGIN_TOP + PLOT_HEIGHT + 30;
          return (
            '<text x="' + (x + barW / 2) + '" y="' + ny + '" text-anchor="middle" font-style="italic">n/r</text>'
          );
        }
        var y = valueToY(v);
        var h = MARGIN_TOP + PLOT_HEIGHT - y;
        var d = roundedTopPath(x, y, barW, h, 3);
        return (
          '<path d="' + d + '" fill="var(--series-1)"><title>' + escapeHtml(seasons[i]) + ": " + formatGBP(v) + "</title></path>"
        );
      })
      .join("");

    var inner = gridlinesHtml(ticks, MARGIN_LEFT, n * CAT_WIDTH, valueToY) + seasonLabelsHtml(seasons, MARGIN_LEFT) + bars;

    container.innerHTML = svgWrap(width, height, inner);
    container.classList.add("viz-root");
  }

  function buildDivergingBarChart(container, seasons, values) {
    var n = seasons.length;
    var width = MARGIN_LEFT + n * CAT_WIDTH + MARGIN_RIGHT;
    var height = MARGIN_TOP + PLOT_HEIGHT + MARGIN_BOTTOM;
    var minVal = Math.min.apply(null, values.concat([0]));
    var maxVal = Math.max.apply(null, values.concat([0]));
    var step = niceStep(Math.max(Math.abs(minVal), Math.abs(maxVal)), 4);
    var domainMin = Math.floor(minVal / step) * step;
    var domainMax = Math.ceil(maxVal / step) * step;
    var ticks = [];
    for (var t = domainMin; t <= domainMax; t += step) ticks.push(t);

    function valueToY(v) {
      return MARGIN_TOP + PLOT_HEIGHT * ((domainMax - v) / (domainMax - domainMin));
    }

    var zeroY = valueToY(0);
    var barW = CAT_WIDTH - 16;

    var bars = values
      .map(function (v, i) {
        var x = MARGIN_LEFT + i * CAT_WIDTH + 8;
        var y = valueToY(v);
        var d, color, labelY;
        if (v >= 0) {
          d = roundedTopPath(x, y, barW, zeroY - y, 3);
          color = "var(--diverging-pos)";
          labelY = y - 6;
        } else {
          d = roundedBottomPath(x, zeroY, barW, y - zeroY, 3);
          color = "var(--diverging-neg)";
          labelY = y + 13;
        }
        var label =
          '<text class="viz-value-label" x="' + (x + barW / 2) + '" y="' + labelY + '" text-anchor="middle" font-size="10">' +
          formatGBP(v) +
          "</text>";
        return (
          '<path d="' + d + '" fill="' + color + '"><title>' + escapeHtml(seasons[i]) + ": " + formatGBP(v) + "</title></path>" +
          label
        );
      })
      .join("");

    var gridInner = ticks
      .filter(function (t) { return t !== 0; })
      .map(function (t) {
        var y = valueToY(t);
        return (
          '<line class="viz-axis-line" x1="' + MARGIN_LEFT + '" x2="' + (MARGIN_LEFT + n * CAT_WIDTH) + '" y1="' + y + '" y2="' + y + '"></line>' +
          '<text x="' + (MARGIN_LEFT - 8) + '" y="' + (y + 3) + '" text-anchor="end">' + formatGBP(t) + "</text>"
        );
      })
      .join("");

    var zeroLine =
      '<line class="viz-zero-line" x1="' + MARGIN_LEFT + '" x2="' + (MARGIN_LEFT + n * CAT_WIDTH) + '" y1="' + zeroY + '" y2="' + zeroY + '"></line>' +
      '<text x="' + (MARGIN_LEFT - 8) + '" y="' + (zeroY + 3) + '" text-anchor="end">£0</text>';

    var inner = gridInner + zeroLine + seasonLabelsHtml(seasons, MARGIN_LEFT) + bars;

    container.innerHTML = svgWrap(width, height, inner);
    container.classList.add("viz-root");
  }

  function buildStackedBarChart(container, seasons, seriesRows, seriesDefs) {
    var n = seasons.length;
    var width = MARGIN_LEFT + n * CAT_WIDTH + MARGIN_RIGHT;
    var height = MARGIN_TOP + PLOT_HEIGHT + MARGIN_BOTTOM;
    var totals = seriesRows.map(function (row) {
      return seriesDefs.reduce(function (sum, def) { return sum + (row[def.key] || 0); }, 0);
    });
    var max = Math.max.apply(null, totals);
    var step = niceStep(max, 5);
    var domainMax = Math.ceil(max / step) * step;
    var ticks = [];
    for (var t = 0; t <= domainMax; t += step) ticks.push(t);

    function valueToPx(v) {
      return (v / domainMax) * PLOT_HEIGHT;
    }

    var GAP = 2;
    var barW = CAT_WIDTH - 16;

    var bars = seriesRows
      .map(function (row, i) {
        var x = MARGIN_LEFT + i * CAT_WIDTH + 8;
        var cursorY = MARGIN_TOP + PLOT_HEIGHT;
        var segs = "";
        seriesDefs.forEach(function (def, idx) {
          var val = row[def.key] || 0;
          var h = valueToPx(val) - (idx < seriesDefs.length - 1 ? GAP : 0);
          if (h <= 0) return;
          var y = cursorY - h;
          var isTop = idx === seriesDefs.length - 1;
          var d = isTop ? roundedTopPath(x, y, barW, h, 3) : "M" + x + "," + (y + h) + " h" + barW + " v" + -h + " h" + -barW + " Z";
          segs +=
            '<path d="' + d + '" fill="var(--series-' + (idx + 1) + ')"><title>' +
            escapeHtml(seasons[i]) + " " + escapeHtml(def.label) + ": " + formatGBP(val) +
            "</title></path>";
          cursorY = y - GAP;
        });
        return segs;
      })
      .join("");

    var legend =
      '<div class="viz-legend">' +
      seriesDefs
        .map(function (def, idx) {
          return (
            '<span class="viz-legend-item"><span class="viz-legend-swatch" style="background:var(--series-' + (idx + 1) + ')"></span>' +
            escapeHtml(def.label) + "</span>"
          );
        })
        .join("") +
      "</div>";

    var inner = gridlinesHtml(ticks, MARGIN_LEFT, n * CAT_WIDTH, function (v) { return MARGIN_TOP + PLOT_HEIGHT - valueToPx(v); }) +
      seasonLabelsHtml(seasons, MARGIN_LEFT) +
      bars;

    container.innerHTML = svgWrap(width, height, inner) + legend;
    container.classList.add("viz-root");
  }

  return {
    escapeHtml: escapeHtml,
    formatGBP: formatGBP,
    niceStep: niceStep,
    buildLineChart: buildLineChart,
    buildBarChart: buildBarChart,
    buildDivergingBarChart: buildDivergingBarChart,
    buildStackedBarChart: buildStackedBarChart
  };
})();
