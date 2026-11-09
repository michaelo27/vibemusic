/* Headless click-through suite for preview/ui-preview.html.
 * Run from the repo root:  npm i -D jsdom && node preview/tests/ui-preview.test.mjs
 * Drives the page with real mouse events and asserts on both the rendered DOM
 * and the persisted state (localStorage key vibemusic:prototype:v4).
 */
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
/* Run from the repo root after `npm i -D jsdom`:
 *   node preview/tests/ui-preview.test.mjs      # wallet · tip · mission · create-jar (33 checks)
 *   node preview/tests/ui-preview.flows.test.mjs # presets · history · guards · reset
 * Both drive preview/ui-preview.html through real DOM clicks and assert on rendered output + state.
 */

const html = fs.readFileSync(new URL('../ui-preview.html', import.meta.url), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { const m = e.stack || e.message; if (!/Not implemented/.test(m)) errors.push('jsdomError: ' + m); });
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://vibemusic.test/', pretendsToBeVisual: true, virtualConsole: vc });
const { window } = dom;
const doc = window.document;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = () => doc.body.textContent.replace(/\s+/g, ' ');
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);

const click = el => {
  if (!el) throw new Error('element not found for click');
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
};
const q = sel => doc.querySelector(sel);
const getS = () => JSON.parse(window.localStorage.getItem('vibemusic:prototype:v4') || 'null');
const byText = (sel, re) => [...doc.querySelectorAll(sel)].find(e => re.test(e.textContent));

await sleep(50);

// 1. initial render
ok('initial render mounts app', (doc.getElementById('app')?.innerHTML || '').length > 500);
ok('home shows hero + jars', /tip jar|VibeMusic/i.test(txt()), `${doc.querySelectorAll('[data-act="tip"]').length} tip buttons`);

// 2. wallet modal opens
const connectBtn = byText('button, [data-act="connect"]', /connect wallet/i) || q('[data-act="connect"]');
ok('found a connect-wallet control', !!connectBtn);
click(connectBtn);
await sleep(50);
ok('wallet modal opened', !!q('#modalRoot .modal'));
ok('offers simulated wallets', doc.querySelectorAll('[data-act="pick-wallet"]').length >= 3,
  `${doc.querySelectorAll('[data-act="pick-wallet"]').length} options`);

// 2b. clicking inside the dialog must NOT close it
click(q('#modalRoot .modal h3'));
await sleep(20);
ok('click inside dialog keeps it open', !!q('#modalRoot .modal'));

// 2c. the ✕ closes it
click(byText('#modalRoot button', /✕/) || q('#modalRoot [data-act="close-modal"]'));
await sleep(20);
ok('✕ closes modal', !q('#modalRoot .modal'));

// 3. connect simulated wallet
click(byText('button, [data-act="connect"]', /connect wallet/i) || q('[data-act="connect"]'));
await sleep(30);
click(q('[data-act="pick-wallet"][data-kind="sim-demo"]'));
await sleep(120);
const S1 = getS();
ok('wallet connected (state)', !!S1.wallet, S1.wallet);
ok('header shows address', new RegExp(S1.wallet.slice(2,6), 'i').test(txt()));
ok('balance rendered', /250/.test(txt()));
ok('toast fired', !!q('#toasts .toast'));

// 4. human tip flow on a jar page
window.location.hash = '#/@shrivl';
await sleep(120);
ok('jar route rendered', /@shrivl/.test(txt()), `hash=${window.location.hash}`);
const tipBtn = q('[data-act="tip"]');
ok('jar page has tip button', !!tipBtn, tipBtn?.textContent.trim());
click(tipBtn);
await sleep(120);
ok('tip phase → signing/confirming', /signing|Submitting|Confirming|approve/i.test(txt()));
await sleep(2200);
const S2 = getS();
ok('tip recorded in state', S2.tips.some(t => !t.agent && t.amount > 0), `${S2.tips.length} tips`);
ok('tip success toast', /Tipped/.test(q('#toasts')?.textContent || ''));
ok('balance decreased', S2.balance < 250, String(S2.balance));

// 5. agent mission
window.location.hash = '#/agent';
await sleep(120);
ok('agent console rendered', /Agent console/i.test(txt()) && !!q('#steps'));
const runBtn = q('[data-act="run-mission"]');
ok('run-mission button present', !!runBtn, runBtn?.textContent.trim());
click(runBtn);
await sleep(300);
const stepStates = () => [...doc.querySelectorAll('#steps .step')].map(e => e.className.split(' ')[1] || 'idle');
ok('trace starts animating', stepStates().some(s => s === 'active'), stepStates().join(','));
await sleep(4600);
ok('trace finishes all phases', stepStates().every(s => s === 'done'), stepStates().join(','));
await sleep(2500);
const S3 = getS();
ok('mission stored', S3.missions.length > 0, `${S3.missions.length} missions`);
ok('agent receipts rendered', doc.querySelectorAll('#receipts .receipt').length > 0 || /Nothing cleared|Skipped/.test(txt()),
  `${doc.querySelectorAll('#receipts .receipt').length} receipts`);
ok('agent balance spent', S3.agent.vibes < 1840, String(S3.agent.vibes));
ok('run button re-enabled', !q('[data-act="run-mission"]')?.disabled);

// 6. create jar
window.location.hash = '#/create';
await sleep(120);
const nameInput = q('[data-model="draft.name"]');
ok('create form rendered', !!nameInput && !!q('[data-model="draft.slug"]'));
nameInput.value = 'Nova Beats';
nameInput.dispatchEvent(new window.Event('input', { bubbles: true }));
await sleep(30);
ok('slug auto-derived', q('[data-model="draft.slug"]')?.value === 'nova-beats', q('[data-model="draft.slug"]')?.value);
ok('live preview updated', /Nova Beats/.test(q('#pvName')?.textContent || ''));
ok('checklist ticks name', (q('#ckName')?.className || '').includes('ok'));
// add a track
const addInput = q('[data-model="ui.trackDraft"]') || q('input[placeholder*="track" i]');
if (addInput) {
  addInput.value = CATALOGUE_ID(0);
  addInput.dispatchEvent(new window.Event('input', { bubbles: true }));
  click(q('[data-act="add-track"]'));
  await sleep(60);
}
ok('publish enabled after required fields', !q('[data-act="publish"]')?.disabled,
  `tracks=${(getS().ui.draft?.trackIds || []).length}`);
const pub = q('[data-act="publish"]');
if (pub && !pub.disabled) {
  click(pub);
  await sleep(150);
  ok('publish navigates to the new jar', /nova-beats/.test(window.location.hash || ''), window.location.hash);
} else {
  ok('publish navigates to the new jar', false, 'publish stayed disabled');
}

// 7. persistence + reset
ok('state persisted to localStorage', !!window.localStorage.getItem('vibemusic:prototype:v4'));
ok('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));

function CATALOGUE_ID(i) {
  const m = html.match(/id:'([^']+)'/g) || [];
  return m[i] ? m[i].slice(4, -1) : '';
}
dom.window.close();
