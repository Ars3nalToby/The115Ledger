# Data verification notes (step 2)

Internal tracking file — not site content. Logs corrections made to the CLAUDE.md
seed data during research, and items still flagged for a follow-up verification
pass before publishing as fact. Feeds the eventual Sources & Methodology page
(corrections policy, section 2.8).

## Corrections made to seed data

- **Verdict reported date**: seed guessed "Thursday 24 Sept 2026"; corroborated
  sources (CNN, Al Jazeera, Bloomberg, Ornstein's own X post) place it on
  **Friday 25 September 2026**. Used 2026-09-25 throughout.
- **€1.44bn / SportBible transfer-spend claim**: could not find a real SportBible
  article stating this figure. Not included on the site. A sourced alternative
  exists — Goal.com reports **£1.243bn spent on 76 signings, 2009-10 to 2017-18**
  (the exact period the 115 charges cover) — https://www.goal.com/en/news/more-than-a-billion-pounds-and-76-deals-manchester-city-s-huge-spending-during-the-sanctions-period/blt0d4c5fdb89699022
  — use this instead, clearly labelled as press-reported/Transfermarkt-derived,
  not an official club figure, when building the Money page.
- **2023-24 wages**: confirmed £412.6m as seed stated. **2024-25 wages** are
  **£408.4m** (a decrease) — do not reuse the 2023-24 figure for 2024-25.
- **Guéhi and Semenyo**: both transfers are real and completed in January 2026
  (Semenyo from Bournemouth £64m on 9 Jan 2026; Guéhi from Crystal Palace £20m
  initial on 19 Jan 2026) — included in transfers.json, not omitted.
- **Maresca appointment date**: two independent outlets (Sky Sports, Al Jazeera)
  date the appointment 29 June 2026; some other source patterns suggest
  22/26 May 2026. Used 29 June 2026 pending a direct mancity.com check.

## Still flagged — verify before publishing as unqualified fact

1. **PL Rule W.51 exact wording** — not read directly from the PL Handbook
   (network access to premierleague.com/pulselive PDFs was blocked in the
   research sandbox). Only journalist citations of the rule number/range were
   found (The Athletic, BBC's Dan Roan). Get the verbatim Handbook text before
   quoting the rule directly on the Charges page.
2. **Several exact press-conference dates for Guardiola quotes** are estimates
   (Feb 2023 "condemned" quote, Sept 2024 "innocent" quotes) — cross-check
   against City's actual fixture list for those months.
3. **Exact wording of "innocent until guilt is proven"** — outlets disagree
   between "proven guilty" and "guilt is proven". quotes.json uses the more
   directly-quoted besoccer.com version; verify against a primary transcript.
4. **Manchester City's Nov 2018 statement** responding to the Der Spiegel/
   Football Leaks documents — exact wording not located. Add before
   publishing that event on the timeline with a club_response.
5. **Manchester City's exact Sept 2026 statement to The Athletic** — corroborated
   in substance ("process remains ongoing... subject to strict confidentiality")
   via secondary coverage; The Athletic's original piece is paywalled and
   wasn't independently opened. Re-verify exact wording/attribution.
6. **APT tribunal ruling exact dates** (Feb 2025 "rules void" ruling; Sept 2025
   settlement) — only the month is corroborated for each, not the exact day.
7. **Sheikh Mansour takeover date** — "announced" 1 Sept 2008 vs "completed"
   23 Sept 2008 both appear in reporting; decide which the timeline should
   anchor on.
8. **BBC / Guardian / Times / The Athletic direct article URLs** for the
   Sept 2026 verdict coverage were not found via search (only CNN, Al Jazeera
   and Bloomberg URLs were confirmed as fetchable/real). Search those outlets
   directly for articles.json before treating the "key articles" list as
   complete.
9. **Other Ornstein tweets** on this case (Feb 2023 charges, Sept 2024 hearing
   opening, Dec 2024 closing arguments) are referenced in press coverage but
   no verifiable direct tweet URL was found for any of them — ornstein.json
   intentionally contains only the one confirmed URL rather than a guessed one.
10. **2008-09 revenue, 2012-13/2013-14 wages** — sources conflict or don't
    fully reconcile (see notes embedded in finance.json). Recommend pulling
    the actual Companies House-filed accounts for 2008-09 through 2013-14 to
    firm these up.
11. **Other major signings not yet researched to this standard** (flagged by
    the transfers researcher, not yet added): Ederson (2017), Bernardo Silva
    (2017), Nathan Aké (2020), Julián Álvarez (2022), Mateo Kovačić (2023),
    Vitor Reis & Abdukodir Khusanov (Jan 2025), Matheus Nunes (2023). Add in a
    follow-up pass if the Spending page should be more exhaustive.
12. **Etihad's alleged owner-funded share** (data/sponsorships.json) — two
    secondary summaries of the Nov 2018 Der Spiegel/Football Leaks reporting
    give slightly different figures (£59.5m vs £59.9m funded by ADUG against
    the ~£67.5m annual fee, with £8m from Etihad directly). Pull the original
    Der Spiegel or Guardian Nov 2018 article directly to resolve before citing
    an exact figure elsewhere on the site.
13. **Etisalat and First Abu Dhabi Bank sponsorship values** — no standalone
    reported £ figure was found for either (only a combined ~£120m/4-sponsor
    figure for Etisalat's FY2012-13 era); sponsorships.json says so explicitly
    rather than estimating.
14. **The reported "close to £1bn" new Etihad deal** (post-Sept-2025 APT
    settlement) is explicitly reported as undisclosed/unconfirmed by SportsPro;
    higher figures (up to £1.75bn) appeared only on low-tier aggregator sites
    and were deliberately excluded.
15. **CFG ownership percentages** (ADUG 81% / Silver Lake 18% / CMC+CITIC 1%,
    $4.8bn 2019 valuation) rest on WebSearch snippets of SportsPro/Gulf
    News/SI.com, not a direct primary-source read (WebFetch was blocked for
    all of these domains in the research sandbox) — re-verify against CFG's
    own disclosures or Companies House before treating as exact.
16. **Montevideo City Torque and Club Bolívar's exact CFG stakes** could not
    be confirmed — data/cfg.json lists them with "stake not confirmed" rather
    than a guessed percentage.
17. **CFG's Yokohama F. Marinos and Mumbai City holdings**: CLAUDE.md's
    original seed brief listed these as current CFG clubs, but research found
    both were divested (Mumbai City ~Dec 2025, Yokohama F. Marinos ~June
    2026) — data/cfg.json lists them as former clubs. Re-verify the exact
    divestment dates against CFG's own announcements if precision matters.

18. **data/scale.json (The Money page, "The Scale" section)** — every figure
    was confirmed via WebSearch result text only; the source pages themselves
    could not be opened (WebFetch was blocked for Deloitte, Goal, FourFourTwo,
    Top Gear and others). Lowest-confidence items, re-verify against primary
    sources before treating as exact:
    - Stadium build costs (Emirates £390m, Wembley £798m final / £757m budget,
      Etihad £112m, Tottenham ~£1bn) are cited to Wikipedia / StadiumDB /
      Designing Buildings / SI.com; no club or contractor primary source was
      read. Tottenham has published no final figure (reports run higher than
      £1bn); the low end is used on purpose.
    - Real Madrid 2024-25 matchday (€233m) and commercial (€594m) came from
      search snippets of Deloitte's Money League 2026 coverage; broadcast
      (€334m) is computed as the remainder, not a reported number.
    - Tesla Model 3 Standard £37,990 UK list price (2026) can change.
    - City's average home attendance (52,519) is from a Wikipedia season page;
      another compilation showed 53,636 but its season was unclear, so it was
      not used.
    - The press transfer-spend estimate (€3.14bn spent / €1.37bn recouped /
      €1.77bn net) is a Sept 2023 Transfermarkt-derived figure via Football
      Transfers. Context only; never use it for the site's own totals.
19. **The site's own "£1.14bn" total is a floor**: it sums the 24 signings in
    data/transfers.json only. It grows automatically as transfers are added.
20. **2026-09-29 — verdict-reported club_response tidied**: removed an internal
    "re-verify exact wording" note from public copy after confirming the
    quoted sentence across multiple outlets (The Independent via LiveScore,
    CNN, ESPN coverage). The rest of the club's statement was only seen
    truncated in search text, so only the confirmed first sentence is quoted
    and the remainder is paraphrased. The Feb 2023 charge-stage response still
    carries a similar "re-verify" note — not yet tidied.

21. **2026-09-29 — Premier League statement on the commission's decision.**
    Added as timeline entry 2026-09-29-premier-league-statement, tagged
    `FOUND (reported)` (NOT "published decision"). The statement page
    (premierleague.com/en/news/4727779) was blocked in the research
    environment, so wording rests on coverage from RTÉ, the Irish News, CBS
    Sports and Al Jazeera (search text, pages not opened). OPEN ITEMS before
    treating this entry as final:
    - **Charge count/scope conflict — RESOLVED 2 Oct**: later coverage (Sky
      Sports, Euronews, CBS Sports "114 violations", ESPN) says all but one of
      the charges: every financial-rules charge for 2009-10 to 2017-18 and
      three of four cooperation charges. The earlier "all 115" headlines were
      imprecise (logged in data/corrections.json).
    - **Written reasons**: confirm whether the commission's full decision is
      published. If yes, retag `FOUND (published decision)`, link the document,
      and update home.html's case summary and the Money page status box.
    - **"Sham" deals / £900m**: the wording is the statement's as reported;
      attribute it that way and re-verify against the statement itself.
    - **Club response**: only the phrase "disappointed and surprised by the
      opinion of the Premier League Commission" was seen; the full statement
      was not.
    - **Appeal deadline (2 Oct 2026)**: drives the countdown banner via
      data/status.json (appeal_deadline). Update status.json and the banner
      the moment an appeal is lodged or the window closes.
    - The 25 Sept entry and its "114 of 115" headline are kept as history.

22. **2026-10-02 — City appeal lodged.** Timeline entry
    2026-10-01-appeal-lodged (UNDER APPEAL). Sources: the Premier League's 2
    Oct statement page plus Al Jazeera, Euronews, Sky Sports, CBS Sports and
    ABC News. None of these pages could be opened here; facts rest on search
    text from several outlets agreeing. Details to re-verify against the
    statement: lodged 7pm Thursday 1 Oct (Al Jazeera); three-member Appeal
    Board; hearing expected within 12 weeks and decision within 30 days of the
    hearing ending (reported rule); hearing private until the outcome may be
    published. The banner's clock ends 24 Dec 2026, computed as 1 Oct + 84
    days, NOT a reported date. The club's statement wording on the appeal
    ("clear material errors of law, principle and fact", "irrefutable
    evidence") is from coverage and is paraphrased on the site, not quoted.
    The Appeal Board hearing is private, so outcome timing will only be known
    once published. Still open: whether the commission's written opinion is
    public (retag FOUND (published decision) if so).

## Research environment note

The research agents' WebFetch tool was blocked by the network egress proxy for
nearly all news domains (only WebSearch worked); facts above rest on search
result snippets rather than full primary-source reads except where a snippet
itself quoted the source verbatim. Re-verify high-stakes items (exact rule
text, exact quotes) with direct access before final publication, per
CLAUDE.md rule 8.
