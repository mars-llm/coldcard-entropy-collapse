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
    title: 'A real seed must be almost impossible to guess.',
    body: 'This pattern is only a visual stand-in for a wallet seed.',
    action: 'Start',
  },
  {
    label: '2',
    nav: 'Weak fallback',
    title: 'The faulty route made the possible beginnings easier to search.',
    body: 'This example uses just 64 possibilities so the search is easy to see.',
    action: 'Shrink the choices',
  },
  {
    label: '3',
    nav: 'Test a guess',
    title: 'A public wallet lets each guess be checked.',
    body: 'It does not reveal the seed. It only shows whether a guess recreates the same wallet.',
    action: 'Run the 64 guesses',
  },
] as const;

const TIMELINE = [
  {
    date: '1 March 2021',
    title: 'Seed generation changed path',
    body: 'A code change sent new-seed creation through ngu.random. Firmware 4.0.0 shipped that route on 17 March.',
    sourceHref: 'https://github.com/Coldcard/firmware/commit/b18723dddb6d751c39978e4364b56b2414f68b47',
    sourceLabel: 'Firmware change',
  },
  {
    date: '11 March 2022',
    title: 'Later models added another input',
    body: 'Mk4 added data from two secure elements, but only four bytes entered the software generator.',
    sourceHref: 'https://github.com/Coldcard/firmware/commit/01cb43f7e87cc806963a74cbe0fcb4155f23a2a3',
    sourceLabel: 'Reseed change',
  },
  {
    date: '30 July 2026 UTC',
    title: 'Reported sweeps triggered investigation',
    body: 'Researchers reported coordinated sweeps and traced the failure to the firmware. Blockchain data alone cannot identify the original device.',
    sourceHref: 'https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware',
    sourceLabel: 'Independent firmware analysis',
  },
  {
    date: '31 July 2026',
    title: 'Fixed firmware became available',
    body: 'Coinkite released fixed firmware for every affected model and release track. Existing seeds still had to be replaced.',
    sourceHref: 'https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/',
    sourceLabel: 'Official advisory',
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
    <div id="top" className="min-h-[100dvh] bg-canvas text-ink">
      <header className="sticky top-0 z-50 grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-white/10 bg-canvas/95 px-4 backdrop-blur-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-8">
        <a
          href="https://mars-llm.github.io/hal-finney-trading-algorithms/"
          className="flex min-h-11 min-w-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-white"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Cryptographic Arts</span>
          <span className="sr-only sm:hidden">Return to Cryptographic Arts</span>
        </a>
        <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted sm:block">
          Security case study / 01
        </p>
        <a href="#top" className="min-w-0 max-w-full truncate text-right font-serif text-sm uppercase tracking-[0.16em] text-white transition-colors hover:text-accent">
          Entropy Collapse
        </a>
      </header>

      <main>
        <section className="border-b border-white/10 px-4 py-10 md:px-8 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
            <motion.header
              className="max-w-3xl"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                Cold storage security case study / Updated 3 August 2026
              </p>
              <h1 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                How a firmware mistake weakened COLDCARD seed generation.
              </h1>
              <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                A seed is a wallet&apos;s master secret. Keeping it offline does not help if it was predictable when created.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#owner-guidance"
                  className="inline-flex min-h-12 items-center justify-center gap-3 border border-accent bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.15em] text-canvas transition-colors hover:border-white hover:bg-canvas hover:text-white"
                >
                  I own a COLDCARD
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
                <a
                  href="#failure"
                  className="inline-flex min-h-12 items-center justify-center gap-3 border border-white/30 px-5 font-mono text-[10px] uppercase tracking-[0.15em] text-white transition-colors hover:border-white"
                >
                  How did this happen?
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
              <p className="mt-5 max-w-2xl font-sans text-xs leading-relaxed text-ink-muted">
                Unaffiliated with Coinkite or COLDCARD. This page explains the failure; affected owners should follow the{' '}
                <a href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">
                  official advisory
                </a>.
              </p>
            </motion.header>

            <nav aria-label="Page sections" className="border-y border-white/15 font-mono text-[9px] uppercase tracking-[0.16em]">
              <a href="#owner-guidance" className="flex min-h-11 items-center justify-between border-b border-white/10 text-ink-muted transition-colors hover:text-white">
                Owner guidance
                <span className="text-accent">01</span>
              </a>
              <a href="#failure" className="flex min-h-11 items-center justify-between border-b border-white/10 text-ink-muted transition-colors hover:text-white">
                What failed
                <span className="text-accent">02</span>
              </a>
              <a href="#timeline" className="flex min-h-11 items-center justify-between border-b border-white/10 text-ink-muted transition-colors hover:text-white">
                Timeline
                <span className="text-accent">03</span>
              </a>
              <a href="#mechanism" className="flex min-h-11 items-center justify-between border-b border-white/10 text-ink-muted transition-colors hover:text-white">
                Try the demo
                <span className="text-accent">04</span>
              </a>
              <a href="#sources" className="flex min-h-11 items-center justify-between text-ink-muted transition-colors hover:text-white">
                Sources
                <span className="text-accent">05</span>
              </a>
            </nav>
          </div>
        </section>

        <section id="owner-guidance" className="scroll-mt-20 border-b border-accent/60 bg-accent/[0.10] px-4 py-10 md:px-8 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">For COLDCARD owners / Start here</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-white">Could this affect my wallet?</h2>
                <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                  What matters is where the seed was created. A seed made by affected firmware remains affected after being restored on another device. A seed created elsewhere and later imported did not pass through this bug.
                </p>
                <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                  Fixed firmware protects future seeds. It cannot repair one that already exists. If you do not know where the seed came from, use the official guidance or ask your wallet provider before acting.
                </p>
              </div>
              <a
                href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-3 bg-white px-5 font-mono text-[10px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink"
              >
                Official migration guidance
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>

            <div className="mt-9 border-y border-accent/35">
              <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 border-b border-accent/25 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-accent sm:grid-cols-[10rem_1fr_1fr]">
                <span>Model</span>
                <span>Seed made on</span>
                <span>Fixed in</span>
              </div>
              <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 border-b border-accent/20 py-4 font-sans text-sm sm:grid-cols-[10rem_1fr_1fr]">
                <strong className="font-normal text-white">Mk2 / Mk3</strong>
                <span className="text-ink-muted">4.0.0–4.1.9*</span>
                <span className="text-white">4.2.0+</span>
              </div>
              <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 border-b border-accent/20 py-4 font-sans text-sm sm:grid-cols-[10rem_1fr_1fr]">
                <strong className="font-normal text-white">Mk4 / Mk5</strong>
                <span className="text-ink-muted">Before 5.6.0 standard or 6.6.0X Edge</span>
                <span className="text-white">5.6.0+ standard or 6.6.0X+ Edge</span>
              </div>
              <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 py-4 font-sans text-sm sm:grid-cols-[10rem_1fr_1fr]">
                <strong className="font-normal text-white">Q</strong>
                <span className="text-ink-muted">Before 1.5.0Q standard or 6.6.0QX Edge</span>
                <span className="text-white">1.5.0Q+ standard or 6.6.0QX+ Edge</span>
              </div>
            </div>
            <p className="mt-3 max-w-4xl font-sans text-xs leading-relaxed text-ink-muted">
              * Coinkite&apos;s advisory starts the Mk2/Mk3 range at 4.0.1. Public 4.0.0 source and signed release records show the same faulty route, so this page conservatively includes 4.0.0.
            </p>

            <ol className="mt-8 grid border-y border-accent/35 lg:grid-cols-3">
              <li className="border-b border-accent/25 py-5 lg:border-b-0 lg:border-r lg:pr-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">01 / Update</p>
                <h3 className="mt-2 font-serif text-lg text-white">Install fixed firmware.</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Confirm the version on the device before creating a replacement seed.</p>
              </li>
              <li className="border-b border-accent/25 py-5 lg:border-b-0 lg:border-r lg:px-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">02 / Replace</p>
                <h3 className="mt-2 font-serif text-lg text-white">Create and check a new seed.</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Verify the written backup and a receive address on the device.</p>
              </li>
              <li className="py-5 lg:pl-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">03 / Move</p>
                <h3 className="mt-2 font-serif text-lg text-white">Send a test, then move the rest.</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Wait for confirmation. Keep the old backup until the move is complete.</p>
              </li>
            </ol>

            <details className="group mt-7 border-y border-accent/35">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-3">
                <span className="font-serif text-lg text-white">Do dice, a passphrase, or multisig change this?</span>
                <span className="flex size-9 shrink-0 items-center justify-center border border-accent/70 font-mono text-base text-white transition-transform group-open:rotate-45 group-open:bg-accent group-open:text-canvas" aria-hidden="true">+</span>
              </summary>
              <div className="grid gap-0 border-t border-accent/25 pb-2 lg:grid-cols-3">
                <div className="border-b border-accent/20 py-5 lg:border-b-0 lg:border-r lg:pr-5">
                  <h3 className="font-serif text-base text-white">Dice added during seed creation</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Coinkite says this bug alone does not put a seed at risk if at least 50 fair, independent, private dice rolls were used when it was created. Rolls added now cannot change an existing seed.</p>
                </div>
                <div className="border-b border-accent/20 py-5 lg:border-b-0 lg:border-r lg:px-5">
                  <h3 className="font-serif text-base text-white">Strong BIP-39 passphrase</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">This is an extra secret, not the PIN. A strong, unique passphrase adds a barrier but does not repair the seed. Coinkite still advises replacing it.</p>
                </div>
                <div className="py-5 lg:pl-5">
                  <h3 className="font-serif text-base text-white">Multisig or another spending policy</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">What matters is whether affected keys can approve a payment on their own. If a healthy, independent key is still required, the affected keys alone are not enough. Ask your wallet provider before moving funds.</p>
                </div>
              </div>
            </details>

            <p className="mt-6 max-w-4xl border-l-2 border-white/70 pl-4 font-sans text-sm leading-relaxed text-white">
              Never enter seed words or a passphrase on any website. Ignore unsolicited recovery help. Keep the old backup until the move is complete.
            </p>

            <a
              href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-white underline decoration-accent underline-offset-4 transition-colors hover:text-accent"
            >
              Get the correct download from the official advisory
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="failure" className="scroll-mt-20 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">The one-minute explanation</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">The wallet asked for random bytes. The request reached the wrong code.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                The hardware source still worked. New-wallet creation no longer reached it.
              </p>
            </div>

            <div className="mt-9 border-y border-white/15">
              <div className="grid gap-4 border-b border-white/10 py-6 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Expected route</p>
                <p className="font-serif text-xl text-white">New wallet → hardware-generated random bytes → seed material</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">Designed path</span>
              </div>
              <div className="grid gap-4 py-6 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Affected route</p>
                <p className="font-serif text-xl text-white">New wallet → software fallback → seed from limited device and timing inputs</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">Affected builds</span>
              </div>
            </div>

            <div className="mt-7 grid gap-4 border-l-2 border-accent pl-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
              <p className="font-serif text-lg text-white">Why offline was not enough</p>
              <p className="max-w-3xl font-sans text-sm leading-relaxed text-ink-muted">
                An attacker could recreate candidate seeds elsewhere and check them against public wallet information. The device never had to be touched or connected. Bitcoin&apos;s cryptography was not broken; the weakness was in seed creation.
              </p>
            </div>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-20 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What happened</p>
              <h2 className="mt-3 font-serif text-3xl text-white">How the bug got in—and how it was fixed.</h2>
            </div>

            <ol className="relative mt-10 border-l border-white/20">
              {TIMELINE.map((item) => (
                <li
                  key={item.date}
                  className="relative grid gap-3 border-b border-white/10 py-7 pl-7 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-7 sm:pl-9"
                >
                  <span className="absolute -left-[5px] top-9 size-[9px] rounded-full border border-accent bg-canvas" aria-hidden="true" />
                  <time className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">{item.date}</time>
                  <div>
                    <h3 className="font-serif text-xl text-white">{item.title}</h3>
                    <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">{item.body}</p>
                    <a
                      href={item.sourceHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-muted underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                    >
                      {item.sourceLabel}
                      <ExternalLink size={11} aria-hidden="true" />
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="mechanism" className="scroll-mt-20 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Interactive explanation</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">Try the search with 64 harmless examples.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                This demo keeps one essential point: if the possible seeds become searchable, public wallet information can confirm a guess. It creates no Bitcoin keys or addresses.
              </p>
            </div>

            <div className="mt-9 border-y border-white/15">
              <ol className="grid grid-cols-3 border-b border-white/15" aria-label="Explanation progress">
                {STAGES.map((item, index) => (
                  <li key={item.label} className="border-r border-white/10 last:border-r-0">
                    <button
                      type="button"
                      onClick={() => selectStage(index)}
                      className={`flex min-h-[4.5rem] w-full flex-col justify-center gap-2 px-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-3 sm:px-5 ${
                        index === stage ? 'bg-white/[0.06] text-white' : 'text-ink-muted hover:text-white'
                      }`}
                      aria-current={index === stage ? 'step' : undefined}
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] ${
                          index === stage ? 'border-accent bg-accent text-canvas' : 'border-white/20'
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
                  aria-live="polite"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Step {currentStage.label} of 3</p>
                  <h3 className="mt-3 max-w-2xl font-serif text-2xl leading-snug text-white sm:text-3xl">
                    {currentStage.title}
                  </h3>
                  <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                    {currentStage.body}
                  </p>
                </motion.div>

                <div className="flex items-center gap-3">
                  {stage > 0 && (
                    <button
                      type="button"
                      onClick={() => selectStage(stage - 1)}
                      className="flex min-h-11 items-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-white"
                    >
                      <ArrowLeft size={13} aria-hidden="true" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={continueStudy}
                    disabled={searching || (stage === 2 && !targetClue)}
                    className="flex min-h-11 items-center gap-3 border border-white/40 bg-white px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-50"
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
              The public wallet supplies the check. It does not reveal the seed.
            </p>
          </div>
        </section>

        <section id="numbers" className="scroll-mt-20 border-b border-white/10 bg-white/[0.025] px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Search is not collision</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">Finding one seed does not mean two wallets shared it.</h2>
            </div>

            <dl className="mt-9 grid border-y border-white/15 sm:grid-cols-2">
              <div className="border-b border-white/10 py-6 sm:border-b-0 sm:border-r sm:pr-7">
                <dt className="font-serif text-xl text-white">Searchable</dt>
                <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">Someone tests likely seeds until one recreates the target wallet.</dd>
              </div>
              <div className="py-6 sm:pl-7">
                <dt className="font-serif text-xl text-white">Duplicated — also called a collision</dt>
                <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">Two wallets began from exactly the same seed. An attacker does not need this to find either wallet.</dd>
              </div>
            </dl>

            <div className="mt-8 border-y border-white/15 py-7">
              <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto_1fr]">
                <SearchLane label="Search for wallet A" result="Seed A found" activeIndex={17} />
                <p className="text-center font-serif text-3xl text-accent" aria-label="does not equal">≠</p>
                <SearchLane label="Search for wallet B" result="Seed B found" activeIndex={43} />
              </div>
              <p className="mt-6 text-center font-sans text-sm leading-relaxed text-ink-muted">
                Both searches can succeed and still end at different seeds.
              </p>
            </div>

            <div className="mt-8 grid gap-4 border-l-2 border-accent pl-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
              <p className="font-serif text-lg text-white">What the code establishes</p>
              <div className="max-w-3xl font-sans text-sm leading-relaxed text-ink-muted">
                <p>
                  The code does not show every wallet choosing from one shared list of 4.3 billion complete seeds. Block found a four-byte input on later models, but earlier calls and other software state also shaped the final seed. No duplicate seed has been confirmed.
                </p>
                <a
                  href="https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white underline decoration-accent underline-offset-4 hover:text-accent"
                >
                  Read Block&apos;s analysis
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="mt-12 border-t border-white/15 pt-9">
              <div className="max-w-2xl">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What the bit figures mean</p>
                <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                  These are estimates, not measured attack times, collision rates, or promises of how long funds remain safe.
                </p>
              </div>

              <dl className="mt-7 grid border-y border-white/15 lg:grid-cols-3">
                <div className="border-b border-white/10 py-6 lg:border-b-0 lg:border-r lg:pr-7">
                  <dt className="font-serif text-3xl text-white">2³²</dt>
                  <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">Block counted the possible values in one four-byte later-model input while holding the rest of the software state fixed.</dd>
                </div>
                <div className="border-b border-white/10 py-6 lg:border-b-0 lg:border-r lg:px-7">
                  <dt className="font-serif text-3xl text-white">About 40 bits</dt>
                  <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">Coinkite&apos;s preliminary, broader search estimate for affected Mk2 and Mk3 seeds.</dd>
                </div>
                <div className="py-6 lg:pl-7">
                  <dt className="font-serif text-3xl text-white">About 72 bits</dt>
                  <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">Coinkite&apos;s preliminary, broader search estimate for affected Mk4, Mk5, and Q seeds. No public end-to-end benchmark establishes a specific time.</dd>
                </div>
              </dl>

              <a
                href="https://blog.coinkite.com/entropy-technical-backgrounder/"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white underline decoration-accent underline-offset-4 hover:text-accent"
              >
                Read Coinkite&apos;s technical estimate
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section id="resilience" className="border-b border-white/10 px-4 py-10 md:px-8 md:py-14">
          <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(28rem,1.2fr)] lg:items-center">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">The wider lesson</p>
              <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight text-white">Build your setup so one failure is not enough.</h2>
            </div>

            <div className="max-w-2xl border-y border-white/15 py-4 lg:justify-self-end">
              <p className="font-serif text-lg leading-relaxed text-white">
                Use independently created keys, avoid one shared point of failure, and test recovery before you need it.
              </p>
            </div>
          </div>
        </section>

        <details id="sources" className="group scroll-mt-20 border-b border-white/10 bg-white/[0.035] px-4 md:px-8">
          <summary className="mx-auto flex min-h-28 max-w-6xl cursor-pointer list-none items-center justify-between gap-6 py-5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Evidence and caveats</p>
              <p className="mt-2 font-serif text-xl text-white">Sources and technical detail</p>
              <p className="mt-2 font-sans text-sm text-ink-muted">The detailed record and primary sources.</p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center border border-accent/70 font-mono text-lg text-white transition-transform group-hover:bg-accent group-hover:text-canvas group-open:rotate-45 group-open:bg-accent group-open:text-canvas" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="mx-auto max-w-6xl border-t border-white/10 py-8">
            <div className="grid gap-x-12 gap-y-9 lg:grid-cols-2">
              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Incident record</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    Galaxy Research&apos;s blockchain analysis groups three suspected sweep waves whose transaction inputs total 1,367.05 BTC across 4,585 addresses. Its revised first wave moved 1,082.65 BTC from 1,195 addresses in 41 minutes on 30 July UTC.
                  </p>
                  <p>
                    Alex Thorn later reported a separate, provisional cluster of 448.73 BTC across 709 addresses after removing 89 misclassified multisig addresses. It had no direct confirmation from affected owners, so it is not added to Galaxy&apos;s total. Blockchain patterns can group suspected sweeps; they cannot identify the original device or firmware.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What the code shows</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    MicroPython initialized the fallback from one 32-bit word of the chip ID, the current phase of a repeating processor counter, and two raw clock-register values. Earlier calls then advanced the generator before seed creation. The processor counter was not a timestamp, and no published hardware study has measured how these values are distributed across many devices and boots.
                  </p>
                  <p>
                    Coinkite&apos;s advisory starts the Mk2/Mk3 range at 4.0.1. Its official version history lists 4.0.0 as a release, and the public source plus signed build records use the affected route. This page therefore includes 4.0.0 while keeping the difference from Coinkite&apos;s published range explicit.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What has not been measured</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    Testing a guess requires BIP-39 and wallet-address derivation. Published GPU and FPGA studies cover parts of that work, not a complete COLDCARD search. No public end-to-end benchmark establishes the time or cost for later models.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What a recovered seed exposes</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    A recovered seed lets an attacker derive and scan common wallet paths. That can link the affected wallet&apos;s activity and reduce the privacy of CoinJoin or Payjoin transactions it joined, but it does not automatically expose every custom path or every other participant.
                  </p>
                </div>
              </section>
            </div>

            <p className="mt-9 max-w-3xl border-t border-white/10 pt-6 font-sans text-sm leading-relaxed text-ink-muted">
              The demo uses SHA-256 and 64 simulated secrets. It handles no wallet material and does not reproduce COLDCARD firmware.
            </p>

            <div className="mt-8 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-2">
              <section>
                <h3 className="font-serif text-lg text-white">Owner guidance and fixed firmware</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Coinkite migration advisory" href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/" />
                  <SourceLink label="Mk2/Mk3 fixed firmware" href="https://coldcard.com/downloads/mk3" />
                  <SourceLink label="Mk4/Mk5 fixed firmware" href="https://coldcard.com/downloads/mk" />
                  <SourceLink label="Q fixed firmware" href="https://coldcard.com/downloads/q1" />
                  <SourceLink label="Edge fixed firmware" href="https://coldcard.com/downloads/edge" />
                </div>
              </section>

              <section>
                <h3 className="font-serif text-lg text-white">Firmware and root cause</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Block analysis" href="https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware" />
                  <SourceLink label="Coinkite technical backgrounder" href="https://blog.coinkite.com/entropy-technical-backgrounder/" />
                  <SourceLink label="March 2021 seed-path change" href="https://github.com/Coldcard/firmware/commit/b18723dddb6d751c39978e4364b56b2414f68b47" />
                  <SourceLink label="March 2022 secure-element reseed" href="https://github.com/Coldcard/firmware/commit/01cb43f7e87cc806963a74cbe0fcb4155f23a2a3" />
                  <SourceLink label="MicroPython fallback source" href="https://github.com/Coldcard/micropython/blob/4107246f8a080807b62c3b4838e71e812ea68b6f/ports/stm32/rng.c#L74-L98" />
                  <SourceLink label="Main firmware hotfix" href="https://github.com/Coldcard/firmware/commit/ca72463709f4e3f8964952039d5caf955f566a87" />
                  <SourceLink label="Mk2/Mk3 legacy hotfix" href="https://github.com/Coldcard/firmware/commit/4543629941a83a3e2788ac06a12b208338cb8314" />
                </div>
              </section>

              <section>
                <h3 className="font-serif text-lg text-white">Affected 4.0.0 release</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Official 4.0.0 version history" href="https://coldcard.com/docs/version-history/#version-400-mar-17-2021" />
                  <SourceLink label="4.0.0 seed-generation source" href="https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/shared/seed.py#L348-L359" />
                  <SourceLink label="Signed 4.0.0 build / 17:20" href="https://github.com/Coldcard/firmware/blob/38f4e177c928fffc7c1378aac67f7dead8befe80/releases/signatures.txt#L5" />
                  <SourceLink label="Signed 4.0.0 build / 17:24" href="https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/releases/signatures.txt#L5" />
                </div>
              </section>

              <section>
                <h3 className="font-serif text-lg text-white">Reported on-chain activity</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Galaxy: revised first wave" href="https://x.com/glxyresearch/status/2083560956416741448" />
                  <SourceLink label="Galaxy: three-wave estimate" href="https://x.com/glxyresearch/status/2083623500183421043" />
                  <SourceLink label="Galaxy: how the waves were identified" href="https://x.com/glxyresearch/status/2083967080911470640" />
                  <SourceLink label="Galaxy: limits of the classification" href="https://x.com/glxyresearch/status/2083623504285421622" />
                  <SourceLink label="Alex Thorn: provisional fourth cluster" href="https://x.com/intangiblecoins/status/2084117621864046698" />
                  <SourceLink label="Reported collection address" href="https://mempool.space/address/bc1qnk4zh9qcnap2mycp56qjrgza3cc8ylrh8fecp0" />
                  <SourceLink label="Reported consolidation transaction" href="https://mempool.space/tx/0c6bf853a645b699a3b2cd6d8e3c44cf1a02a16f538df08212a44753f75d9d01" />
                </div>
              </section>

              <section className="lg:col-span-2">
                <h3 className="font-serif text-lg text-white">Cryptographic background</h3>
                <div className="mt-3 grid border-t border-white/10 sm:grid-cols-2">
                  <SourceLink label="BIP-39 specification" href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki" />
                  <SourceLink label="Bitcoin.org Android RNG alert" href="https://bitcoin.org/en/alert/2013-08-11-android" />
                  <SourceLink label="FPGA HMAC-SHA512 study" href="https://cacr.uwaterloo.ca/techreports/2011/cacr2011-10.pdf" />
                  <SourceLink label="FPGA wallet-pipeline study" href="https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/blc2.70028" />
                  <SourceLink label="GPU PBKDF2 study" href="https://www.usenix.org/system/files/conference/woot16/woot16-paper-ruddick.pdf" />
                </div>
              </section>
            </div>
          </div>
        </details>
      </main>

      <footer className="flex flex-col gap-2 px-4 py-4 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted sm:flex-row sm:items-center sm:justify-between md:px-8">
        <span>Unaffiliated with Coinkite or COLDCARD.</span>
        <span>Developed by Marsmensch, 2026.</span>
      </footer>
    </div>
  );
}

function RandomBeginning({ bits }: { bits: string[] }) {
  return (
    <div className="grid min-h-[21rem] items-center gap-8 lg:grid-cols-[0.7fr_auto_1.3fr]">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">What a real wallet needs / not to scale</p>
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
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Searchable teaching example</p>
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
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Candidate seeds</p>
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
          <div>
            <p className="font-serif text-lg text-white">Public check</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">Stand-in for wallet information</p>
          </div>
          <CluePattern pattern={targetPattern} />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 py-5">
          <div>
            <p className={`font-serif text-lg ${found ? 'text-accent' : 'text-white'}`}>
              {found ? 'Match' : searching ? 'Checking' : 'Waiting'}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">Check produced by this guess</p>
          </div>
          <CluePattern pattern={candidatePattern} matched={found} />
        </div>
        <p className="border-t border-white/10 py-3 font-sans text-xs leading-relaxed text-ink-muted">
          The tiles show 12 bits for readability. The demo compares the complete 256-bit SHA-256 value.
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        {found
          ? `A matching toy candidate was found after ${candidate === null ? 0 : candidate + 1} checks.`
          : searching
            ? 'The toy search is running.'
            : 'The toy search is ready.'}
      </p>
    </div>
  );
}

function SearchLane({ activeIndex, label, result }: { activeIndex: number; label: string; result: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">{label}</p>
        <p className="font-serif text-base text-white">{result}</p>
      </div>
      <div className="mt-4 grid grid-cols-8 gap-1.5" aria-hidden="true">
        {Array.from({ length: TOY_SPACE }, (_, index) => (
          <span
            key={index}
            className={`aspect-square border ${index === activeIndex ? 'border-accent bg-accent' : 'border-white/25'}`}
          />
        ))}
      </div>
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
      className="flex min-h-14 items-center justify-between gap-4 border-b border-white/10 py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-white sm:pl-4"
    >
      {label}
      <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
    </a>
  );
}
