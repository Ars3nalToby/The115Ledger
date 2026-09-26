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

## Research environment note

The research agents' WebFetch tool was blocked by the network egress proxy for
nearly all news domains (only WebSearch worked); facts above rest on search
result snippets rather than full primary-source reads except where a snippet
itself quoted the source verbatim. Re-verify high-stakes items (exact rule
text, exact quotes) with direct access before final publication, per
CLAUDE.md rule 8.
