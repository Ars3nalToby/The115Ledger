# BUILD PROMPT — "The 115 Ledger" (working title)
A public, fully-sourced record of Manchester City's financial-rules case, spending, and revenues from the 2008 takeover to today.

Paste this whole file into Claude Code (or save it as `CLAUDE.md` in the repo root).

---

## 0. Mission and editorial rules (read first, apply everywhere)

You are building a static website for football fans worldwide. Its job is to lay out — in one place, with a source on every claim — how Manchester City's spending, revenues and regulatory history unfolded from the 2008 Abu Dhabi takeover to the Premier League's 115-charges case and its outcome.

The site's power comes from being **impossible to dismiss as fan bitterness**. So:

1. **Every factual claim needs a source link** (outlet + date + URL). No source → it doesn't go on the site.
2. **Use precise status language, always:**
   - `CHARGED / ALLEGED` — before the commission's decision.
   - `FOUND (reported)` — the verdict as reported by journalists (e.g. The Athletic), before the written decision is published.
   - `FOUND (published decision)` — only once the commission's written reasons are public; link to the document.
   - `SANCTION PENDING` / `UNDER APPEAL` / `FINAL` — track separately.
3. **Include the club's response** next to every major event (their Feb 2023 statement, their Sept 2026 statement). Right of reply makes the site credible.
4. **No invented numbers.** Transfer fees and revenues must come from a named source (club annual reports, Deloitte Football Money League, reputable press). Where sources disagree, show the range and say so.
5. **Do not scrape** Transfermarkt, X/Twitter or paywalled sites. Data is entered by hand into JSON files with a `source_url` field.
6. **No club crests, logos, kit images or match photography.** Use typography, charts and icons only. Footer: "Unofficial. Not affiliated with any club, league or governing body."
7. Tone: calm, factual, documentary. Let the timeline speak. No abuse aimed at players, staff or fans.
8. Before publishing any date, fee or quote in the seed data below, **re-verify it with a web search** and fix it if wrong.

---

## 1. Tech stack

- Static site: plain HTML + CSS + vanilla JS (or Astro if you judge it cleaner). No backend.
- All content in `/data/*.json` so it can be updated without touching code.
- Charts: Chart.js (or lightweight D3).
- Dark + light mode, mobile-first, fast (<1s first paint on 4G).
- Deploy target: GitHub Pages or Cloudflare Pages. Add a `README.md` with "how to add a new event / tweet / transfer" instructions.
- Accessible: semantic HTML, alt text, keyboard navigation, good contrast.
- Optional later: English / 中文 toggle (keep all copy in `/data/i18n/`).

---

## 2. Pages

### 2.1 Home — "The Clock"
- Hero: live counters
  - Days since charges were issued (Feb 2023 — verify exact date).
  - Days since the verdict was reported (Sept 2026 — verify exact date).
  - Status badge: `SANCTION: PENDING` → updates to `SANCTIONED` / `APPEAL` / `FINAL` from `data/status.json`.
- One-paragraph plain-English summary of where the case stands today.
- "Latest" strip: newest 5 items from the timeline.

### 2.2 Timeline (2008 → today)
Vertical, filterable timeline. Filters: `Ownership`, `Transfers`, `Revenue/Finance`, `UEFA`, `Premier League case`, `Guardiola`, `Media reports`.
Each entry: date, title, 2–3 sentence summary, status tag, source link(s), club response (if any).

### 2.3 The 115 Charges — explained
- Breakdown by category with a chart (see seed data).
- Plain-English explanation of each category and which seasons it covers.
- A "What the rules say" box: Premier League Rule W.51 sanction range (reprimand → fine → points deduction → expulsion). Verify wording against the current PL Handbook.
- Comparison panel: other clubs' PSR/FFP sanctions (Everton, Nottingham Forest, Leicester etc.) — dates, breach, sanction, source. Label clearly that different rules/breaches apply.

### 2.4 The Spending — every major signing since 2008
- Sortable table: player, date, from club, fee (£/€), source, notes on controversy (record fee, reported side payments, etc.).
- Cumulative net-spend chart by season 2008-09 → present.
- "Controversy" flag only where a reputable outlet reported something specific — link it.

### 2.5 The Money — revenue, flows, FFP
- Revenue by season 2008-09 → latest annual report (line chart), split into matchday / broadcast / commercial where available.
- Wages, pre-tax profit/loss per season.
- Sponsorship section: major Abu Dhabi-linked commercial deals, when signed, reported value, and what the allegations/findings said about them. Clearly separate "reported deal value" from "allegation".
- City Football Group structure diagram (owners → CFG → clubs) with sources.
- UEFA FFP history: 2014 settlement, 2020 ban, CAS overturn — each sourced.

### 2.6 Guardiola — what he said, when
- Card per quote: date, context (press conference / match), exact quote, source.
- Ends with his May 2026 departure and his successor.
- Neutral note (as the press reported it): no suggestion he had awareness of alleged wrongdoing.

### 2.7 The Reporting — David Ornstein & key journalism
- Grid of **embedded tweets** using X's official embed (`blockquote.twitter-tweet` + `platform.twitter.com/widgets.js`), loaded from `data/ornstein.json` (list of tweet URLs + date + one-line summary).
- If an embed fails, fall back to a plain link card (date + summary + "View on X").
- Also a "Key articles" list: Der Spiegel / Football Leaks (2018), UEFA & CAS rulings, BBC / The Athletic / Guardian / Times coverage — title, outlet, date, link only (no copied article text).

### 2.8 Sources & Methodology
- Every source used, grouped by page.
- How status labels work.
- Corrections policy + contact email. Log every correction with a date.

---

## 3. Data files (create with this schema)

```
data/status.json        { charges_date, verdict_reported_date, sanction_status, appeal_status, last_updated }
data/timeline.json      [{ id, date, category, title, summary, status_tag, sources:[{outlet,date,url}], club_response }]
data/charges.json       [{ category, count, seasons, explanation, source }]
data/transfers.json     [{ player, date, from_club, fee_gbp, fee_eur, source_url, controversy_note, controversy_source }]
data/finance.json       [{ season, revenue_gbp, matchday, broadcast, commercial, wages, pretax_profit, source_url }]
data/quotes.json        [{ date, speaker, context, quote, source_url }]
data/ornstein.json      [{ tweet_url, date, summary }]
data/sanctions_compare.json [{ club, season, breach, sanction, date, source_url }]
```

---

## 4. Seed data (verified as at 26 Sept 2026 — re-check each before publishing)

**Ownership**
- 2008: Sheikh Mansour (UAE royal family) takes over the club.

**The case**
- Feb 2023: Premier League refers 115 alleged breaches to an independent commission, covering 2009-10 to 2017-18 (financial reporting) plus non-cooperation from 2018 onwards.
- Charge breakdown (ESPN): 54 failing to provide accurate financial information · 14 failing to disclose player & manager remuneration · 7 PSR breaches · 5 UEFA regulations incl. FFP · 35 failing to cooperate. (Total 115.)
- Remuneration charges include former manager Roberto Mancini's pay (reported by Goal / The Athletic).
- 16 Sept 2024: hearing opens in London; closing arguments early Dec 2024.
- Verdict delayed repeatedly through 2025–26 (Telegraph, Independent reports).
- Sept 2026 (reported Thursday 24 Sept, UK time — verify): David Ornstein (The Athletic) reports City found guilty on 114 of 115 charges. Sanctions undecided, club expected to appeal. His X post: "Manchester City found guilty on virtually all charges relating to breaches of Premier League financial regulations. #MCFC expected to appeal against verdict issued by independent commission. Sanctions undecided, process ongoing." (verify exact wording against the original post).
- Club response (to The Athletic, Sept 2026): process "remains ongoing … subject to strict confidentiality", position unchanged from Feb 2023.
- Club response (Feb 2023): welcomed an independent commission to consider its "comprehensive body of irrefutable evidence".
- At the time of the report, City were top of the Premier League under new head coach Enzo Maresca (Eastern Eye).

**UEFA**
- 2018: Der Spiegel publishes Football Leaks material on sponsorship arrangements.
- 2020: UEFA bans City from the Champions League for two years for overstating sponsorship revenue (2012–2016); CAS overturns the ban on appeal in 2020.

**Guardiola quotes**
- Feb 2023 (pre-Aston Villa press conference): "My first thought is that we are already being condemned." Also: "In the end, I know fairly that what we won we won on the pitch."
- Around 2024 (after contract extension): "People say 'what happens if we are relegated?' I will be here."
- Sept 2024 (before hearing): "An independent panel will decide. I'm looking forward to the decision." / "Everyone is innocent until guilt is proven."
- 2019 treble press conference, asked about Mancini-era payments: "Are you accusing me of receiving money?"
- May 2026 (before leaving): "I trust them. I spoke with them and trust how they behave and how they did."
- May 2026: Guardiola steps down after ten years; Enzo Maresca appointed on a three-year deal (mid-2026 — verify announcement date).

**Finance (club annual reports)**
- 2022-23: revenue £712.8m, profit £80.4m
- 2023-24: revenue £715.0m (record), pre-tax profit £73.8m, wages £412.6m
- 2024-25: revenue £694.1m, loss £9.9m (first revenue decline since 2019-20)
- Earlier seasons (2008-09 → 2021-22): research from annual reports + Deloitte Money League.
- Transfermarkt-cited estimate: ~€1.44bn spent on players over 2009–2018 (via SportBible) — use as context only, with source.

**Transfers to research (verify fee + source for each; add others)**
Robinho (2008), Carlos Tevez, Emmanuel Adebayor, Joleon Lescott, Yaya Touré, Sergio Agüero, Samir Nasri, Kevin De Bruyne, Raheem Sterling, John Stones, Kyle Walker, Aymeric Laporte, Riyad Mahrez, Rodri, Rúben Dias, Jack Grealish, Erling Haaland, Joško Gvardiol, Jérémy Doku, Omar Marmoush, Rayan Cherki, Tijjani Reijnders, Marc Guéhi, Antoine Semenyo.

**Also research and add**
- 2014 UEFA FFP settlement (fine + squad restrictions).
- Associated Party Transactions (APT) legal challenge by City vs the Premier League (2024–25) and outcome.
- Everton, Nottingham Forest, Leicester PSR sanctions for the comparison panel.

---

## 5. Build order

1. Scaffold repo, layout, dark/light theme, nav, footer disclaimer.
2. JSON schemas + seed data above.
3. Home clock + status badge.
4. Timeline page with filters.
5. Charges explainer + sanctions comparison.
6. Money page with charts.
7. Spending page with sortable table.
8. Guardiola quotes page.
9. Reporting page with X embeds + fallbacks.
10. Sources/methodology page.
11. SEO: meta tags, Open Graph image (text-only, no crests), sitemap, fast Lighthouse score.
12. README with update instructions.

After each step, run the site locally and check every link resolves.
