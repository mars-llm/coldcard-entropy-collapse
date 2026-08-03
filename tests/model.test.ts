import { describe, expect, it } from 'vitest';
import {
  clueToTiles,
  effectiveDiceBits,
  hexToBits,
  outputForCandidate,
  publicClueForCandidate,
  publicClueForOutput,
  randomToyCandidate,
  randomWordBits,
  searchDurationSeconds,
} from '../lib/model';

describe('toy candidate model', () => {
  it('is deterministic for the same candidate', async () => {
    expect(await outputForCandidate(43)).toBe(await outputForCandidate(43));
  });

  it('changes when the candidate changes', async () => {
    expect(await outputForCandidate(43)).not.toBe(await outputForCandidate(44));
  });

  it('validates a candidate through a deterministic public clue', async () => {
    const output = await outputForCandidate(43);
    expect(await publicClueForCandidate(43)).toBe(await publicClueForOutput(output));
  });

  it('expands a SHA-256 digest into 256 visible bits', async () => {
    expect(hexToBits(await outputForCandidate(43))).toHaveLength(256);
  });

  it('turns a clue into a short visual pattern without changing the comparison value', async () => {
    const clue = await publicClueForCandidate(43);
    expect(clueToTiles(clue)).toHaveLength(12);
    expect(clue).toHaveLength(64);
  });

  it('keeps every 24-bit display pattern unique inside the 64-candidate model', async () => {
    const patterns = await Promise.all(
      Array.from({ length: 64 }, async (_, candidate) => (
        clueToTiles(await publicClueForCandidate(candidate), 24).join('')
      )),
    );

    expect(new Set(patterns)).toHaveLength(64);
  });

  it('chooses a fresh candidate inside the toy space', () => {
    const previous = 43;
    const candidates = Array.from({ length: 128 }, () => randomToyCandidate(64, previous));

    expect(candidates.every((candidate) => candidate >= 0 && candidate < 64)).toBe(true);
    expect(candidates).not.toContain(previous);
  });

  it('rejects invalid toy spaces and exclusions', () => {
    expect(() => randomToyCandidate(1)).toThrow(RangeError);
    expect(() => randomToyCandidate(64, 64)).toThrow(RangeError);
  });
});

describe('attack-scale calculations', () => {
  it('converts a bit space and candidate rate into exhaustive search time', () => {
    expect(searchDurationSeconds(32, 2 ** 32, 1)).toBe(1);
    expect(searchDurationSeconds(32, 2 ** 32, 100)).toBe(0.01);
  });

  it('uses half the space for an average single-target search', () => {
    expect(searchDurationSeconds(32, 2 ** 32, 1, true)).toBe(0.5);
  });

  it('caps dice entropy at the final seed size', () => {
    expect(effectiveDiceBits(50, 128)).toBe(128);
    expect(effectiveDiceBits(200, 256)).toBe(256);
  });

  it('calculates entropy for uniformly selected words', () => {
    expect(randomWordBits(4, 7_776)).toBeCloseTo(51.699, 3);
    expect(randomWordBits(6, 7_776)).toBeCloseTo(77.549, 3);
  });

  it('rejects invalid attack-model inputs', () => {
    expect(() => searchDurationSeconds(40, 0, 1)).toThrow(RangeError);
    expect(() => effectiveDiceBits(-1, 256)).toThrow(RangeError);
    expect(() => randomWordBits(6, 1)).toThrow(RangeError);
  });
});
