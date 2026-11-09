# Prototype click-through tests

Three jsdom suites that drive `preview/ui-preview.html` with real mouse events and assert
on both the rendered DOM and the persisted state (`vibemusic:prototype:v4`). They run fully
offline — the prototype scores a baked-in 14-track Audius catalogue, so no keys, RPC or
network access are needed.

```bash
npm i -D jsdom
node preview/tests/ui-preview.test.mjs        # 33 — mount · wallet · tip · mission · create jar
node preview/tests/ui-preview.flows.test.mjs  # 12 — presets · history · guards · reset
node preview/tests/ui-preview.wallet.test.mjs # 20 — theme toggle · real injected wallet path
```

`ui-preview.wallet.test.mjs` fakes `window.ethereum` to prove the real-wallet branch:
it asserts `eth_requestAccounts` is called, the address is stored, the on-chain balance is
read via `eth_call`, the chain is switched to Base (`0x2105`), and that tipping with a real
wallet does not fabricate a balance change.

These tests caught bugs that made earlier builds feel dead: a seed tip pointing at a
non-existent handle (threw on load, nothing mounted), a mission runner reading the wrong
input, a modal ✕ swallowed by its backdrop, and a sticky modal that survived navigation.
