# Scrabble Solver

A free, ad-free Scrabble / Words With Friends word finder that runs entirely in the browser. No backend, no tracking, no "please disable your ad blocker" waiting screens.

Enter up to **12 letters** (use `?` or `-` for blank tiles, max 3) and get every playable word with its score, grouped by length.

## Features

- **Blank tiles** — `?` or `-`; blanks score 0 points and are highlighted in the results
- **Filters** — begins with, ends with, contains, max word length (2–15)
- **Scoring** — Scrabble or Words With Friends tile values
- **Sorting** — by score, length, or alphabetically
- **Definitions** — every word links to Wiktionary
- **Fast** — the full 172k-word dictionary is scanned in milliseconds, client-side
- Dark mode via `prefers-color-scheme`, mobile-friendly

## Word list

Uses [ENABLE](https://en.wikipedia.org/wiki/Enhanced_North_American_Benchmark_Lexicon) (public domain, ~173k words), which is also the basis of the Words With Friends dictionary. The official tournament lists (TWL/NWL, Collins/SOWPODS) are licensed and not bundled; to add one, drop a lowercase one-word-per-line `.txt` into `dict/` and point the fetch in `app.js` at it.

## Run locally

Any static file server works (ES modules require http, not `file://`):

```sh
npx serve .
# or
python3 -m http.server 8000
```

## Tests

```sh
node --test
```

## Deploy

Live at **https://jordan-schnur.github.io/scrabble-solver/**. Pushes to `main` deploy automatically: `.github/workflows/pages.yml` runs the tests, then syncs `main` to the `gh-pages` branch, which GitHub Pages serves. Note: on a free personal GitHub plan, Pages only works on **public** repositories.

## How it works

There's no clever algorithm needed at this scale: for each dictionary word, check that the rack's letter multiset (plus blanks covering any shortfall) contains the word's letters, then sum the tile values of the non-blank letters. 173k words × a cheap multiset check ≈ instant. See `solver.js`.
