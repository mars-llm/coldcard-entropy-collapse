# Entropy Collapse

A visual case study of the weak random-number fallback found in affected COLDCARD firmware. It shows how a cold wallet can remain offline yet still be exposed when its starting secret came from a search space that was too small.

The demonstration uses SHA-256 and a 64-candidate toy space. It does not generate wallet material, derive Bitcoin addresses, or reproduce the affected firmware. The page keeps practical guidance separate from the walkthrough and links affected owners to [Coinkite's current migration advisory](https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/) and [official firmware downloads](https://coldcard.com/downloads/).

The affected path is present in Mk2/Mk3 4.0.0 through 4.1.9. Coinkite's owner advisory currently begins its stated range at 4.0.1, while the signed 4.0.0 source already uses the affected seed-generation path. Fixed releases begin with Mk2/Mk3 4.2.0, Mk4/Mk5 standard 5.6.0, Q standard 1.5.0Q, Mk4/Mk5 Edge 6.6.0X, and Q Edge 6.6.0QX. Updating fixes new seed generation; it does not repair a seed that already exists. Coinkite does not consider a seed at risk from this issue alone if at least 50 fair, independent, private dice rolls were added when it was created. A strong, unique BIP39 passphrase adds a separate barrier, but Coinkite still advises replacing the affected seed as soon as practical.

Galaxy Research estimates that three suspected sweep waves moved 1,367.05 BTC from 4,585 addresses. A separate 388.93 BTC cluster reported on 3 August as a likely fourth wave remains provisional and is not included in that estimate.

BIP-39 makes each candidate pass through 2,048 HMAC-SHA512 steps. Published FPGA work shows that HMAC-SHA512, PBKDF2, BIP-32 key derivation, and secp256k1 can run in dedicated hardware. The studies do not implement a COLDCARD search or establish a current FPGA-versus-GPU result, custom-ASIC cost, or complete attack time. The page therefore treats dedicated hardware as technically possible, not as evidence that the estimated 72-bit later-model space is easy to search.

Built to explain the failure, not to reproduce an attack. This project is not affiliated with Coinkite or COLDCARD.

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
- [Coinkite: Security Advisory and migration instructions](https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/)
- [Galaxy Research: first observed sweep](https://x.com/glxyresearch/status/2083181683067506899)
- [Galaxy Research: three-wave estimate](https://x.com/glxyresearch/status/2083623500183421043)
- [Alex Thorn: provisional fourth-wave report](https://x.com/intangiblecoins/status/2084079706320646300)
- [STMicroelectronics: STM32 96-bit UID structure](https://community.st.com/stm32-mcus-60/how-to-obtain-and-use-the-stm32-96-bit-uid-125456)
- [MicroPython: fallback RNG initialization](https://github.com/Coldcard/micropython/blob/4107246f8a080807b62c3b4838e71e812ea68b6f/ports/stm32/rng.c#L74-L98)
- [COLDCARD Mk2/Mk3 4.0.0 seed-generation source](https://github.com/Coldcard/firmware/blob/2021-03-17T1724-v4.0.0/shared/seed.py#L348-L359)
- COLDCARD hotfix downloads: [Mk3 4.2.0](https://coldcard.com/downloads/mk3), [Mk4/Mk5 5.6.0](https://coldcard.com/downloads/mk), [Q 1.5.0Q](https://coldcard.com/downloads/q1), and [Edge 6.6.0X or 6.6.0QX](https://coldcard.com/downloads/edge)
- [LLFOURN: early search-space model with explicit assumptions](https://x.com/LLFOURN/status/2082990000896147942)
- [COLDCARD: verifying dice-roll entropy](https://coldcard.com/docs/verifying-dice-roll-math/)
- [BIP-39 specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [University of Waterloo: FPGA Implementation of an HMAC Processor based on the SHA-2 Family of Hash Functions](https://cacr.uwaterloo.ca/techreports/2011/cacr2011-10.pdf)
- [EthVault: a resource-conscious FPGA wallet pipeline](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/blc2.70028)
- [USENIX WOOT 2016: Acceleration Attacks on PBKDF2](https://www.usenix.org/system/files/conference/woot16/woot16-paper-ruddick.pdf)
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
