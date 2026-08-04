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
  randomToyCandidate,
} from '../lib/model';

const TOY_SPACE = 64;

const STAGES = [
  {
    label: '1',
    nav: 'Choose one',
    title: 'The browser picks one value from 64.',
    body: 'A real wallet should have vastly more possible starting values.',
    action: 'Show all 64',
  },
  {
    label: '2',
    nav: 'See all 64',
    title: 'These are all 64 possible starting values.',
    body: 'Because the list is small, every value can be checked.',
    action: 'Set up the check',
  },
  {
    label: '3',
    nav: 'Try each one',
    title: 'Try each value until the result matches.',
    body: 'The demo compares SHA-256 results. A real wallet search would derive addresses and compare them with public wallet data.',
    action: 'Start checking',
  },
] as const;

const TIMELINE = [
  {
    date: '1 March 2021',
    title: 'A code change rerouted seed generation',
    body: 'New-seed creation moved to ngu.random. Firmware 4.0.0 shipped with that change on 17 March.',
    sourceHref: 'https://github.com/Coldcard/firmware/commit/b18723dddb6d751c39978e4364b56b2414f68b47',
    sourceLabel: 'Firmware change',
  },
  {
    date: '11 March 2022',
    title: 'Later models added data from two secure elements',
    body: 'Mk4 hashed data from both secure elements, then passed only four bytes of the result into the software generator.',
    sourceHref: 'https://github.com/Coldcard/firmware/commit/01cb43f7e87cc806963a74cbe0fcb4155f23a2a3',
    sourceLabel: 'Reseed change',
  },
  {
    date: '30 July 2026 UTC',
    title: 'Wallet sweeps led researchers back to the firmware',
    body: 'After coordinated sweeps were reported, independent researchers found the broken random-number path. Blockchain data alone cannot show which device or firmware created a wallet.',
    sourceHref: 'https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware',
    sourceLabel: 'Independent firmware analysis',
  },
  {
    date: '31 July 2026',
    title: 'Coinkite released fixed firmware',
    body: 'The updates repair new seed generation. Seeds made earlier on affected firmware still need to be replaced.',
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
  const [targetCandidate, setTargetCandidate] = useState(() => randomToyCandidate(TOY_SPACE));
  const [output, setOutput] = useState('');
  const [targetClue, setTargetClue] = useState('');
  const [candidate, setCandidate] = useState<number | null>(null);
  const [candidateClue, setCandidateClue] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const searchRun = useRef(0);

  useEffect(() => {
    let active = true;

    void outputForCandidate(targetCandidate).then(async (targetOutput) => {
      const clue = await publicClueForOutput(targetOutput);
      if (!active) return;
      setOutput(targetOutput);
      setTargetClue(clue);
    });

    return () => {
      active = false;
    };
  }, [targetCandidate]);

  const outputBits = useMemo(() => hexToBits(output), [output]);
  const targetPattern = useMemo(() => clueToTiles(targetClue, 24), [targetClue]);
  const candidatePattern = useMemo(() => clueToTiles(candidateClue, 24), [candidateClue]);
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

  const createToyWallet = () => {
    resetSearch();
    setStage(0);
    setOutput('');
    setTargetClue('');
    setTargetCandidate((current) => randomToyCandidate(TOY_SPACE, current));
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

    if (found) {
      createToyWallet();
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
                Cold storage security case study / Updated 4 August 2026
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
                <span className="text-ink-muted">4.0.0–4.1.9; 5.0.1-mk3; 5.0.3-mk3*</span>
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
              * Coinkite lists 4.0.1–4.1.9. Public source and signed records also show the affected route in 4.0.0 and in two old Mk3 builds named 5.0.1-mk3 and 5.0.3-mk3. For Mk3, the fixed release is 4.2.0.
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
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What went wrong</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">The firmware bypassed the hardware RNG when it created a seed.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                The bug was not in the random-number chip. A 2021 code change sent new-wallet creation to a predictable software generator instead.
              </p>
            </div>

            <div className="mt-9 border-y border-white/15">
              <div className="grid gap-4 border-b border-white/10 py-6 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">What should happen</p>
                <p className="font-serif text-xl text-white">New wallet → hardware RNG → seed</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">Intended</span>
              </div>
              <div className="grid gap-4 py-6 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What happened</p>
                <p className="font-serif text-xl text-white">New wallet → predictable software generator → seed</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">Affected firmware</span>
              </div>
            </div>

            <div className="mt-7 grid gap-4 border-l-2 border-accent pl-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
              <p className="font-serif text-lg text-white">So how could an offline wallet be stolen?</p>
              <p className="max-w-3xl font-sans text-sm leading-relaxed text-ink-muted">
                The seed was weak from the moment it was created. An attacker could reproduce possible seeds on another computer and use public Bitcoin addresses to see when a guess was right. They never needed the COLDCARD. Bitcoin itself was not broken.
              </p>
            </div>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-20 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What happened</p>
              <h2 className="mt-3 font-serif text-3xl text-white">The bug shipped in 2021. The fix arrived in 2026.</h2>
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
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">See how the search works</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">Hide one value in a list of 64. Then find it.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                This is a safe, cut-down example. It checks made-up values one by one and creates no Bitcoin keys or addresses.
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
                    disabled={searching || !targetClue}
                    className="flex min-h-11 items-center gap-3 border border-white/40 bg-white px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-50"
                  >
                    {searching ? 'Checking' : found ? 'New toy wallet' : currentStage.action}
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
                  {stage === 0 && <RandomBeginning key={output} bits={outputBits} onRegenerate={createToyWallet} />}
                  {stage === 1 && <LimitedBeginnings targetPattern={targetPattern} />}
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
              A public address does not reveal the seed. It only tells an attacker when a guess produces the right wallet.
            </p>
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
              <p className="mt-2 font-sans text-sm text-ink-muted">Code, incident counts, open questions, and source links.</p>
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
                    Galaxy Research grouped three suspected sweep waves: 1,367.05 BTC from 4,585 addresses. Its revised count for the first wave is 1,082.65 BTC from 1,195 addresses, moved in 41 minutes on 30 July UTC.
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
                    Coinkite lists Mk2/Mk3 4.0.1–4.1.9. Public source and signed release records also show the affected route in 4.0.0 and in Mk3 builds 5.0.1-mk3 and 5.0.3-mk3. That is why the table above includes all three.
                  </p>
                  <p>
                    Two proposed patches would use the full 32-byte secure-element digest on later models and check the hardware-RNG path at startup. As of 4 August, neither patch has been released.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What has not been measured</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    Testing a guess requires BIP-39 and wallet-address derivation. Published GPU and FPGA studies cover parts of that work, not a complete COLDCARD search. No public end-to-end benchmark establishes the time or cost for later models.
                  </p>
                  <p>
                    Coinkite&apos;s preliminary estimates are about 40 bits for affected Mk2/Mk3 seeds and about 72 bits for Mk4/Mk5/Q. Block separately counted 2³² possible values for one later-model input while holding the remaining state fixed. These are not measured attack times.
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
              The demo hashes 64 made-up values. It never sees your wallet data and does not run COLDCARD firmware.
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
                  <SourceLink label="Open full-digest reseed proposal" href="https://github.com/Coldcard/firmware/pull/697" />
                  <SourceLink label="Open RNG startup-check proposal" href="https://github.com/Coldcard/firmware/pull/694" />
                </div>
              </section>

              <section>
                <h3 className="font-serif text-lg text-white">Affected releases outside the advisory range</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Official 4.0.0 version history" href="https://coldcard.com/docs/version-history/#version-400-mar-17-2021" />
                  <SourceLink label="4.0.0 seed-generation source" href="https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/shared/seed.py#L348-L359" />
                  <SourceLink label="Signed 4.0.0 build / 17:20" href="https://github.com/Coldcard/firmware/blob/38f4e177c928fffc7c1378aac67f7dead8befe80/releases/signatures.txt#L5" />
                  <SourceLink label="Signed 4.0.0 build / 17:24" href="https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/releases/signatures.txt#L5" />
                  <SourceLink label="Signed Mk3 5.0.1 and 5.0.3 builds" href="https://github.com/Coldcard/firmware/blob/d2acc4380b5ffcb10cf6ad1bc828a04794fd0c24/releases/signatures.txt#L8-L15" />
                  <SourceLink label="Mk3 5.0.1 seed-generation source" href="https://github.com/Coldcard/firmware/blob/e909bc0326feb63ce17891a8d14b0966996e4f5d/shared/seed.py#L370" />
                  <SourceLink label="Mk3 5.0.3 seed-generation source" href="https://github.com/Coldcard/firmware/blob/fd83de540a0edd6f9bc6efb2626f6b1b858f551d/shared/seed.py#L370" />
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

function RandomBeginning({ bits, onRegenerate }: { bits: string[]; onRegenerate: () => void }) {
  const bars = Array.from({ length: 64 }, (_, index) => {
    const nibble = bits.slice(index * 4, index * 4 + 4).join('');
    return Number.parseInt(nibble || '0', 2);
  });

  return (
    <div className="grid min-h-[21rem] items-center gap-8 lg:grid-cols-[1fr_auto_1.15fr]">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">One randomly chosen value</p>
        <div className="mt-5 flex h-44 items-end gap-[2px] border-y border-white/15 py-5" aria-hidden="true">
          {bars.map((value, index) => (
            <motion.span
              key={index}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${18 + value * 5.2}%`, opacity: 0.2 + value / 20 }}
              transition={{ duration: 0.35, delay: index * 0.006 }}
              className="min-w-0 flex-1 bg-white"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={bits.length === 0}
          className="mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-white disabled:opacity-40"
        >
          <RotateCcw size={12} aria-hidden="true" />
          Create another
        </button>
      </div>

      <ArrowRight className="hidden text-ink-muted lg:block" size={20} strokeWidth={1.2} aria-hidden="true" />

      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">The same value shown as 256 bits</p>
        <BitField bits={bits} />
      </div>
    </div>
  );
}

function LimitedBeginnings({ targetPattern }: { targetPattern: string[] }) {
  return (
    <div className="grid min-h-[21rem] items-center gap-10 lg:grid-cols-[1.1fr_auto_0.9fr]">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Every possible value in this demo</p>
        <p className="mt-3 font-serif text-2xl text-white">64 in total</p>
        <CandidatePool />
      </div>

      <ArrowRight className="hidden text-accent lg:block" size={20} strokeWidth={1.2} aria-hidden="true" />

      <div className="border-y border-white/15 py-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Result to match</p>
        <p className="mt-3 font-serif text-2xl text-white">This is what we are looking for</p>
        <div className="mt-6">
          <CluePattern pattern={targetPattern} />
        </div>
        <p className="mt-5 max-w-sm font-sans text-xs leading-relaxed text-ink-muted">
          Exactly one of the 64 values produces this result. To find it, the list has to be checked.
        </p>
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
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">Values to check</p>
        <p className="mt-3 font-serif text-2xl text-white">
          {candidate === null ? 'Ready' : found ? `Match: ${candidate + 1} of 64` : `Checking: ${candidate + 1} of 64`}
        </p>
        <CandidatePool candidate={candidate} found={found} />
      </div>

      <div className="border-y border-white/15">
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-white/15 py-5">
          <div>
            <p className="font-serif text-lg text-white">Target result</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">The result we need to match</p>
          </div>
          <CluePattern pattern={targetPattern} />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 py-5">
          <div>
            <p className={`font-serif text-lg ${found ? 'text-accent' : 'text-white'}`}>
              {found ? 'Matched' : searching ? 'Checking' : 'Waiting'}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">Result from the current guess</p>
          </div>
          <CluePattern pattern={candidatePattern} matched={found} />
        </div>
        <p className="border-t border-white/10 py-3 font-sans text-xs leading-relaxed text-ink-muted">
          Only 24 bits are drawn here. The demo checks all 256 bits of the SHA-256 result.
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

function CandidatePool({ candidate = null, found = false }: { candidate?: number | null; found?: boolean }) {
  const checked = candidate === null ? 0 : candidate + 1;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-8 gap-2" aria-label="Sixty-four toy candidate seeds">
        {Array.from({ length: TOY_SPACE }, (_, index) => (
          <CandidateMark
            key={index}
            index={index}
            active={candidate === index}
            tested={candidate !== null && index < candidate}
            found={found && candidate === index}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/15">
          <motion.div
            className={`h-px ${found ? 'bg-accent' : 'bg-white'}`}
            animate={{ width: `${(checked / TOY_SPACE) * 100}%` }}
            transition={{ duration: 0.08 }}
          />
        </div>
        <p className="w-16 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
          {candidate === null ? '64 total' : `${checked} / 64`}
        </p>
      </div>
    </div>
  );
}

function CandidateMark({
  active,
  found,
  index,
  tested,
}: {
  active: boolean;
  found: boolean;
  index: number;
  tested: boolean;
}) {
  let mark = Math.imul(index + 1, 0x45d9f3b) >>> 0;
  mark ^= mark >>> 16;
  const markBits = Array.from({ length: 9 }, (_, bit) => ((mark >>> bit) & 1) === 1);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{
        backgroundColor: active ? (found ? 'rgba(59,130,246,0.2)' : '#d4d4d4') : 'rgba(255,255,255,0)',
        borderColor: active ? (found ? '#3b82f6' : '#d4d4d4') : 'rgba(255,255,255,0.24)',
        opacity: tested ? 0.12 : 1,
        scale: active ? 1.08 : 1,
      }}
      transition={{ duration: 0.12, delay: candidateRevealDelay(index, active) }}
      className="aspect-square border p-[3px]"
      aria-label={`Candidate ${index + 1}${active ? found ? ', match' : ', checking' : tested ? ', checked' : ''}`}
    >
      <span className="grid size-full grid-cols-3 gap-[2px]" aria-hidden="true">
        {markBits.map((bit, bitIndex) => (
          <span
            key={bitIndex}
            className={bit
              ? active && !found ? 'bg-canvas' : 'bg-white'
              : active && !found ? 'border border-canvas/35' : 'border border-white/20'}
          />
        ))}
      </span>
    </motion.span>
  );
}

function candidateRevealDelay(index: number, active: boolean) {
  return active ? 0 : index * 0.004;
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
    <div className="grid w-36 grid-cols-8 gap-1.5 sm:w-44" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
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
