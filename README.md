# The 115 Ledger

A static, fully-sourced record of Manchester City's spending, revenues and
regulatory history — from the 2008 Abu Dhabi takeover to the Premier
League's 115-charges case.

**Unofficial. Not affiliated with any club, league or governing body.**

The full editorial brief (mission, rules, seed data, build order) lives in
[`CLAUDE.md`](./CLAUDE.md). This README is the practical "how do I..." guide
for running the site and keeping its data current.

## Tech stack

Plain HTML + CSS + vanilla JavaScript. No build step, no framework, no
external chart library. Every page fetches JSON from `/data/*.json` at load
time and renders itself — so almost every update to this site is a JSON
edit, not a code change.

## Running locally

Because pages load data with `fetch()`, opening an `.html` file directly
(`file://`) won't work — browsers block JSON fetches from `file://` for
security reasons. Serve the directory instead:

```bash
cd The115Ledger
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any other static server works too (`npx serve`, `php -S localhost:8000`, etc).

## Pages: landing vs. home

`index.html` (the site's root) is a graphic, motion-forward splash page —
it makes the pitch for the project and links into everything else. It is
not where the live case clock or "Latest" strip lives; that's `home.html`,
which every internal page's nav and logo link back to. If you're adding a
new fact to the "Latest" strip or the live counters, that's `data/timeline.json`
/ `data/status.json` as below — you don't need to touch `index.html` at all
unless you're changing the pitch itself.

## Project structure

```
index.html             -> landing/splash page (the site's root URL)
home.html, timeline.html, charges.html, spending.html,    -> the 8 in-app pages
money.html, guardiola.html, reporting.html, sources.html
css/style.css          -> all styles: layout, theme tokens, components
js/main.js             -> shared: theme toggle, mobile nav, nav-highlight
js/charts.js           -> shared inline-SVG chart builders (window.Charts)
js/landing.js          -> index.html: hero clock, fact strip, explore grid, quote preview
js/home.js             -> home.html: case clock, status badge, latest strip
js/timeline.js         -> timeline.html: filterable timeline
js/charges.js          -> charges.html: charge breakdown + sanctions table
js/money.js            -> money.html: 4 finance charts, sponsorships, CFG
js/spending.js         -> spending.html: sortable table + cumulative chart
js/guardiola.js        -> guardiola.html: quote cards + departure section
js/reporting.js        -> reporting.html: X embeds + key articles
js/sources.js          -> sources.html: aggregates sources from all data
data/*.json            -> every fact on the site — see below
data/NOTES.md          -> internal log of corrections + open verification
                           items from research (not shown on the site)
favicon.svg, og-image.png, sitemap.xml, robots.txt        -> SEO/meta assets
```

## Editorial rules (see `CLAUDE.md` section 0 for the full version)

1. **Every factual claim needs a source** — outlet, date, URL. If you can't
   source it, don't add it.
2. **Use precise status language**: `CHARGED / ALLEGED`, `FOUND (reported)`,
   `FOUND (published decision)`, `SANCTION PENDING`, `UNDER APPEAL`, `FINAL`.
   The exact meaning of each is on the [Sources & Methodology page](./sources.html)
   and duplicated as a glossary there — don't invent a new label.
3. **Include the club's response** next to major events, where one exists.
4. **No invented numbers.** Where sources disagree, say so (see the
   `controversy_note` / `note` pattern used throughout the data files).
5. **No club crests, logos, kit images or match photography.** Typography,
   charts and icons only — this includes any new OG image or favicon.
6. **No scraping** Transfermarkt, X/Twitter or paywalled sites. Everything
   is entered by hand with a `source_url`.

## How to update the data

Every page re-renders from its JSON automatically — **you don't need to
touch any `.html` or `.js` file to add a fact**, only the relevant file
below. Validate JSON after editing:

```bash
python3 -c "import json; json.load(open('data/FILE.json'))"
```

### Add a timeline event

Edit `data/timeline.json`, append an object:

```json
{
  "id": "2027-01-unique-slug",
  "date": "2027-01-15",
  "category": "Premier League case",
  "title": "Short headline",
  "summary": "2-3 sentence, neutral summary of what happened.",
  "status_tag": "FOUND (reported)",
  "sources": [
    { "outlet": "BBC Sport", "date": "2027-01-15", "url": "https://..." }
  ],
  "club_response": "Exact quoted statement, or null if none exists yet."
}
```

`category` must be one of: `Ownership`, `Transfers`, `Revenue/Finance`,
`UEFA`, `Premier League case`, `Guardiola`, `Media reports` — these are the
Timeline page's filter chips. `id` must be unique (it's used as the anchor
for deep links from the home page's "Latest" strip). The entry appears on
both the Home page (if it's one of the 5 newest) and the Timeline page
automatically, in chronological order.

### Add a signing / transfer

Edit `data/transfers.json`, append an object:

```json
{
  "player": "Player Name",
  "date": "2027-07-01",
  "from_club": "Selling Club",
  "fee_gbp": 45.0,
  "fee_eur": 52.0,
  "source_url": "https://...",
  "controversy_note": "Only if a named outlet reported something specific. Omit or use null otherwise.",
  "controversy_source": "https://... (or null)"
}
```

`fee_gbp` / `fee_eur` are in **£/€ millions** (e.g. `45.0` means £45m), not
raw currency units — this differs from `finance.json` below, which uses raw
pounds. It appears in the Spending page's sortable table and its cumulative
spend chart re-buckets it into a season automatically (a transfer from May
onward counts toward the upcoming season, matching how transfer windows are
reported in the press).

### Add a season of finance data

Edit `data/finance.json`, append an object (this one uses **raw pounds**,
not millions, e.g. `715000000` for £715m):

```json
{
  "season": "2025-26",
  "revenue_gbp": 715000000,
  "matchday": 75000000,
  "broadcast": 295000000,
  "commercial": 345000000,
  "wages": 415000000,
  "pretax_profit": 20000000,
  "source_url": "https://...",
  "note": "Optional — use for caveats like a non-standard reporting period."
}
```

`matchday` / `broadcast` / `commercial` / `wages` are all optional — omit a
field entirely (don't set it to `0` or `null` for "not reported", just leave
it out) if no source reports it; the Money page's wages chart marks missing
seasons "n/r" rather than drawing a misleading zero bar, and the revenue
split chart only includes seasons with all three of matchday/broadcast/
commercial present.

### Add a Guardiola quote

Edit `data/quotes.json`:

```json
{
  "date": "2027-02-01",
  "speaker": "Pep Guardiola",
  "context": "Where/when this was said.",
  "quote": "Exact wording, word for word.",
  "source_url": "https://..."
}
```

### Add an Ornstein (or other) X/Twitter post

Edit `data/ornstein.json`. **Only add a tweet URL you can personally verify
is real** (open it, or find it linked/quoted in a news article) — never
guess or construct a plausible-looking one:

```json
{
  "tweet_url": "https://x.com/David_Ornstein/status/1234567890",
  "date": "2027-02-01",
  "summary": "One-line, neutral summary of what the post says."
}
```

The Reporting page embeds it with X's official widget and automatically
falls back to a plain link card if the embed can't load.

### Add a key article

Edit `data/articles.json`:

```json
{
  "title": "Exact headline",
  "outlet": "Outlet name",
  "date": "2027-02-01",
  "url": "https://..."
}
```

### Add a sanctions-comparison entry (other clubs' PSR/FFP cases)

Edit `data/sanctions_compare.json`:

```json
{
  "club": "Club Name",
  "season": "2026-27",
  "breach": "What rule/threshold was breached.",
  "sanction": "What sanction was applied.",
  "date": "2027-01-01",
  "source_url": "https://..."
}
```

### Add a sponsorship deal

Edit `data/sponsorships.json`. Note the `_html` suffix fields carry small,
hand-authored inline links (e.g. `<a href="...">Outlet</a>`) rather than
plain text — this is the one place in the data files where that's allowed,
since it's site-authored content, not user input:

```json
{
  "sponsor": "Sponsor Name",
  "covers": "What the deal covers.",
  "signed": "When it was signed.",
  "reported_value_html": "Reported as <strong>£Xm</strong>, per <a href=\"https://...\" rel=\"noopener\" target=\"_blank\">Outlet</a>.",
  "allegation_html": "Only if a specific, sourced allegation exists — otherwise use null. Same inline-link pattern."
}
```

### Update City Football Group's structure

Edit `data/cfg.json` directly — `summary_html` (same trusted-HTML pattern as
above), `ownership_breakdown` (array of `{holder, pct, source, source_url}`),
and `clubs` (array of `{name, country, stake, note?}` — set `note` when a
club has been divested, rather than deleting the historical entry).

### Update the case status (home page clock / badge)

Edit `data/status.json`. `sanction_status` drives the home page's badge and
must be one of `SANCTION PENDING`, `SANCTIONED`, `UNDER APPEAL`, `FINAL`.
`charges_date` and `verdict_reported_date` drive the two "days since"
counters.

### Log a correction

If you fix a previously-published fact (not just filling in something that
was always blank), add an entry to `data/corrections.json` so it shows up
in the public corrections log on the Sources & Methodology page:

```json
{ "date": "2027-01-15", "description": "What was wrong and what it's now." }
```

### Re-verify before publishing

Per the editorial rules, re-verify any date, fee or quote with a fresh web
search before publishing it, especially anything time-sensitive. Check
`data/NOTES.md` first — it tracks known low-confidence items and past
corrections so you don't re-research the same gap twice.

## Deploying

The site is plain static files — no build step. Two supported options:

**GitHub Pages** (simplest): repo Settings → Pages → Source: "Deploy from a
branch" → Branch: `main`, folder `/ (root)`. The included `.nojekyll` file
stops GitHub from running Jekyll over the site. It will be served at
`https://<owner>.github.io/<repo>/` unless a custom domain is configured —
if you do add a custom domain, update the URLs in every page's `<link
rel="canonical">` / `og:url` tags, `sitemap.xml` and `robots.txt` to match.

**Cloudflare Pages**: connect the repo, framework preset "None", build
command empty, output directory `/`.

## Checking your changes

After editing any data file:

1. Validate the JSON (see the one-liner above).
2. Run a local server (see "Running locally") and open the relevant page.
3. Check the browser console for errors.
4. Confirm every new link actually resolves.
