# Entropy Collapse

[Read the case study](https://mars-llm.github.io/coldcard-entropy-collapse/)

In affected COLDCARD firmware, new-wallet creation used a deterministic software fallback instead of the intended hardware-randomness path. Seeds created through that path could be searched offline, even though the device itself never went online.

The page starts with current owner guidance, lists the affected and fixed firmware ranges, traces the code change, and shows why a long secret can still be weak when it comes from a short list. Its demonstration uses 64 fictional values and the browser's SHA-256 implementation. It does not create wallet material, derive Bitcoin addresses, or run COLDCARD firmware.

Updating fixes future seed creation; it does not repair an affected existing seed. The page links owners to Coinkite's current [security status](https://coldcard.com/security/status) and [migration guide](https://coldcard.com/security/migrate).

Reported losses, entropy estimates, and affected version details remain in the evidence section with their sources and limits. This project is not affiliated with Coinkite or COLDCARD.

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
- [Coinkite: 5.6.2 and 1.5.2Q firmware announcement](https://blog.coinkite.com/coldcard-firmware-update-5.6.2-1.5.2q/)
- [COLDCARD: Current firmware downloads](https://coldcard.com/downloads/all)
- [Galaxy Research: High-confidence loss estimate](https://www.galaxy.com/insights/research/coldcard-exploit-abates-as-total-losses-climb-to-at-least-1700-btc)
- [TRM Labs: Incident analysis](https://www.trmlabs.com/resources/blog/the-largest-hardware-wallet-exploit-of-2026-inside-the-usd-116-million-coldcard-hack)
- [STMicroelectronics: STM32 96-bit UID structure](https://community.st.com/stm32-mcus-60/how-to-obtain-and-use-the-stm32-96-bit-uid-125456)
- [MicroPython: fallback RNG initialization](https://github.com/Coldcard/micropython/blob/4107246f8a080807b62c3b4838e71e812ea68b6f/ports/stm32/rng.c#L74-L98)
- [COLDCARD official version history: 4.0.0](https://coldcard.com/docs/version-history/#version-400-mar-17-2021)
- [COLDCARD Mk2/Mk3 4.0.0 seed-generation source](https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/shared/seed.py#L348-L359)
- [Signed Mk2/Mk3 4.0.0 build record](https://github.com/Coldcard/firmware/blob/75addaefcb5b1861e1c8986195a448ac3f94a303/releases/signatures.txt#L5)
- [Signed Mk3 5.0.1 and 5.0.3 build records](https://github.com/Coldcard/firmware/blob/d2acc4380b5ffcb10cf6ad1bc828a04794fd0c24/releases/signatures.txt#L8-L15)
- [Main firmware hardware-RNG hotfix](https://github.com/Coldcard/firmware/commit/ca72463709f4e3f8964952039d5caf955f566a87)
- [Mk2/Mk3 legacy hardware-RNG hotfix](https://github.com/Coldcard/firmware/commit/4543629941a83a3e2788ac06a12b208338cb8314)
- [Mk4/Mk5 5.6.1 seed-generation release notes](https://github.com/Coldcard/firmware/blob/master/releases/History-Mk.md#561---2026-08-20)
- [COLDCARD: verifying dice-roll entropy](https://coldcard.com/docs/verifying-dice-roll-math/)
- [Bitcoin.org: Android secure-random vulnerability affecting software wallets](https://bitcoin.org/en/alert/2013-08-11-android)
- [COLDCARD firmware source](https://github.com/Coldcard/firmware)
- [Cryptographic Arts](https://mars-llm.github.io/hal-finney-trading-algorithms/)

## License

[0BSD](LICENSE). You may use, copy, modify or distribute this project for any purpose, without attribution. The license includes warranty and liability disclaimers.
