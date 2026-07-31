# Entropy Collapse

An independent visual case study of a weak random-number fallback in affected COLDCARD firmware. It explains how a cold wallet can remain offline yet be exposed if its secret was predictable when the wallet created it.

The demonstration uses SHA-256 and a 64-candidate toy space. It does not generate wallet material, derive Bitcoin addresses, or reproduce the affected firmware. For affected owners, the page links to [Coinkite's official migration advisory](https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/) and [official firmware downloads](https://coldcard.com/downloads/). Fixed releases are Mk3 4.2.0, Mk4/Mk5 5.6.0, Q 1.5.0Q, and Edge 6.6.0X or 6.6.0QX. Updating fixes new seed generation; it does not repair an existing seed.

This is an independent educational project. It is not affiliated with Coinkite or COLDCARD.

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run check
```

The production build is a static export in `out/`.

## GitHub Pages

Pushing `main` runs the Node 24 deployment workflow. The published site is available at `https://mars-llm.github.io/coldcard-entropy-collapse/` after GitHub Pages finishes deploying.

## Sources

- [Block Engineering: Predictable RNG Fallback and 32-Bit Reseed in COLDCARD Firmware](https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware)
- [Coinkite: Technical Deep Dive into the Entropy Issue](https://blog.coinkite.com/entropy-technical-backgrounder/)
- [Coinkite: Mk3 Security Advisory and migration instructions](https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/)
- COLDCARD hotfix downloads: [Mk3 4.2.0](https://coldcard.com/downloads/mk3), [Mk4/Mk5 5.6.0](https://coldcard.com/downloads/mk), [Q 1.5.0Q](https://coldcard.com/downloads/q1), and [Edge 6.6.0X or 6.6.0QX](https://coldcard.com/downloads/edge)
- [LLFOURN: public 40.3-bit and 72.3-bit search-space model](https://x.com/LLFOURN/status/2082990000896147942)
- [COLDCARD: verifying dice-roll entropy](https://coldcard.com/docs/verifying-dice-roll-math/)
- [BIP-39 specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [EFF: dice-generated random passphrases](https://www.eff.org/dice)
- [Bitcoin.org: Android secure-random vulnerability affecting software wallets](https://bitcoin.org/en/alert/2013-08-11-android)
- [Bitcoin Developer Guide: wallet architecture and offline-wallet caveats](https://developer.bitcoin.org/devguide/wallets.html)
- [Trezor: entropy sources used during wallet creation](https://trezor.io/guides/trezor-devices/trezor-fundamentals/what-is-entropy-and-how-does-trezor-generate-your-wallet)
- [Trezor: Entropy Check](https://trezor.io/learn/security-privacy/how-trezor-keeps-you-safe/entropy-check-how-trezor-verifies-your-wallet-is-truly-random)
- [Rob Hamilton: public incident analysis on X](https://x.com/Rob1Ham/status/2082896614218203616)
- [Reported incident collection address](https://mempool.space/address/bc1qnk4zh9qcnap2mycp56qjrgza3cc8ylrh8fecp0)
- [Reported consolidation address](https://mempool.space/address/bc1qq85v2c926eg6pgxhwp6q7lf6cnsz80qs3fcu9r)
- [562.02 BTC consolidation transaction](https://mempool.space/tx/0c6bf853a645b699a3b2cd6d8e3c44cf1a02a16f538df08212a44753f75d9d01)
- [COLDCARD firmware source](https://github.com/Coldcard/firmware)
- [Cryptographic Arts](https://mars-llm.github.io/hal-finney-trading-algorithms/)
