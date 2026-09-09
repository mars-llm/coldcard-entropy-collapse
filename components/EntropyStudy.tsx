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
    nav: 'Pick one',
    title: 'This toy wallet can begin in only 64 ways.',
    body: 'The pattern and bits below show the same 256-bit value. Its length does not tell you how many starting choices there were.',
    action: 'Show the full list',
  },
  {
    label: '2',
    nav: 'Show all',
    title: 'An attacker can build the same list.',
    body: 'When the list is this small, every possible result can be calculated in advance.',
    action: 'Choose a target',
  },
  {
    label: '3',
    nav: 'Check each',
    title: 'Check the list until one result matches.',
    body: 'This demo compares SHA-256 results. A real wallet search would derive wallet addresses and compare them with public Bitcoin data.',
    action: 'Run the search',
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
    title: 'Later models added secure-element data, but retained only four bytes',
    body: 'Mk4, Mk5, and Q also used data from two secure elements: dedicated security chips. The affected path kept only four bytes of the result.',
    sourceHref: 'https://github.com/Coldcard/firmware/commit/01cb43f7e87cc806963a74cbe0fcb4155f23a2a3',
    sourceLabel: 'Reseed change',
  },
  {
    date: '30 July 2026 UTC',
    title: 'The first reported wallet sweeps',
    body: 'Galaxy later traced attacker activity to at least early 30 July. Blockchain data alone cannot show which device or firmware created a wallet; attribution also relied on victim reports.',
    sourceHref: 'https://www.galaxy.com/insights/research/coldcard-exploit-abates-as-total-losses-climb-to-at-least-1700-btc',
    sourceLabel: 'Galaxy incident report',
  },
  {
    date: '31 July 2026',
    title: 'The first firmware fix shipped',
    body: 'Coinkite corrected the random-number path for new seeds. Updating the firmware does not repair a seed already created through the affected path.',
    sourceHref: 'https://blog.coinkite.com/coldcard-firmware-update-5.6.2-1.5.2q/',
    sourceLabel: 'Coinkite release chronology',
  },
  {
    date: '20 August 2026',
    title: 'New seed creation required human input',
    body: 'The redesigned seed path samples fresh data from the processor and both secure elements, adds required key timing, dice, or coin flips, and checks the hardware path during boot and build.',
    sourceHref: 'https://github.com/Coldcard/firmware/blob/master/releases/History-Mk.md#561---2026-08-20',
    sourceLabel: '5.6.1 release notes',
  },
  {
    date: '4 September 2026',
    title: 'Coinkite announced seed-mixing verification',
    body: 'The 5.6.2 and 1.5.2Q announcement describes a way to inspect and independently check seed mixing, alongside further security changes. Migration guidance for affected seeds did not change.',
    sourceHref: 'https://blog.coinkite.com/coldcard-firmware-update-5.6.2-1.5.2q/',
    sourceLabel: 'Current firmware announcement',
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
  const sourcesRef = useRef<HTMLDetailsElement>(null);

  const openSources = () => {
    if (sourcesRef.current) sourcesRef.current.open = true;
  };

  useEffect(() => {
    const revealLinkedEvidence = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      const sources = sourcesRef.current;
      if (!target || !sources?.contains(target)) return;
      sources.open = true;
      target.scrollIntoView();
    };

    revealLinkedEvidence();
    window.addEventListener('hashchange', revealLinkedEvidence);
    return () => window.removeEventListener('hashchange', revealLinkedEvidence);
  }, []);

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
          className="flex min-h-11 min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-white"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Cryptographic Arts</span>
          <span className="sr-only sm:hidden">Return to Cryptographic Arts</span>
        </a>
        <p className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted sm:block">
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
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                Cold storage security case study / Updated 9 September 2026
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
                  className="inline-flex min-h-12 items-center justify-center gap-3 border border-accent bg-accent px-5 font-mono text-[11px] uppercase tracking-[0.15em] text-canvas transition-colors hover:border-white hover:bg-canvas hover:text-white"
                >
                  I own a COLDCARD
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
                <a
                  href="#failure"
                  className="inline-flex min-h-12 items-center justify-center gap-3 border border-white/30 px-5 font-mono text-[11px] uppercase tracking-[0.15em] text-white transition-colors hover:border-white"
                >
                  How did this happen?
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
              <p className="mt-5 max-w-2xl font-sans text-xs leading-relaxed text-ink-muted">
                Unaffiliated with Coinkite or COLDCARD. This page explains the failure; affected owners should follow Coinkite&apos;s{' '}
                <a href="https://coldcard.com/security/migrate" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">
                  migration guide
                </a>.
              </p>
            </motion.header>

            <nav aria-label="Page sections" className="grid grid-cols-2 gap-x-5 border-y border-white/15 font-mono text-[11px] uppercase tracking-[0.12em] lg:block">
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
                See the search
                <span className="text-accent">04</span>
              </a>
              <a href="#sources" onClick={openSources} className="flex min-h-11 items-center justify-between text-ink-muted transition-colors hover:text-white">
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
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">For COLDCARD owners / Start here</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-white">Could this affect my wallet?</h2>
                <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
                  What matters is the firmware used to create the seed—not the version installed today. Updating firmware or moving the same seed to another device does not repair it. A seed created elsewhere and later imported did not pass through this bug.
                </p>
              </div>
              <a
                href="https://coldcard.com/security/migrate"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-3 bg-white px-5 font-mono text-[11px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink"
              >
                Official migration guidance
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>

            <div className="mt-7 max-w-3xl border-l-2 border-accent pl-4">
              <h3 className="font-serif text-lg text-white">I don&apos;t know which firmware created my seed.</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
                If you cannot establish how the seed was generated, Coinkite says to follow its{' '}
                <a href="https://coldcard.com/security/migrate" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">migration process</a>.
                {' '}Check that you can recover the old wallet before replacing or erasing anything.
              </p>
            </div>

            <p className="mt-9 font-sans text-sm leading-relaxed text-ink-muted">
              Firmware checked against <a href="https://coldcard.com/security/status" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">Coinkite&apos;s status</a> and{' '}
              <a href="https://blog.coinkite.com/coldcard-firmware-update-5.6.2-1.5.2q/" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">release announcement</a> on 9 September 2026. Standard and Edge are separate tracks.
            </p>
            <div className="firmware-table mt-4 border-y border-accent/35">
              <div className="hidden gap-5 border-b border-accent/25 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-accent md:grid md:grid-cols-[8rem_1.2fr_1fr]">
                <span>Model</span>
                <span>Affected seed-creation firmware</span>
                <span>Latest release / 9 Sep 2026</span>
              </div>
              <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 border-b border-accent/20 py-4 font-sans text-sm sm:grid-cols-[10rem_1fr_1fr]">
                <strong className="font-normal text-white">Mk2 / Mk3</strong>
                <span className="text-ink-muted">4.0.0–4.1.9; 5.0.1-mk3; 5.0.3-mk3*</span>
                <span className="text-white">4.2.0 (final release)</span>
              </div>
              <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 border-b border-accent/20 py-4 font-sans text-sm sm:grid-cols-[10rem_1fr_1fr]">
                <strong className="font-normal text-white">Mk4 / Mk5</strong>
                <span className="text-ink-muted">Before 5.6.0 standard or 6.6.0X Edge</span>
                <span className="text-white">5.6.2 standard or 6.6.1X Edge</span>
              </div>
              <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 py-4 font-sans text-sm sm:grid-cols-[10rem_1fr_1fr]">
                <strong className="font-normal text-white">Q</strong>
                <span className="text-ink-muted">Before 1.5.0Q standard or 6.6.0QX Edge</span>
                <span className="text-white">1.5.2Q standard or 6.6.1QX Edge</span>
              </div>
            </div>
            <p className="mt-3 max-w-4xl font-sans text-xs leading-relaxed text-ink-muted">
              * Coinkite&apos;s advisory names 4.0.1–4.1.9. Public source and signed builds also show the affected route in 4.0.0, 5.0.1-mk3, and 5.0.3-mk3.{' '}
              <a href="#release-evidence" onClick={openSources} className="text-white underline decoration-accent underline-offset-4 hover:text-accent">See the release evidence</a>.
            </p>

            <ol className="mt-8 grid border-y border-accent/35 lg:grid-cols-3">
              <li className="border-b border-accent/25 py-5 lg:border-b-0 lg:border-r lg:pr-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">01 / Update</p>
                <h3 className="mt-2 font-serif text-lg text-white">Install current firmware.</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Confirm the version on the device before creating a replacement seed.</p>
              </li>
              <li className="border-b border-accent/25 py-5 lg:border-b-0 lg:border-r lg:px-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">02 / Replace</p>
                <h3 className="mt-2 font-serif text-lg text-white">Create a replacement seed and check the backup.</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Choose New Wallet. Check the backup, wallet fingerprint, and a receive address. Do not restore the old seed.</p>
              </li>
              <li className="py-5 lg:pl-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">03 / Move</p>
                <h3 className="mt-2 font-serif text-lg text-white">Send a test, then move the rest.</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Wait for confirmation. Keep the old backup until the move is complete.</p>
              </li>
            </ol>

            <details className="group mt-7 border-y border-accent/35">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-3">
                <span className="font-serif text-lg text-white">What if I used dice, a passphrase, or multisig?</span>
                <span className="flex size-9 shrink-0 items-center justify-center border border-accent/70 font-mono text-base text-white transition-transform group-open:rotate-45 group-open:bg-accent group-open:text-canvas" aria-hidden="true">+</span>
              </summary>
              <div className="grid gap-0 border-t border-accent/25 pb-2 lg:grid-cols-3">
                <div className="border-b border-accent/20 py-5 lg:border-b-0 lg:border-r lg:pr-5">
                  <h3 className="font-serif text-base text-white">Dice added during seed creation</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">Coinkite says this fault alone does not put a seed at risk if at least 50 fair, private dice rolls were added when it was created. Count the physical rolls, not only the number once shown on screen.</p>
                </div>
                <div className="border-b border-accent/20 py-5 lg:border-b-0 lg:border-r lg:px-5">
                  <h3 className="font-serif text-base text-white">Strong BIP-39 passphrase</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">A strong, unique passphrase adds a separate secret. It is not the PIN and does not repair the seed. Coinkite still advises replacing an affected seed.</p>
                </div>
                <div className="py-5 lg:pl-5">
                  <h3 className="font-serif text-base text-white">Multisig or another spending policy</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">If affected keys can reach the spending threshold by themselves, the wallet is at risk. If an independent healthy key is required, they cannot spend alone. Ask your wallet provider if you are unsure.</p>
                </div>
              </div>
            </details>

            <p className="mt-6 max-w-4xl border-l-2 border-white/70 pl-4 font-sans text-sm leading-relaxed text-white">
              Never enter seed words or a passphrase on any website. Ignore unsolicited recovery help.
            </p>

          </div>
        </section>

        <section id="failure" className="scroll-mt-20 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">What went wrong</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">During seed creation, the firmware bypassed the hardware random-number generator.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                The hardware generator still worked. A 2021 code change sent new-seed creation to a predictable software fallback instead.
              </p>
            </div>

            <div className="mt-9 border-y border-white/15">
              <div className="grid gap-4 border-b border-white/10 py-6 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">What should happen</p>
                <p className="font-serif text-xl text-white">New wallet → hardware randomness → seed</p>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">Intended</span>
              </div>
              <div className="grid gap-4 py-6 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">What happened</p>
                <p className="font-serif text-xl text-white">New wallet → predictable software generator → seed</p>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Affected firmware</span>
              </div>
            </div>

            <div className="mt-7 grid gap-4 border-l-2 border-accent pl-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
              <p className="font-serif text-lg text-white">How could an offline wallet be stolen?</p>
              <p className="max-w-3xl font-sans text-sm leading-relaxed text-ink-muted">
                The seed was weak from the moment it was created. An attacker could reproduce possible seeds on another computer and use public Bitcoin addresses to see when a guess was right. They never needed the COLDCARD. Bitcoin itself was not broken.
              </p>
            </div>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-20 border-b border-white/10 px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">What happened</p>
              <h2 className="mt-3 font-serif text-3xl text-white">The bug shipped in 2021 and was fixed in 2026.</h2>
            </div>

            <ol className="relative mt-10 border-l border-white/20">
              {TIMELINE.map((item) => (
                <li
                  key={item.date}
                  className="relative grid gap-3 border-b border-white/10 py-7 pl-7 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-7 sm:pl-9"
                >
                  <span className="absolute -left-[5px] top-9 size-[9px] rounded-full border border-accent bg-canvas" aria-hidden="true" />
                  <time className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{item.date}</time>
                  <div>
                    <h3 className="font-serif text-xl text-white">{item.title}</h3>
                    <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">{item.body}</p>
                    <a
                      href={item.sourceHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
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
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">What a small search space means</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-white">A long secret can still come from a short list.</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                This demonstration starts with 64 fictional choices. It creates no Bitcoin keys or addresses and does not run COLDCARD firmware.
              </p>
              <p className="mt-4 border-l-2 border-accent pl-4 font-sans text-sm leading-relaxed text-ink">
                The 64 choices and animation speed do not represent the real COLDCARD search space or attack time. No public end-to-end benchmark establishes a reliable attack time for later models.{' '}
                <a href="#search-limits" onClick={openSources} className="text-white underline decoration-accent underline-offset-4 hover:text-accent">Evidence and limits</a>.
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
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${
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
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Step {currentStage.label} of 3</p>
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
                      className="flex min-h-11 items-center gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-white"
                    >
                      <ArrowLeft size={13} aria-hidden="true" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={continueStudy}
                    disabled={searching || !targetClue}
                    className="flex min-h-11 items-center gap-3 border border-white/40 bg-white px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-black transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-50"
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

        <section id="resilience" className="border-b border-white/10 px-4 py-7 md:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-xl text-white">Test recovery before adding complexity.</h2>
            <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-ink-muted">
              Extra keys or a passphrase also create backup and recovery obligations. Coinkite&apos;s{' '}
              <a href="https://coldcard.com/security/migrate" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">migration guide</a> advises against delaying an urgent move to add an untested layer.
            </p>
          </div>
        </section>

        <details ref={sourcesRef} id="sources" className="group scroll-mt-20 border-b border-white/10 bg-white/[0.035] px-4 md:px-8">
          <summary className="mx-auto flex min-h-28 max-w-6xl cursor-pointer list-none items-center justify-between gap-6 py-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Evidence and caveats</p>
              <p className="mt-2 font-serif text-xl text-white">Sources and technical details</p>
              <p className="mt-2 font-sans text-sm text-ink-muted">Firmware code, reported losses, open questions, and links.</p>
            </div>
            <span className="flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted" aria-hidden="true">
              <span className="group-open:hidden">Open</span>
              <span className="hidden group-open:inline">Close</span>
              <span className="flex size-11 items-center justify-center border border-accent/70 text-lg text-white transition-transform group-hover:bg-accent group-hover:text-canvas group-open:rotate-45 group-open:bg-accent group-open:text-canvas">+</span>
            </span>
          </summary>
          <div className="mx-auto max-w-6xl border-t border-white/10 py-8">
            <div className="grid gap-x-12 gap-y-9 lg:grid-cols-2">
              <section>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Incident record</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    On 14 August, Galaxy Research said reports from 190 victims had helped it attribute 1,778.84 BTC from more than 8,600 addresses with high confidence. It found no confirmed attacker activity after 6 August. The count may still change as more victims report losses.
                  </p>
                </div>
              </section>

              <section>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">What the code shows</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    MicroPython&apos;s fallback started from limited device and timing data. Earlier calls changed the later output too. The route was deterministic, but the public code does not show every device choosing from one shared pool of 2³² complete seeds.
                  </p>
                  <p>
                    Coinkite lists Mk2/Mk3 4.0.1–4.1.9. Public source and signed release records also show the affected route in 4.0.0 and in Mk3 builds 5.0.1-mk3 and 5.0.3-mk3. That is why the table above includes all three.
                  </p>
                  <p>
                    In August, Mk4/Mk5 5.6.1 and Q 1.5.1Q shipped a redesigned seed path. It combines fresh output from the processor and both secure elements with required key timing, dice, or coin flips. It also adds boot and build checks. The current standard releases are 5.6.2 and 1.5.2Q; Mk3 4.2.0 remains final.
                  </p>
                </div>
              </section>

              <section id="search-limits" className="scroll-mt-20">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">What has not been measured</p>
                <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-ink-muted">
                  <p>
                    <a href="https://blog.coinkite.com/entropy-technical-backgrounder/" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">Coinkite estimates</a> about 40 bits for affected Mk2/Mk3 seeds and about 72 bits for Mk4/Mk5/Q.{' '}
                    <a href="https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware" target="_blank" rel="noreferrer" className="text-white underline decoration-accent underline-offset-4 hover:text-accent">Block counted</a> 2³² possibilities for one later-model input only after assuming the other state was already known. No public end-to-end benchmark provides a reliable attack time for later models.
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-8 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-2">
              <section>
                <h3 className="font-serif text-lg text-white">Owner guidance and fixed firmware</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Coinkite current security status" href="https://coldcard.com/security/status" />
                  <SourceLink label="Coinkite migration guide" href="https://coldcard.com/security/migrate" />
                  <SourceLink label="Current firmware downloads" href="https://coldcard.com/downloads/all" />
                  <SourceLink label="5.6.2 and 1.5.2Q announcement" href="https://blog.coinkite.com/coldcard-firmware-update-5.6.2-1.5.2q/" />
                  <SourceLink label="Original Coinkite advisory" href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/" />
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
                  <SourceLink label="5.6.1 seed-generation release notes" href="https://github.com/Coldcard/firmware/blob/master/releases/History-Mk.md#561---2026-08-20" />
                </div>
              </section>

              <section id="release-evidence" className="scroll-mt-20">
                <h3 className="font-serif text-lg text-white">Affected releases outside the advisory range</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Official 4.0.0 version history" href="https://coldcard.com/docs/version-history/#version-400-mar-17-2021" />
                  <SourceLink label="4.0.0 seed-generation source" href="https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/shared/seed.py#L348-L359" />
                  <SourceLink label="Signed 4.0.0 build record" href="https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/releases/signatures.txt#L5" />
                  <SourceLink label="Signed Mk3 5.0.1 and 5.0.3 builds" href="https://github.com/Coldcard/firmware/blob/d2acc4380b5ffcb10cf6ad1bc828a04794fd0c24/releases/signatures.txt#L8-L15" />
                </div>
              </section>

              <section>
                <h3 className="font-serif text-lg text-white">Reported on-chain activity</h3>
                <div className="mt-3 border-t border-white/10">
                  <SourceLink label="Galaxy: high-confidence loss estimate" href="https://www.galaxy.com/insights/research/coldcard-exploit-abates-as-total-losses-climb-to-at-least-1700-btc" />
                  <SourceLink label="TRM Labs incident analysis" href="https://www.trmlabs.com/resources/blog/the-largest-hardware-wallet-exploit-of-2026-inside-the-usd-116-million-coldcard-hack" />
                </div>
              </section>
            </div>
          </div>
        </details>
      </main>

      <footer className="flex flex-col gap-2 px-4 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted sm:flex-row sm:items-center sm:justify-between md:px-8">
        <span>Unaffiliated with Coinkite or COLDCARD.</span>
        <span className="flex flex-wrap items-center gap-x-2">
          <span>Developed by</span>
          <a href="https://github.com/marsmensch" target="_blank" rel="noreferrer" className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent">
            Marsmensch
          </a>
          <span>/</span>
          <a href="https://github.com/mars-llm" target="_blank" rel="noreferrer" className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent">
            mars-llm
          </a>
          <span>/ 2026</span>
        </span>
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
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">One of 64 possible toy secrets</p>
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
          className="mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-white disabled:opacity-40"
        >
          <RotateCcw size={12} aria-hidden="true" />
          Create another
        </button>
      </div>

      <ArrowRight className="hidden text-ink-muted lg:block" size={20} strokeWidth={1.2} aria-hidden="true" />

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">The same toy secret shown as 256 bits</p>
        <BitField bits={bits} />
      </div>
    </div>
  );
}

function LimitedBeginnings({ targetPattern }: { targetPattern: string[] }) {
  return (
    <div className="grid min-h-[21rem] items-center gap-10 lg:grid-cols-[1.1fr_auto_0.9fr]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">All possible toy secrets</p>
        <p className="mt-3 font-serif text-2xl text-white">64 in total</p>
        <CandidatePool />
      </div>

      <ArrowRight className="hidden text-accent lg:block" size={20} strokeWidth={1.2} aria-hidden="true" />

      <div className="border-y border-white/15 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">The result linked to one hidden secret</p>
        <p className="mt-3 font-serif text-2xl text-white">Find which secret produced it</p>
        <div className="mt-6">
          <CluePattern pattern={targetPattern} />
        </div>
        <p className="mt-5 max-w-sm font-sans text-xs leading-relaxed text-ink-muted">
          One of the 64 secrets produces this result. Finding it only requires checking the list.
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
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">Values to check</p>
        <p className="mt-3 font-serif text-2xl text-white">
          {candidate === null ? 'Ready' : found ? `Match: ${candidate + 1} of 64` : `Checking: ${candidate + 1} of 64`}
        </p>
        <CandidatePool candidate={candidate} found={found} />
      </div>

      <div className="border-y border-white/15">
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-white/15 py-5">
          <div>
            <p className="font-serif text-lg text-white">Target result</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">The result we need to match</p>
          </div>
          <CluePattern pattern={targetPattern} />
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-5 py-5">
          <div>
            <p className={`font-serif text-lg ${found ? 'text-accent' : 'text-white'}`}>
              {found ? 'Matched' : searching ? 'Checking' : 'Waiting'}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Result from the current guess</p>
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
        <p className="w-16 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
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
      className="flex min-h-14 items-center justify-between gap-4 border-b border-white/10 py-3 pr-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-white sm:pl-4"
    >
      {label}
      <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
    </a>
  );
}
