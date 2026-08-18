// Core word-finding logic. Pure functions, no DOM — imported by both the
// browser app (app.js) and the node test suite.

export const TILE_VALUES = {
  scrabble: {
    a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1,
    m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8,
    y: 4, z: 10,
  },
  wwf: {
    a: 1, b: 4, c: 4, d: 2, e: 1, f: 4, g: 3, h: 3, i: 1, j: 10, k: 5, l: 2,
    m: 4, n: 2, o: 1, p: 4, q: 10, r: 1, s: 1, t: 1, u: 2, v: 5, w: 4, x: 8,
    y: 3, z: 10,
  },
};

export const MAX_RACK_LETTERS = 12;
export const MAX_BLANKS = 3;

// Parse raw user input into { letters: {a: 2, ...}, blanks: n }.
// '?' and '-' are blank tiles; anything not a-z is ignored.
export function parseRack(input) {
  const letters = {};
  let blanks = 0;
  let count = 0;
  for (const ch of String(input).toLowerCase()) {
    if (count >= MAX_RACK_LETTERS) break;
    if (ch === '?' || ch === '-') {
      if (blanks < MAX_BLANKS) {
        blanks++;
        count++;
      }
    } else if (ch >= 'a' && ch <= 'z') {
      letters[ch] = (letters[ch] || 0) + 1;
      count++;
    }
  }
  return { letters, blanks };
}

// Can `word` be built from the rack? Returns null if not, otherwise
// { blanksUsed, blankLetters } where blankLetters lists which letters the
// blanks stand in for (they score zero).
export function matchWord(word, rack) {
  let blanksLeft = rack.blanks;
  const blankLetters = [];
  const need = {};
  for (const ch of word) need[ch] = (need[ch] || 0) + 1;
  for (const ch in need) {
    const short = need[ch] - (rack.letters[ch] || 0);
    if (short > 0) {
      if (short > blanksLeft) return null;
      blanksLeft -= short;
      for (let i = 0; i < short; i++) blankLetters.push(ch);
    }
  }
  return { blanksUsed: rack.blanks - blanksLeft, blankLetters };
}

// Score a matched word: real tiles score face value, blanks score 0.
// Blanks only ever cover letters the rack lacks, so the assignment is forced.
export function scoreWord(word, blankLetters, values) {
  const blankPool = {};
  for (const ch of blankLetters) blankPool[ch] = (blankPool[ch] || 0) + 1;
  let score = 0;
  for (const ch of word) {
    if (blankPool[ch] > 0) {
      blankPool[ch]--;
    } else {
      score += values[ch] || 0;
    }
  }
  return score;
}

// Main entry: filter + score the dictionary against a rack and options.
// options: { beginsWith, endsWith, contains, maxLength, values }
export function solve(words, rackInput, options = {}) {
  const rack = parseRack(rackInput);
  const rackSize = Object.values(rack.letters).reduce((a, b) => a + b, 0) + rack.blanks;
  if (rackSize === 0) return [];

  const values = options.values || TILE_VALUES.scrabble;
  const beginsWith = (options.beginsWith || '').toLowerCase().replace(/[^a-z]/g, '');
  const endsWith = (options.endsWith || '').toLowerCase().replace(/[^a-z]/g, '');
  const contains = (options.contains || '').toLowerCase().replace(/[^a-z]/g, '');
  const maxLength = options.maxLength || 15;

  const results = [];
  for (const word of words) {
    if (word.length < 2 || word.length > maxLength || word.length > rackSize) continue;
    if (beginsWith && !word.startsWith(beginsWith)) continue;
    if (endsWith && !word.endsWith(endsWith)) continue;
    if (contains && !word.includes(contains)) continue;
    const match = matchWord(word, rack);
    if (!match) continue;
    results.push({
      word,
      score: scoreWord(word, match.blankLetters, values),
      blanks: match.blanksUsed,
      blankLetters: match.blankLetters,
      length: word.length,
    });
  }
  return results;
}

export function sortResults(results, by) {
  const sorted = [...results];
  if (by === 'az') {
    sorted.sort((a, b) => a.word.localeCompare(b.word));
  } else if (by === 'length') {
    sorted.sort((a, b) => b.length - a.length || b.score - a.score || a.word.localeCompare(b.word));
  } else {
    sorted.sort((a, b) => b.score - a.score || b.length - a.length || a.word.localeCompare(b.word));
  }
  return sorted;
}
