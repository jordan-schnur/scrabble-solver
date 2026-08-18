import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRack,
  matchWord,
  scoreWord,
  solve,
  sortResults,
  TILE_VALUES,
} from '../solver.js';

test('parseRack counts letters and blanks, ignoring junk', () => {
  const rack = parseRack('AbC? -z!!');
  assert.deepEqual(rack.letters, { a: 1, b: 1, c: 1, z: 1 });
  assert.equal(rack.blanks, 2);
});

test('parseRack caps at 12 tiles and 3 blanks', () => {
  const rack = parseRack('????aaaaaaaaaaaaaa');
  assert.equal(rack.blanks, 3);
  assert.equal(Object.values(rack.letters).reduce((a, b) => a + b, 0), 9);
});

test('matchWord succeeds with exact letters', () => {
  const rack = parseRack('cat');
  assert.deepEqual(matchWord('cat', rack), { blanksUsed: 0, blankLetters: [] });
  assert.deepEqual(matchWord('act', rack), { blanksUsed: 0, blankLetters: [] });
});

test('matchWord fails when a letter is missing and no blanks', () => {
  assert.equal(matchWord('cart', parseRack('cat')), null);
});

test('matchWord uses blanks for missing letters', () => {
  const m = matchWord('cart', parseRack('cat?'));
  assert.equal(m.blanksUsed, 1);
  assert.deepEqual(m.blankLetters, ['r']);
});

test('matchWord handles duplicate letters needing a blank', () => {
  const m = matchWord('llama', parseRack('lama?'));
  assert.equal(m.blanksUsed, 1);
  assert.deepEqual(m.blankLetters, ['l']);
});

test('scoreWord: blanks score zero', () => {
  const v = TILE_VALUES.scrabble;
  assert.equal(scoreWord('cat', [], v), 5); // c3 a1 t1
  assert.equal(scoreWord('cart', ['r'], v), 5); // r is a blank
  // two l's needed, one is a blank: l1 l0 a1 m3 a1 = 6
  assert.equal(scoreWord('llama', ['l'], v), 6);
});

test('scoreWord differs between Scrabble and WWF values', () => {
  assert.equal(scoreWord('jab', [], TILE_VALUES.scrabble), 12); // j8 a1 b3
  assert.equal(scoreWord('jab', [], TILE_VALUES.wwf), 15); // j10 a1 b4
});

test('solve finds and filters words', () => {
  const words = ['cat', 'act', 'cart', 'at', 'taco', 'a', 'catcall'];
  const results = solve(words, 'cato');
  const found = results.map((r) => r.word).sort();
  assert.deepEqual(found, ['act', 'at', 'cat', 'taco']);
});

test('solve respects beginsWith/endsWith/contains/maxLength', () => {
  const words = ['cat', 'act', 'taco', 'at'];
  assert.deepEqual(solve(words, 'cato', { beginsWith: 't' }).map((r) => r.word), ['taco']);
  assert.deepEqual(solve(words, 'cato', { endsWith: 't' }).map((r) => r.word).sort(), ['act', 'at', 'cat']);
  assert.deepEqual(solve(words, 'cato', { contains: 'ac' }).map((r) => r.word).sort(), ['act', 'taco']);
  assert.deepEqual(solve(words, 'cato', { maxLength: 3 }).map((r) => r.word).sort(), ['act', 'at', 'cat']);
});

test('solve returns nothing for an empty rack', () => {
  assert.deepEqual(solve(['cat'], '  !!'), []);
});

test('sortResults orders by score, length, or alphabetically', () => {
  const words = ['cat', 'act', 'taco', 'at'];
  const results = solve(words, 'cato');
  assert.equal(sortResults(results, 'score')[0].word, 'taco');
  assert.equal(sortResults(results, 'length')[0].word, 'taco');
  assert.equal(sortResults(results, 'az')[0].word, 'act');
});
