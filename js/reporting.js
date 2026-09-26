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

  function currentTweetTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function fallbackCardHtml(tweet) {
    return (
      '<div class="tweet-fallback-card">' +
      '<span class="tweet-date">' + formatDate(tweet.date) + "</span>" +
      "<p>" + escapeHtml(tweet.summary) + "</p>" +
      '<a class="tweet-view-link" href="' + escapeHtml(tweet.tweet_url) + '" rel="noopener" target="_blank">View on X →</a>' +
      "</div>"
    );
  }

  function renderTweets(tweets) {
    var grid = document.getElementById("tweet-grid");
    if (!grid) return;

    var theme = currentTweetTheme();

    grid.innerHTML = tweets
      .map(function (tweet, i) {
        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 90) : 0;
        return (
          '<div class="tweet-embed reveal" id="tweet-embed-' + i + '" data-tweet-url="' + escapeHtml(tweet.tweet_url) +
          '" style="--reveal-delay: ' + delay + 'ms">' +
          '<blockquote class="twitter-tweet" data-dnt="true" data-theme="' + theme + '">' +
          '<a href="' + escapeHtml(tweet.tweet_url) + '"></a>' +
          "</blockquote>" +
          '<div class="tweet-fallback-slot" hidden>' + fallbackCardHtml(tweet) + "</div>" +
          "</div>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(grid);

    loadEmbeds(tweets.map(function (_, i) { return document.getElementById("tweet-embed-" + i); }));
  }

  function showFallback(container) {
    if (!container || container.dataset.fallbackShown) return;
    container.dataset.fallbackShown = "true";
    var bq = container.querySelector("blockquote.twitter-tweet");
    if (bq) bq.remove();
    var slot = container.querySelector(".tweet-fallback-slot");
    if (slot) slot.hidden = false;
  }

  function loadEmbeds(containers) {
    if (!containers.length) return;

    var settled = false;
    var script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;

    function onFail() {
      if (settled) return;
      settled = true;
      containers.forEach(showFallback);
    }

    script.onerror = onFail;
    script.onload = function () {
      if (settled) return;
      settled = true;
      if (!window.twttr || !window.twttr.widgets) {
        containers.forEach(showFallback);
        return;
      }
      containers.forEach(function (container) {
        if (!container) return;
        window.twttr.widgets
          .load(container)
          .then(function (widgets) {
            if (!widgets || widgets.length === 0) showFallback(container);
          })
          .catch(function () {
            showFallback(container);
          });
      });
    };

    setTimeout(onFail, 6000);
    document.body.appendChild(script);
  }

  function renderArticles(articles) {
    var list = document.getElementById("article-list");
    if (!list) return;

    var sorted = articles.slice().sort(function (a, b) {
      return new Date(a.date) - new Date(b.date);
    });

    list.innerHTML = sorted
      .map(function (a, i) {
        var delay = window.SiteMotion ? window.SiteMotion.staggerDelay(i, 30, 350) : 0;
        return (
          '<li class="reveal" style="--reveal-delay: ' + delay + 'ms">' +
          '<a class="article-title" href="' + escapeHtml(a.url) + '" rel="noopener" target="_blank">' +
          escapeHtml(a.title) +
          "</a>" +
          '<span class="article-meta">' + escapeHtml(a.outlet) + " &middot; " + formatDate(a.date) + "</span>" +
          "</li>"
        );
      })
      .join("");

    if (window.SiteMotion) window.SiteMotion.observeReveal(list);
  }

  function showFetchFallback() {
    var msg =
      "Could not load this data. If you're viewing this file directly from disk, serve the site over a local web server instead (see README) — browsers block JSON fetches from the file:// protocol.";
    var grid = document.getElementById("tweet-grid");
    var list = document.getElementById("article-list");
    if (grid) grid.innerHTML = '<p class="placeholder-panel">' + msg + "</p>";
    if (list) list.innerHTML = '<li class="placeholder-panel">' + msg + "</li>";
  }

  function init() {
    Promise.all([fetch("data/ornstein.json"), fetch("data/articles.json")])
      .then(function (responses) {
        if (!responses[0].ok || !responses[1].ok) throw new Error("Failed to fetch data");
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(function (data) {
        renderTweets(data[0]);
        renderArticles(data[1]);
      })
      .catch(function () {
        showFetchFallback();
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
