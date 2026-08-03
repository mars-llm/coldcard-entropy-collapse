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
    body: 'The small model below starts with a simulated secret, made from randomness.',
    action: 'Start the walkthrough',
  },
  {
    label: '2',
    nav: 'Weak fallback',
    title: 'Affected firmware could fall back to weak randomness.',
    body: 'In the model, that leaves only 64 possible simulated secrets to try.',
    action: 'Show the fallback',
  },
  {
    label: '3',
    nav: 'Test a guess',
    title: 'A public address can confirm a recreated secret.',
    body: 'Run the model through all 64 simulated secrets. The public address is enough to check each guess.',
    action: 'Run the 64 guesses',
  },
] as const;

const TIMELINE = [
  {
    date: 'March 2021',
    title: 'Seed generation changed path',
    body: 'A firmware change routed new-wallet creation through ngu.random. That call reached MicroPython\'s software fallback instead of COLDCARD\'s hardware random-number generator.',
  },
  {
    date: 'March 2022',
    title: 'Later models added another input',
    body: 'Mk4 development added values from two secure elements. This reduced the damage, but only four bytes from that extra input reached the software generator.',
  },
  {
    date: '30 July 2026',
    title: 'Coordinated sweeps brought the fault to light',
    body: 'Independent researchers began tracing a concentrated movement of funds and connected it to seeds created by affected COLDCARD firmware.',
  },
  {
    date: '31 July 2026',
    title: 'Fixed firmware became available',
    body: 'Coinkite released fixes for every affected model and release track. The updates fix new seed generation; they cannot repair an existing seed.',
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
                How a weak random-number fallback exposed cold wallets.
              </h1>
              <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                A hardware wallet keeps its seed offline. That protection fails if the seed was predictable when it was created. This page explains the affected COLDCARD firmware, what owners should do, and how the fault unfolded.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#owner-guidance"
                  className="inline-flex min-h-12 items-center justify-center gap-3 border border-accent bg-accent px-5 font-mono text-[9px] uppercase tracking-[0.15em] text-white transition-colors hover:border-white hover:bg-canvas"
                >
                  I own a COLDCARD
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
                <a
                  href="#mechanism"
                  className="inline-flex min-h-12 items-center justify-center gap-3 border border-white/30 px-5 font-mono text-[9px] uppercase tracking-[0.15em] text-white transition-colors hover:border-white"
                >
                  Understand the failure
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
            </motion.header>

            <nav aria-label="Page sections" className="border-y border-white/15 font-mono text-[9px] uppercase tracking-[0.16em]">
              <a href="#owner-guidance" className="flex min-h-11 items-center justify-between border-b border-white/10 text-ink-muted transition-colors hover:text-white">
                Owner guidance
                <span className="text-accent">01</span>
              </a>
              <a href="#timeline" className="flex min-h-11 items-center justify-between border-b border-white/10 text-ink-muted transition-colors hover:text-white">
                Timeline
                <span className="text-accent">02</span>
              </a>
              <a href="#mechanism" className="flex min-h-11 items-center justify-between border-b border-white/10 text-ink-muted transition-colors hover:text-white">
                Interactive explanation
                <span className="text-accent">03</span>
              </a>
              <a href="#numbers" className="flex min-h-11 items-center justify-between text-ink-muted transition-colors hover:text-white">
                What the numbers mean
                <span className="text-accent">04</span>
              </a>
            </nav>
          </div>
        </section>

        <section id="owner-guidance" className="scroll-mt-6 border-b border-accent/60 bg-accent/[0.10] px-4 py-10 md:px-8 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">For COLDCARD owners / Start here</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-white">Check how your seed was created.</h2>
                <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                  The firmware installed when the seed was first made is what matters. Updating today fixes future seed generation, but it does not change the seed already holding funds.
                </p>
              </div>
              <a
                href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-3 bg-white px-5 font-mono text-[9px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink"
              >
                Official migration guidance
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>

            <ol className="mt-9 grid border-y border-accent/35 lg:grid-cols-3">
              <li className="border-b border-accent/25 py-6 lg:border-b-0 lg:border-r lg:pr-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">01 / Check</p>
                <h3 className="mt-3 font-serif text-xl text-white">Was the seed made on affected firmware?</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                  Coinkite lists Mk2/Mk3 4.0.1–4.1.9; Mk4/Mk5 before standard 5.6.0 or Edge 6.6.0X; and Q before standard 1.5.0Q or Edge 6.6.0QX.
                </p>
              </li>
              <li className="border-b border-accent/25 py-6 lg:border-b-0 lg:border-r lg:px-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">02 / Update</p>
                <h3 className="mt-3 font-serif text-xl text-white">Install fixed firmware first.</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                  Use 4.2.0+ for Mk2/Mk3, 5.6.0+ or 6.6.0X+ for Mk4/Mk5, and 1.5.0Q+ or 6.6.0QX+ for Q. Standard and Edge are separate tracks.
                </p>
              </li>
              <li className="py-6 lg:pl-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">03 / Replace</p>
                <h3 className="mt-3 font-serif text-xl text-white">Create a new seed, then move carefully.</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                  Verify the backup, wallet fingerprint, and a receive address. Send a small test first. Move the rest only after it arrives, and keep the old backup until the migration is confirmed.
                </p>
              </li>
            </ol>

            <div className="mt-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What changes the answer?</p>
              <dl className="mt-3 grid border-t border-accent/35 sm:grid-cols-3">
                <div className="border-b border-accent/25 py-5 sm:border-b-0 sm:border-r sm:pr-5">
                  <dt className="font-serif text-base text-white">Fewer than 50 private dice rolls—or not sure</dt>
                  <dd className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Follow the official migration steps promptly.</dd>
                </div>
                <div className="border-b border-accent/25 py-5 sm:border-b-0 sm:border-r sm:px-5">
                  <dt className="font-serif text-base text-white">At least 50 fair, independent dice rolls</dt>
                  <dd className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">If the rolls stayed private, Coinkite does not consider the seed at risk from this fault alone.</dd>
                </div>
                <div className="py-5 sm:pl-5">
                  <dt className="font-serif text-base text-white">Strong, unique BIP39 passphrase</dt>
                  <dd className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">It adds a separate barrier, but does not repair the seed. Replace the affected seed as soon as practical. The COLDCARD PIN is not a passphrase.</dd>
                </div>
              </dl>
            </div>

            <a
              href="https://coldcard.com/downloads/"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-3 font-mono text-[9px] uppercase tracking-[0.15em] text-white underline decoration-accent underline-offset-4 transition-colors hover:text-accent"
            >
              Official firmware downloads
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-6 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What happened</p>
              <h2 className="mt-3 font-serif text-3xl text-white">The fault, from code change to firmware fix.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                The hardware generator did not break. New-wallet creation was routed around it.
              </p>
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
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="mechanism" className="scroll-mt-6 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Interactive explanation</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">Why an offline wallet could still be found.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                This small example shows the mechanism without creating wallet keys or reproducing COLDCARD firmware.
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
              The device does not have to be online. If someone can recreate its seed elsewhere, they can recreate the same wallet and test the guess against a public address.
            </p>
          </div>
        </section>

        <section id="numbers" className="scroll-mt-6 border-b border-white/10 bg-white/[0.025] px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Read the numbers carefully</p>
              <h2 className="mt-3 font-serif text-3xl text-white">Three figures describe different things.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                These are preliminary security estimates, not measured attack times and not a promise of how long funds remain safe.
              </p>
            </div>

            <dl className="mt-9 grid border-y border-white/15 lg:grid-cols-3">
              <div className="border-b border-white/10 py-6 lg:border-b-0 lg:border-r lg:pr-6">
                <dt className="font-serif text-3xl text-white">About 40 bits</dt>
                <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">Coinkite&apos;s current estimate for affected Mk2 and Mk3 seed searches.</dd>
              </div>
              <div className="border-b border-white/10 py-6 lg:border-b-0 lg:border-r lg:px-6">
                <dt className="font-serif text-3xl text-white">About 72 bits</dt>
                <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">Coinkite&apos;s current estimate for affected Mk4, Mk5, and Q seeds, which had extra secure-element input.</dd>
              </div>
              <div className="py-6 lg:pl-6">
                <dt className="font-serif text-3xl text-white">32 bits</dt>
                <dd className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">A constrained input in Block&apos;s later-model analysis—not proof that every complete seed came from one shared 32-bit pool.</dd>
              </div>
            </dl>

            <div className="mt-8 grid gap-4 border-l-2 border-accent pl-5 sm:grid-cols-[auto_1fr] sm:gap-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">About collision claims</p>
              <p className="max-w-3xl font-sans text-sm leading-relaxed text-ink">
                The widely shared birthday calculation works only if every complete seed is an independent draw from the same uniform 32-bit pool. That has not been shown for COLDCARD, and no verified duplicate-seed incident has been published. The fallback also depended on device identity, timing, and earlier calls.
              </p>
            </div>
          </div>
        </section>

        <details className="group border-b border-white/10 bg-white/[0.035] px-4 md:px-8">
          <summary className="mx-auto flex min-h-28 max-w-6xl cursor-pointer list-none items-center justify-between gap-6 py-5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Research record</p>
              <p className="mt-2 font-serif text-xl text-white">Sources and technical detail</p>
              <p className="mt-2 font-sans text-sm text-ink-muted">Incident figures, code-level findings, limits, and primary sources.</p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center border border-accent/70 font-mono text-lg text-white transition-colors group-hover:bg-accent group-open:bg-accent group-open:text-white" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="mx-auto max-w-6xl border-t border-white/10 py-8">
            <div className="grid gap-x-12 gap-y-9 lg:grid-cols-2">
              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Incident record</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    Galaxy Research estimates that three suspected sweep waves moved 1,367.05 BTC from 4,585 addresses. The first moved 1,082.65 BTC from 1,196 addresses in 41 minutes on 30 July.
                  </p>
                  <p>
                    On 3 August, Alex Thorn reported a separate 388.93 BTC cluster as a likely fourth wave. That link is still provisional. Bitcoin transactions alone do not identify the hardware model or firmware that created a key, so it is not added to the three-wave total here.
                  </p>
                  <p>
                    No public evidence identifies the tool used to find the fault. Coinkite says it has to assume AI was involved; that is an inference, not a confirmed attribution.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Code path and state</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    The fallback combined the low 32 bits of the chip ID with a processor counter. Its full state also depended on two clock registers and the number of earlier random-number calls. No published study has measured how those values cluster across a large set of physical devices.
                  </p>
                  <p>
                    Coinkite&apos;s advisory starts the Mk2/Mk3 range at 4.0.1. Tagged 4.0.0 source already uses the affected seed path; that source-level discrepancy is preserved in the links below.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Search limits</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    BIP39 runs every candidate through 2,048 HMAC-SHA512 steps. That slows each guess but cannot restore missing randomness. Existing GPU and FPGA studies cover related building blocks, not a complete COLDCARD search.
                  </p>
                  <p>
                    A practical later-model search has not been demonstrated publicly. Hardware-cost and rental-GPU estimates remain assumptions, not measured results.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">What a recovered seed exposes</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    A public address is enough to check a candidate offline. A recovered seed can reveal addresses and activity from that wallet, which may reduce privacy in a CoinJoin or PayJoin. It does not automatically expose every other participant.
                  </p>
                  <p>
                    One recovered key cannot spend from a shared policy that still needs a separate uncompromised key. Risk changes when affected keys can satisfy a normal or recovery path, including a Miniscript path once its conditions are met.
                  </p>
                </div>
              </section>
            </div>

            <p className="mt-9 max-w-3xl border-t border-white/10 pt-6 font-sans text-sm leading-relaxed text-ink-muted">
              The interactive explanation uses SHA-256 and 64 simulated starting secrets. It never handles wallet material, derives Bitcoin addresses, or reproduces COLDCARD firmware.
            </p>

            <div className="mt-8 grid border-t border-white/10 sm:grid-cols-2">
              <SourceLink label="Block analysis" href="https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware" />
              <SourceLink label="Coinkite backgrounder" href="https://blog.coinkite.com/entropy-technical-backgrounder/" />
              <SourceLink label="Coinkite migration advisory" href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/" />
              <SourceLink label="Galaxy Research: first sweep" href="https://x.com/glxyresearch/status/2083181683067506899" />
              <SourceLink label="Galaxy Research: three-wave estimate" href="https://x.com/glxyresearch/status/2083623500183421043" />
              <SourceLink label="Alex Thorn: provisional fourth wave" href="https://x.com/intangiblecoins/status/2084079706320646300" />
              <SourceLink label="STM32 chip-ID structure" href="https://community.st.com/stm32-mcus-60/how-to-obtain-and-use-the-stm32-96-bit-uid-125456" />
              <SourceLink label="MicroPython fallback source" href="https://github.com/Coldcard/micropython/blob/4107246f8a080807b62c3b4838e71e812ea68b6f/ports/stm32/rng.c#L74-L98" />
              <SourceLink label="Mk2/Mk3 4.0.0 seed source" href="https://github.com/Coldcard/firmware/blob/2021-03-17T1724-v4.0.0/shared/seed.py#L348-L359" />
              <SourceLink label="Official firmware downloads" href="https://coldcard.com/downloads/" />
              <SourceLink label="COLDCARD firmware source" href="https://github.com/Coldcard/firmware" />
              <SourceLink label="Bitcoin.org Android RNG alert" href="https://bitcoin.org/en/alert/2013-08-11-android" />
              <SourceLink label="BIP-39 specification" href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki" />
              <SourceLink label="FPGA HMAC-SHA512 implementation" href="https://cacr.uwaterloo.ca/techreports/2011/cacr2011-10.pdf" />
              <SourceLink label="FPGA wallet pipeline study" href="https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/blc2.70028" />
              <SourceLink label="GPU PBKDF2 acceleration study" href="https://www.usenix.org/system/files/conference/woot16/woot16-paper-ruddick.pdf" />
              <SourceLink label="Reported collection address" href="https://mempool.space/address/bc1qnk4zh9qcnap2mycp56qjrgza3cc8ylrh8fecp0" />
              <SourceLink label="Reported consolidation transaction" href="https://mempool.space/tx/0c6bf853a645b699a3b2cd6d8e3c44cf1a02a16f538df08212a44753f75d9d01" />
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
