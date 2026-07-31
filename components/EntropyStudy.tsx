'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ExternalLink, RotateCcw } from 'lucide-react';
import {
  clueToTiles,
  hexToBits,
  outputForCandidate,
  publicClueForCandidate,
  publicClueForOutput,
} from '../lib/model';

const TARGET_CANDIDATE = 43;
const TOY_SPACE = 64;

const STAGES = [
  {
    label: '1',
    nav: 'Create a secret',
    title: 'A cold wallet starts by making a secret.',
    body: 'It uses randomness to create the recovery phrase and the keys that follow from it.',
    action: 'Continue',
  },
  {
    label: '2',
    nav: 'Weak fallback',
    title: 'Affected firmware could fall back to weak randomness.',
    body: 'The wallet still produced a recovery phrase, but the number of possible secrets was too small.',
    action: 'Continue',
  },
  {
    label: '3',
    nav: 'Test a guess',
    title: 'A public address can confirm a recreated secret.',
    body: 'An attacker tries each possible secret and checks the resulting address. A match identifies the wallet.',
    action: 'Run the example',
  },
] as const;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export function EntropyStudy() {
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [output, setOutput] = useState('');
  const [targetClue, setTargetClue] = useState('');
  const [candidate, setCandidate] = useState<number | null>(null);
  const [candidateClue, setCandidateClue] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const searchRun = useRef(0);

  useEffect(() => {
    let active = true;

    void outputForCandidate(TARGET_CANDIDATE).then(async (targetOutput) => {
      const clue = await publicClueForOutput(targetOutput);
      if (!active) return;
      setOutput(targetOutput);
      setTargetClue(clue);
    });

    return () => {
      active = false;
    };
  }, []);

  const outputBits = useMemo(() => hexToBits(output), [output]);
  const targetPattern = useMemo(() => clueToTiles(targetClue), [targetClue]);
  const candidatePattern = useMemo(() => clueToTiles(candidateClue), [candidateClue]);
  const currentStage = STAGES[stage];

  const resetSearch = () => {
    searchRun.current += 1;
    setSearching(false);
    setCandidate(null);
    setCandidateClue('');
    setFound(false);
  };

  const selectStage = (nextStage: number) => {
    resetSearch();
    setStage(nextStage);
  };

  const runSearch = async () => {
    const run = searchRun.current + 1;
    searchRun.current = run;
    setSearching(true);
    setFound(false);
    setCandidate(null);
    setCandidateClue('');

    for (let index = 0; index < TOY_SPACE; index += 1) {
      if (searchRun.current !== run) return;

      const clue = await publicClueForCandidate(index);
      setCandidate(index);
      setCandidateClue(clue);

      if (!shouldReduceMotion) await wait(34);

      if (clue === targetClue) {
        setFound(true);
        setSearching(false);
        return;
      }
    }

    setSearching(false);
  };

  const continueStudy = () => {
    if (stage < STAGES.length - 1) {
      selectStage(stage + 1);
      return;
    }

    void runSearch();
  };

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="grid h-14 grid-cols-[1fr_auto] items-center gap-4 border-b border-white/10 px-4 sm:grid-cols-[1fr_auto_1fr] md:px-8">
        <a
          href="https://mars-llm.github.io/hal-finney-trading-algorithms/"
          className="flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-white"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Cryptographic Arts</span>
          <span className="sr-only sm:hidden">Return to Cryptographic Arts</span>
        </a>
        <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted sm:block">
          Security case study / 01
        </p>
        <p className="justify-self-end font-serif text-sm uppercase tracking-[0.16em] text-white">
          Entropy Collapse
        </p>
      </header>

      <main>
        <section className="px-4 py-9 md:px-8 md:py-14">
          <div className="mx-auto max-w-6xl">
            <header className="max-w-3xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                Cold storage security case study / 30 July 2026
              </p>
              <h1 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                How a weak random-number fallback exposed cold wallets.
              </h1>
              <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                Cold storage keeps a wallet&apos;s secret offline. It cannot protect a secret that was predictable when the wallet created it. This case study explains the seed-generation fault found in affected COLDCARD firmware after a coordinated sweep on 30 July 2026.
              </p>
            </header>

            <div className="mt-10 border-y border-white/15">
              <ol className="grid grid-cols-3 border-b border-white/15" aria-label="Explanation progress">
                {STAGES.map((item, index) => (
                  <li key={item.label} className="border-r border-white/10 last:border-r-0">
                    <button
                      type="button"
                      onClick={() => selectStage(index)}
                      className={`flex min-h-[4.5rem] w-full items-center gap-3 px-3 text-left transition-colors sm:px-5 ${
                        index === stage ? 'bg-white/[0.06] text-white' : 'text-ink-muted hover:text-white'
                      }`}
                      aria-current={index === stage ? 'step' : undefined}
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] ${
                          index === stage ? 'border-accent bg-accent text-white' : 'border-white/20'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="font-serif text-xs leading-tight sm:text-base">{item.nav}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <div className="grid gap-6 border-b border-white/15 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
                <motion.div
                  key={stage}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Step {currentStage.label} of 3</p>
                  <h2 className="mt-3 max-w-2xl font-serif text-2xl leading-snug text-white sm:text-3xl">
                    {currentStage.title}
                  </h2>
                  <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                    {currentStage.body}
                  </p>
                </motion.div>

                <div className="flex items-center gap-3">
                  {stage > 0 && (
                    <button
                      type="button"
                      onClick={() => selectStage(stage - 1)}
                      className="flex min-h-11 items-center gap-2 px-3 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-white"
                    >
                      <ArrowLeft size={13} aria-hidden="true" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={continueStudy}
                    disabled={searching || (stage === 2 && !targetClue)}
                    className="flex min-h-11 items-center gap-3 border border-white/40 bg-white px-4 font-mono text-[9px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-50"
                  >
                    {searching ? 'Checking' : found ? 'Run again' : currentStage.action}
                    {found ? <RotateCcw size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="min-h-[24rem] bg-[#0a0a0a] p-5 sm:p-8">
                <motion.div
                  key={stage}
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                >
                  {stage === 0 && <RandomBeginning bits={outputBits} />}
                  {stage === 1 && <LimitedBeginnings bits={outputBits} />}
                  {stage === 2 && (
                    <CandidateSearch
                      candidate={candidate}
                      candidatePattern={candidatePattern}
                      found={found}
                      searching={searching}
                      targetPattern={targetPattern}
                    />
                  )}
                </motion.div>
              </div>
            </div>

            <p className="mt-7 max-w-3xl border-l-2 border-accent pl-4 font-serif text-lg leading-relaxed text-ink">
              The wallet can stay offline. If someone can recreate its starting secret, they can recreate its keys elsewhere.
            </p>
          </div>
        </section>

        <section id="owner-guidance" className="border-y border-accent/60 bg-accent/[0.10] px-4 py-10 md:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">For affected owners</p>
              <h2 className="mt-2 font-serif text-2xl text-white">Own an affected COLDCARD?</h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
                Coinkite&apos;s official advisory has the current migration guidance.
              </p>
            </div>
            <a
              href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-3 bg-white px-5 font-mono text-[9px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink"
            >
              Open the official advisory
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </section>

        <details className="group border-b border-white/10 bg-white/[0.035] px-4 md:px-8">
          <summary className="mx-auto flex min-h-28 max-w-6xl cursor-pointer list-none items-center justify-between gap-6 py-5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Research record</p>
              <p className="mt-2 font-serif text-xl text-white">Sources and technical detail</p>
              <p className="mt-2 font-sans text-sm text-ink-muted">Published analysis, the official advisory, firmware source, and incident records.</p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center border border-accent/70 font-mono text-lg text-white transition-colors group-hover:bg-accent group-open:bg-accent group-open:text-white" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="mx-auto max-w-6xl border-t border-white/10 py-7">
            <div className="max-w-3xl space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
              <p>
                This model uses SHA-256 and 64 toy beginnings. It does not create wallet material, derive Bitcoin addresses, or reproduce COLDCARD firmware.
              </p>
              <p>
                The original fault was in seed generation. An air gap, a secure element, or a durable backup can protect against other failures, but none can change a wallet&apos;s starting randomness after it has been created.
              </p>
              <p>
                The links below include the published analyses, the official migration advisory, firmware source, and the on-chain records discussed by researchers.
              </p>
            </div>
            <div className="mt-7 grid border-t border-white/10 sm:grid-cols-2">
              <SourceLink label="Block analysis" href="https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware" />
              <SourceLink label="Coinkite backgrounder" href="https://blog.coinkite.com/entropy-technical-backgrounder/" />
              <SourceLink label="Coinkite migration advisory" href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/" />
              <SourceLink label="COLDCARD firmware source" href="https://github.com/Coldcard/firmware" />
              <SourceLink label="Bitcoin.org Android RNG alert" href="https://bitcoin.org/en/alert/2013-08-11-android" />
              <SourceLink label="BIP-39 specification" href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki" />
              <SourceLink label="Reported collection address" href="https://mempool.space/address/bc1qnk4zh9qcnap2mycp56qjrgza3cc8ylrh8fecp0" />
              <SourceLink label="Reported consolidation transaction" href="https://mempool.space/tx/0c6bf853a645b699a3b2cd6d8e3c44cf1a02a16f538df08212a44753f75d9d01" />
            </div>
          </div>
        </details>
      </main>

      <footer className="flex flex-col gap-2 px-4 py-4 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted sm:flex-row sm:items-center sm:justify-between md:px-8">
        <span>Independent educational explanation. Not affiliated with Coinkite or COLDCARD.</span>
        <span>Developed by Marsmensch, 2026.</span>
      </footer>
    </div>
  );
}

function RandomBeginning({ bits }: { bits: string[] }) {
  return (
    <div className="grid min-h-[21rem] items-center gap-8 lg:grid-cols-[0.7fr_auto_1.3fr]">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Many possible beginnings</p>
        <div className="mt-7 grid grid-cols-10 gap-2" aria-hidden="true">
          {Array.from({ length: 60 }, (_, index) => (
            <motion.span
              key={index}
              className="aspect-square rounded-full bg-white"
              animate={{ opacity: [0.08, 0.7, 0.08] }}
              transition={{ duration: 1.8 + (index % 5) * 0.22, delay: (index % 11) * 0.08, repeat: Number.POSITIVE_INFINITY }}
            />
          ))}
        </div>
      </div>

      <ArrowRight className="hidden text-ink-muted lg:block" size={20} strokeWidth={1.2} aria-hidden="true" />

      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Wallet secret</p>
        <BitField bits={bits} />
      </div>
    </div>
  );
}

function LimitedBeginnings({ bits }: { bits: string[] }) {
  return (
    <div className="grid min-h-[21rem] items-center gap-8 lg:grid-cols-[0.7fr_auto_1.3fr]">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Small model</p>
        <p className="mt-3 font-serif text-2xl text-white">64 possible beginnings</p>
        <div className="mt-6 grid grid-cols-8 gap-2" aria-label="Sixty-four possible starting states">
          {Array.from({ length: TOY_SPACE }, (_, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ delay: index * 0.008 }}
              className="aspect-square border border-white/45"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <ArrowRight className="hidden text-accent lg:block" size={20} strokeWidth={1.2} aria-hidden="true" />

      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Wallet secret</p>
        <BitField bits={bits} />
      </div>
    </div>
  );
}

function CandidateSearch({
  candidate,
  candidatePattern,
  found,
  searching,
  targetPattern,
}: {
  candidate: number | null;
  candidatePattern: string[];
  found: boolean;
  searching: boolean;
  targetPattern: string[];
}) {
  return (
    <div className="grid min-h-[21rem] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Possible beginnings</p>
        <p className="mt-3 font-serif text-2xl text-white">
          {candidate === null ? 'Ready' : found ? `Match: ${candidate + 1} of 64` : `Checking: ${candidate + 1} of 64`}
        </p>
        <div className="mt-6 grid grid-cols-8 gap-2" aria-label="Toy candidate search">
          {Array.from({ length: TOY_SPACE }, (_, index) => {
            const tested = candidate !== null && index < candidate;
            const active = candidate === index;

            return (
              <motion.span
                key={index}
                animate={{
                  backgroundColor: active ? (found ? '#3b82f6' : '#d4d4d4') : 'rgba(255,255,255,0)',
                  borderColor: active ? (found ? '#3b82f6' : '#d4d4d4') : 'rgba(255,255,255,0.24)',
                  opacity: tested ? 0.14 : 1,
                }}
                transition={{ duration: 0.08 }}
                className="aspect-square border"
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      <div className="border-y border-white/15">
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-white/15 py-5">
          <p className="font-serif text-lg text-white">Public address</p>
          <CluePattern pattern={targetPattern} />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 py-5">
          <p className={`font-serif text-lg ${found ? 'text-accent' : 'text-white'}`}>
            {found ? 'Match' : searching ? 'Checking' : 'Waiting'}
          </p>
          <CluePattern pattern={candidatePattern} matched={found} />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {found
          ? `A matching toy candidate was found after ${candidate === null ? 0 : candidate + 1} checks.`
          : searching
            ? `Checking candidate ${candidate === null ? 0 : candidate + 1} of 64.`
            : 'The toy search is ready.'}
      </p>
    </div>
  );
}

function BitField({ bits }: { bits: string[] }) {
  return (
    <div
      className="mt-5 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 border-y border-white/15 py-5 sm:grid-cols-[repeat(32,minmax(0,1fr))]"
      aria-label="A visual representation of a wallet secret"
    >
      {bits.map((bit, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: bit === '1' ? 0.95 : 0.14 }}
          transition={{ delay: Math.min(index * 0.0015, 0.3) }}
          className={`aspect-square ${bit === '1' ? 'bg-white' : 'border border-white/30'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function CluePattern({ pattern, matched = false }: { pattern: string[]; matched?: boolean }) {
  return (
    <div className="grid w-28 grid-cols-6 gap-1.5" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <motion.span
          key={index}
          animate={{
            backgroundColor: pattern[index] === '1' ? (matched ? '#3b82f6' : '#d4d4d4') : 'rgba(255,255,255,0)',
            borderColor: matched ? '#3b82f6' : 'rgba(255,255,255,0.28)',
          }}
          className="aspect-square border"
        />
      ))}
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-14 items-center justify-between gap-4 border-b border-white/10 py-3 pr-4 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-white sm:border-r sm:pl-4 sm:[&:nth-child(2n)]:border-r-0"
    >
      {label}
      <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
    </a>
  );
}
