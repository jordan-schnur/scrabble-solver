import { solve, sortResults, parseRack, TILE_VALUES } from './solver.js';

const $ = (id) => document.getElementById(id);
const rackEl = $('rack');
const statusEl = $('status');
const resultsEl = $('results');

let words = null;
let loading = null;

function loadDictionary() {
  if (!loading) {
    statusEl.textContent = 'Loading dictionary…';
    loading = fetch('dict/enable1.txt')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        words = text.split('\n').map((w) => w.trim()).filter(Boolean);
        statusEl.textContent = '';
        return words;
      })
      .catch((err) => {
        loading = null;
        statusEl.textContent = `Could not load the dictionary (${err.message}). Reload to retry.`;
        throw err;
      });
  }
  return loading;
}

// Populate max-length select (2–15, default 15).
const maxlenEl = $('maxlen');
for (let n = 2; n <= 15; n++) {
  const opt = document.createElement('option');
  opt.value = String(n);
  opt.textContent = String(n);
  if (n === 15) opt.selected = true;
  maxlenEl.appendChild(opt);
}

function renderWord(result) {
  // Mark which tiles render as blanks: the letters blanks stand in for.
  const blankPool = {};
  for (const ch of result.blankLetters) blankPool[ch] = (blankPool[ch] || 0) + 1;

  const a = document.createElement('a');
  a.className = 'word';
  a.href = `https://en.wiktionary.org/wiki/${result.word}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.title = `Look up “${result.word}” on Wiktionary`;

  const tiles = document.createElement('span');
  tiles.className = 'tiles';
  for (const ch of result.word) {
    const t = document.createElement('span');
    t.textContent = ch;
    if (blankPool[ch] > 0) {
      blankPool[ch]--;
      t.className = 'tile blank';
      t.title = 'blank tile (0 points)';
    } else {
      t.className = 'tile';
    }
    tiles.appendChild(t);
  }
  a.appendChild(tiles);

  const pts = document.createElement('span');
  pts.className = 'pts';
  pts.textContent = `${result.score} pts`;
  a.appendChild(pts);
  return a;
}

function render(results, sortBy) {
  resultsEl.textContent = '';
  if (results.length === 0) {
    statusEl.textContent = 'No words found — try adding a blank (?) or loosening the filters.';
    return;
  }
  statusEl.textContent = `${results.length.toLocaleString()} word${results.length === 1 ? '' : 's'} found`;

  const sorted = sortResults(results, sortBy);
  // Group by length (longest first) so the list stays scannable.
  const groups = new Map();
  for (const r of sorted) {
    if (!groups.has(r.length)) groups.set(r.length, []);
    groups.get(r.length).push(r);
  }
  const lengths = [...groups.keys()].sort((a, b) => b - a);

  for (const len of lengths) {
    const section = document.createElement('section');
    section.className = 'group';
    const h = document.createElement('h2');
    h.textContent = `${len} letters (${groups.get(len).length})`;
    section.appendChild(h);
    const list = document.createElement('ul');
    list.className = 'words';
    for (const r of groups.get(len)) {
      const li = document.createElement('li');
      li.appendChild(renderWord(r));
      list.appendChild(li);
    }
    section.appendChild(list);
    resultsEl.appendChild(section);
  }
}

async function run() {
  const rackInput = rackEl.value;
  const rack = parseRack(rackInput);
  const size = Object.values(rack.letters).reduce((a, b) => a + b, 0) + rack.blanks;
  if (size < 2) {
    statusEl.textContent = 'Enter at least 2 letters.';
    resultsEl.textContent = '';
    return;
  }
  await loadDictionary();
  const results = solve(words, rackInput, {
    beginsWith: $('begins').value,
    endsWith: $('ends').value,
    contains: $('contains').value,
    maxLength: Number(maxlenEl.value),
    values: TILE_VALUES[$('game').value] || TILE_VALUES.scrabble,
  });
  render(results, $('sort').value);
}

$('solver-form').addEventListener('submit', (e) => {
  e.preventDefault();
  run().catch(() => {});
});

// Re-run automatically when a filter changes and results are showing.
for (const id of ['begins', 'ends', 'contains', 'maxlen', 'game', 'sort']) {
  $(id).addEventListener('change', () => {
    if (rackEl.value.trim()) run().catch(() => {});
  });
}

// Start fetching the dictionary in the background so first solve is instant.
loadDictionary().catch(() => {});
