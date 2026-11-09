/* Headless click-through suite for preview/ui-preview.html.
 * Run from the repo root:  npm i -D jsdom && node preview/tests/ui-preview.flows.test.mjs
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
vc.on('jsdomError', e => { const m = e.stack||e.message; if(!/Not implemented/.test(m)) errors.push(m); });
const dom = new JSDOM(html,{runScripts:'dangerously',url:'https://vibemusic.test/',pretendsToBeVisual:true,virtualConsole:vc});
const w = dom.window, d = w.document;
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const ok = (n,c,x='') => console.log(`${c?'PASS':'FAIL'}  ${n}${x?'  — '+x:''}`);
const q = s => d.querySelector(s);
const click = el => el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
const getS = () => JSON.parse(w.localStorage.getItem('vibemusic:prototype:v4')||'null');
await sleep(80);

// preset mission from home
const preset = q('[data-act="preset"]');
ok('home has preset missions', !!preset, preset?.textContent.trim().slice(0,30));
click(preset); await sleep(60);
ok('preset fills the prompt input', q('#promptInput')?.value?.length > 5, q('#promptInput')?.value);
ok('preset marked active', (q('[data-act="preset"]')?.className||'').includes('on'));

// run from home
click(q('[data-act="run-mission"]'));
await sleep(5200);
const s = getS();
ok('home mission completes', s.missions.length > 0, `${s.missions.length} missions`);
ok('home receipts filled', d.querySelectorAll('#receipts .receipt').length > 0, `${d.querySelectorAll('#receipts .receipt').length}`);
ok('home trace all done', [...d.querySelectorAll('#steps .step')].every(e=>e.className.includes('done')));

// history row expands
w.location.hash = '#/agent'; await sleep(120);
const row = q('[data-act="toggle-mission"]');
ok('mission row rendered', !!row, `${d.querySelectorAll('[data-act="toggle-mission"]').length} rows`);
click(row); await sleep(60);
ok('mission row expands steps', !!q('.steps-in'), (q('.steps-in')?.textContent||'').slice(0,50));

// empty mission -> guarded
const input = q('[data-model="prompt"]');
input.value = ''; input.dispatchEvent(new w.Event('input',{bubbles:true}));
click(q('[data-act="run-mission"]')); await sleep(200);
ok('empty mission rejected with toast', /mission/i.test(q('#toasts')?.textContent||''), (q('#toasts')?.textContent||'').slice(0,60));

// reset
click(q('[data-act="reset"]')); await sleep(150);
const s2 = getS();
ok('reset restores seed jars', s2.jars.length === 8, `${s2.jars.length} jars`);
ok('reset reports success', /reset/i.test(q('#toasts')?.textContent||''));
await sleep(6000); // let toasts settle
ok('no runtime errors', errors.length===0, errors.slice(0,2).join(' | '));
dom.window.close();
