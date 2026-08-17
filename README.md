# Entropy Collapse

A visual case study of a COLDCARD seed-generation failure. A firmware integration mistake sent new-wallet creation through a deterministic software generator instead of the intended hardware-randomness path. The site shows why an offline wallet can still be exposed when the seed was created from too few plausible possibilities.

The demonstration uses SHA-256 and a 64-candidate toy space. It does not generate wallet material, derive Bitcoin addresses, or reproduce the affected firmware. The page keeps practical guidance separate from the walkthrough and directs affected owners to [Coinkite's current migration guide](https://coldcard.com/security/migrate), which links the correct download for each model and release track.

Coinkite's advisory lists Mk2/Mk3 4.0.1–4.1.9. Public source and signed release records also show the affected route in 4.0.0 and in two old Mk3 builds named 5.0.1-mk3 and 5.0.3-mk3. For Mk3, the fixed release is 4.2.0. Fixed releases for later models begin with Mk4/Mk5 standard 5.6.0, Q standard 1.5.0Q, Mk4/Mk5 Edge 6.6.0X, and Q Edge 6.6.0QX. Updating corrects future seed generation; it does not repair an existing seed.

Coinkite does not consider a seed at risk from this fault alone if at least 50 fair, independent, private dice rolls were added during seed creation. Current firmware downloads predate a merged fix for held digits being counted more than once, so this exception depends on the physical rolls—not only the number shown on screen. Anyone who held keys or is unsure should follow the migration guidance. A strong, unique BIP-39 passphrase adds a separate barrier, but does not repair the seed. Coinkite still advises replacing the affected seed as soon as practical.

Coinkite's current status page cites targeted checks of the July hotfix, including real-device hardware-RNG instrumentation, source review across the fixed release lines, and a reproducible 5.6.0 build and dice-path trace. It also says these checks are not a complete audit. Further safeguards have been merged into source but have not shipped in a newer firmware download.

Galaxy Research groups three suspected sweep waves whose transaction inputs total 1,367.05 BTC across 4,585 addresses. In a 3 August update, Alex Thorn reported a revised, separate provisional cluster of 448.73 BTC across 709 addresses and said the earlier set included 89 addresses from misclassified multisig transactions. The fourth cluster has no direct confirmation from affected owners and is not included in Galaxy's three-wave estimate. Galaxy says its classification is based on blockchain patterns, not on reconstructed seeds.

BIP-39 derives a wallet seed with PBKDF2-HMAC-SHA512 using 2,048 iterations. Published research shows that individual hashing, PBKDF2, and wallet-derivation operations can be accelerated on GPUs or dedicated hardware. None of the linked studies benchmarks a complete search for this COLDCARD incident, establishes a current GPU-versus-FPGA result, or proves a practical attack time for later models.

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
- [Coinkite: Current security status](https://coldcard.com/security/status)
- [Coinkite: Step-by-step migration guide](https://coldcard.com/security/migrate)
- [Galaxy Research: revised first-wave count](https://x.com/glxyresearch/status/2083560956416741448)
- [Galaxy Research: three-wave estimate](https://x.com/glxyresearch/status/2083623500183421043)
- [Galaxy Research: limits of its on-chain classification](https://x.com/glxyresearch/status/2083623504285421622)
- [Alex Thorn: revised provisional fourth-wave report](https://x.com/intangiblecoins/status/2084117621864046698)
- [STMicroelectronics: STM32 96-bit UID structure](https://community.st.com/stm32-mcus-60/how-to-obtain-and-use-the-stm32-96-bit-uid-125456)
- [MicroPython: fallback RNG initialization](https://github.com/Coldcard/micropython/blob/4107246f8a080807b62c3b4838e71e812ea68b6f/ports/stm32/rng.c#L74-L98)
- [COLDCARD official version history: 4.0.0](https://coldcard.com/docs/version-history/#version-400-mar-17-2021)
- [COLDCARD Mk2/Mk3 4.0.0 seed-generation source](https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/shared/seed.py#L348-L359)
- [Signed Mk2/Mk3 4.0.0 build record at 17:20](https://github.com/Coldcard/firmware/blob/38f4e177c928fffc7c1378aac67f7dead8befe80/releases/signatures.txt#L5)
- [Signed Mk2/Mk3 4.0.0 build record at 17:24](https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/releases/signatures.txt#L5)
- [Signed Mk3 5.0.1 and 5.0.3 build records](https://github.com/Coldcard/firmware/blob/d2acc4380b5ffcb10cf6ad1bc828a04794fd0c24/releases/signatures.txt#L8-L15)
- [Mk3 5.0.1 seed-generation source](https://github.com/Coldcard/firmware/blob/e909bc0326feb63ce17891a8d14b0966996e4f5d/shared/seed.py#L370)
- [Mk3 5.0.3 seed-generation source](https://github.com/Coldcard/firmware/blob/fd83de540a0edd6f9bc6efb2626f6b1b858f551d/shared/seed.py#L370)
- [Main firmware hardware-RNG hotfix](https://github.com/Coldcard/firmware/commit/ca72463709f4e3f8964952039d5caf955f566a87)
- [Mk2/Mk3 legacy hardware-RNG hotfix](https://github.com/Coldcard/firmware/commit/4543629941a83a3e2788ac06a12b208338cb8314)
- [Merged held-key dice fix](https://github.com/Coldcard/firmware/pull/721)
- [Post-hotfix RNG fault handling for later models](https://github.com/Coldcard/firmware/pull/693)
- [Post-hotfix RNG fault handling for Mk2/Mk3](https://github.com/Coldcard/firmware/pull/695)
- [Post-hotfix RNG startup check](https://github.com/Coldcard/firmware/pull/694)
- [Merged RNG path build check](https://github.com/Coldcard/firmware/pull/700)
- [Merged seed-generation redesign](https://github.com/Coldcard/firmware/pull/727)
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
