const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function outputForCandidate(candidate: number): Promise<string> {
  return sha256Hex(`entropy-collapse:toy-state:${candidate.toString(16).padStart(2, '0')}`);
}

export async function publicClueForOutput(output: string): Promise<string> {
  return sha256Hex(`entropy-collapse:public-clue:${output}`);
}

export async function publicClueForCandidate(candidate: number): Promise<string> {
  return publicClueForOutput(await outputForCandidate(candidate));
}

export function hexToBits(hex: string): string[] {
  return Array.from(hex).flatMap((digit) => (
    Number.parseInt(digit, 16).toString(2).padStart(4, '0').split('')
  ));
}

export function clueToTiles(clue: string, length = 12): string[] {
  return hexToBits(clue).slice(0, length);
}

export function searchDurationSeconds(
  bits: number,
  candidatesPerSecond: number,
  gpuCount: number,
  average = false,
): number {
  if (!Number.isFinite(bits) || bits < 0) {
    throw new RangeError('bits must be a finite, non-negative number');
  }

  if (!Number.isFinite(candidatesPerSecond) || candidatesPerSecond <= 0) {
    throw new RangeError('candidatesPerSecond must be a finite, positive number');
  }

  if (!Number.isInteger(gpuCount) || gpuCount <= 0) {
    throw new RangeError('gpuCount must be a positive integer');
  }

  const fullSpace = 2 ** bits;
  return (average ? fullSpace / 2 : fullSpace) / (candidatesPerSecond * gpuCount);
}

export function effectiveDiceBits(
  rolls: number,
  outputBitLimit: number,
): number {
  if (!Number.isInteger(rolls) || rolls < 0) {
    throw new RangeError('rolls must be a non-negative integer');
  }

  if (!Number.isFinite(outputBitLimit) || outputBitLimit <= 0) {
    throw new RangeError('outputBitLimit must be a finite, positive number');
  }

  return Math.min(rolls * Math.log2(6), outputBitLimit);
}

export function randomWordBits(words: number, wordListSize: number): number {
  if (!Number.isInteger(words) || words < 0) {
    throw new RangeError('words must be a non-negative integer');
  }

  if (!Number.isInteger(wordListSize) || wordListSize < 2) {
    throw new RangeError('wordListSize must be an integer of at least two');
  }

  return words * Math.log2(wordListSize);
}
