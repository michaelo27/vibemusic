/* Headless click-through suite for preview/ui-preview.html.
 * Run from the repo root:  npm i -D jsdom && node preview/tests/ui-preview.wallet.test.mjs
 * Drives the page with real mouse events and asserts on both the rendered DOM
 * and the persisted state (localStorage key vibemusic:prototype:v4).
 */
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const html = fs.readFileSync(new URL('../ui-preview.html', import.meta.url), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { const m = e.stack||e.message; if(!/Not implemented/.test(m)) errors.push(m); });
const dom = new JSDOM(html,{runScripts:'dangerously',url:'https://vibemusic.test/',pretendsToBeVisual:true,virtualConsole:vc});
const w = dom.window, d = w.document;
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const ok = (n,c,x='') => console.log(`${c?'PASS':'FAIL'}  ${n}${x?'  — '+x:''}`);
const q = s => d.querySelector(s);
const click = el => { if(!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true})); };
const getS = () => JSON.parse(w.localStorage.getItem('vibemusic:prototype:v4')||'null');
await sleep(80);

// theme: light by default, toggle persists
ok('defaults to light theme', d.documentElement.dataset.theme === 'light', d.documentElement.dataset.theme);
ok('toggle renders an icon (moon) in light mode', !!q('[data-act="theme"] svg'));
click(q('[data-act="theme"]')); await sleep(30);
ok('toggles to dark', d.documentElement.dataset.theme === 'dark');
ok('theme persisted', w.localStorage.getItem('vibemusic:theme') === 'dark');
ok('toggle renders an icon (sun) in dark mode', !!q('[data-act="theme"] svg'));
click(q('[data-act="theme"]')); await sleep(30);
ok('toggles back to light', d.documentElement.dataset.theme === 'light');

// real wallet: hidden-provider case first
click(q('[data-act="connect"]')); await sleep(40);
const injected = q('[data-act="pick-wallet"][data-kind="injected"]');
ok('browser-wallet option is always listed', !!injected, injected?.querySelector('b')?.textContent);
ok('it is disabled with no provider', injected.disabled, 'disabled=' + injected.disabled);
ok('explains why it is disabled', /sandboxed frame|no wallet extension/i.test(q('.notice')?.textContent || ''));
click(q('.xbtn')); await sleep(20);

// now pretend a wallet extension is injected
let calls = [];
w.ethereum = { request: async ({ method, params }) => {
  calls.push(method);
  if (method === 'eth_requestAccounts') return ['0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'];
  if (method === 'eth_call') return '0x' + (1250n * 10n ** 18n).toString(16);
  return null;
} };
click(q('[data-act="connect"]')); await sleep(40);
const inj2 = q('[data-act="pick-wallet"][data-kind="injected"]');
ok('option enables when a provider exists', !inj2.disabled);
ok('no scary notice once detected', !q('.notice'));
click(inj2); await sleep(200);
const s = getS();
ok('calls eth_requestAccounts', calls.includes('eth_requestAccounts'), calls.join(' → '));
ok('real address stored', s.wallet === '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', s.wallet);
ok('real on-chain balance read', Math.round(s.balance) === 1250, String(s.balance));
ok('switches to Base (0x2105)', calls.includes('wallet_switchEthereumChain'));
ok('header shows it', /Ab58/.test(d.body.textContent));
ok('real wallet is not marked simulated', s.customWallet === true);

// tipping with a real wallet must not fabricate a balance change
w.location.hash = '#/@konzyk'; await sleep(120);
const before = getS().balance;
click(q('[data-act="tip"]')); await sleep(2100);
const after = getS();
ok('tip goes through', after.tips.some(t => t.from === '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'));
ok('real balance is not faked lower', after.balance === before, `${before} → ${after.balance}`);

ok('no runtime errors', errors.length === 0, errors.slice(0,2).join(' | '));
dom.window.close();
