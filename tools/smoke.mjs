#!/usr/bin/env node
/**
 * 几何游乐场 · 无头浏览器全站巡检脚本
 *
 * 先用 Vite 打包到 dist/，再在无头 Edge/Chrome 里逐页检查打包后的站点。
 *
 * 用法：
 *   npm run smoke                  # 全站巡检：首页、展馆、问答页、游乐场（桌面 + 手机）
 *   npm run smoke -- mobius        # 定向巡检指定实验的问答页和游乐场
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { build } from 'vite';
import { halls } from '../src/catalog.js';
import { geometryTalks, geometryWiki } from '../src/geometry-story-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

function findBrowser() {
  const envBin = process.env.BROWSER_BIN || process.env.CHROME_PATH;
  if (envBin && fs.existsSync(envBin)) return envBin;
  const candidates = process.platform === 'win32'
    ? [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      ]
    : ['/usr/bin/google-chrome', '/usr/bin/microsoft-edge', '/usr/bin/chromium'];
  for (const bin of candidates) if (fs.existsSync(bin)) return bin;
  throw new Error('未找到 Edge/Chrome，请设置 BROWSER_BIN 环境变量。');
}

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const safe = path.normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
      const file = path.join(DIST, safe);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));
const filterIds = process.argv.slice(2).filter(a => !a.startsWith('--'));
const lessons = halls.flatMap(h => h.lessons);
const allLabIds = filterIds.length ? filterIds : lessons.map(l => l.id);
const spatialLabs = {
  'cube-section': ['#section-offset', 0, '5.20'],
  sphere: ['#longitude', 150, '330°'],
  mobius: ['#ribbon-lap', 2, '1 条'],
  tesseract: ['#four-slice', 0, '正方体'],
  'conic-slices': ['#conic-angle', 68, '双曲线'],
};
const addedLabs = new Set(['shear-stack', 'cycloid', 'dual-tiling', 'euler-holes', 'convex-hull', 'cube-growth', 'perspective-rail', 'chaos-game']);
const sourcedLabs = new Set(['perspective-rail', 'conic-slices', 'chaos-game']);

await build({ root: ROOT, logLevel: 'warn' });
const { server, port } = await startServer();
const profile = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'geo-smoke-'));
const child = spawn(findBrowser(), [
  '--headless=new', '--disable-gpu', '--mute-audio', '--no-first-run',
  '--disable-extensions', '--no-proxy-server', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

let socket, send;
try {
  let cdpPort;
  for (let i = 0; i < 80; i++) {
    try { [cdpPort] = (await fs.promises.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n'); break; }
    catch { await delay(100); }
  }
  const tabs = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  socket = new WebSocket(tabs.find(t => t.type === 'page' && t.url === 'about:blank').webSocketDebuggerUrl);
  await once(socket, 'open');

  const pending = new Map(), errors = [];
  let seq = 0;
  socket.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    if (!m.id) return;
    const [res, rej] = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(m.error) : res(m.result);
  };
  send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq; pending.set(id, [res, rej]); socket.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr, awaitPromise = false) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const gesture = expr => send('Runtime.evaluate', { expression: expr, userGesture: true });
  const wait = async (expr, n = 100) => {
    for (let i = 0; i < n; i++) { if (await ev(expr)) return; await delay(60); }
    throw Error(`Timeout: ${expr}`);
  };
  const route = async (hash, ready, expected = hash) => {
    await ev(`location.hash=${JSON.stringify(hash)}`);
    await wait(`location.hash===${JSON.stringify(expected === '#' ? '' : expected)}&&!!document.querySelector(${JSON.stringify(ready)})`);
    await delay(60);
  };
  const click = action => ev(`document.querySelector('[data-action="${action}"]').click()`);
  const preset = index => ev(`document.querySelector('[data-preset="${index}"]').click()`);
  const filmChip = index => ev(`document.querySelectorAll('.film-chips button')[${index}].click()`);
  const filmTime = 'document.querySelector(".film-time").textContent';
  const slider = (selector, value) => ev(`{
    const input = document.querySelector(${JSON.stringify(selector)});
    input.value = ${value};
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }`);
  const statsContain = value => `document.querySelector('#stats').textContent.includes(${JSON.stringify(value)})`;
  const statValues = () => ev('[...document.querySelectorAll("#stats strong")].map(e => e.textContent)');
  const drawingOk = '!/NaN|Infinity/.test(document.querySelector(".drawing").innerHTML)';
  const noOverflow = width => ev(`document.documentElement.scrollWidth <= ${width}`);
  const pieceTargets = (...selectors) => ev(`(() => {
    const svg = document.querySelector('.board');
    svg.scrollIntoView({ block: 'center', behavior: 'instant' });
    return ${JSON.stringify(selectors)}.map(selector => {
      const points = Array.from(svg.querySelector(selector).points);
      const p = points.reduce((a, q) => ({x:a.x+q.x/3,y:a.y+q.y/3}), {x:0,y:0});
      const {x,y} = new DOMPoint(p.x,p.y).matrixTransform(svg.getScreenCTM());
      return {x,y};
    });
  })()`);

  for (const d of ['Runtime', 'Page']) await send(`${d}.enable`);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await wait('!!document.querySelector(".hall-card")');

  if (!filterIds.length) {
    assert.equal(await ev('document.querySelectorAll(".hall-card").length'), halls.length);
    assert.ok(await ev('!document.querySelector("#curvature-compare, .wiki-grid, .film")'), 'homepage is an index, not the full collection');
    assert.ok(await noOverflow(1280), 'desktop overflow on home');
    const readout = 'document.querySelector(".show-stage figcaption").textContent';
    const current = '[...document.querySelectorAll(".show-dots button")].findIndex(b => b.getAttribute("aria-current") === "true")';
    const showDot = i => ev(`document.querySelectorAll(".show-dots button")[${i}].click()`);
    const showClean = '!/NaN|Infinity/.test(document.querySelector(".show-stage").innerHTML)';
    const hallLink = id => `!!document.querySelector(".show-cta a[href='#hall/${id}']") && !!document.querySelector(".show-hall[href='#hall/${id}']")`;
    assert.equal(await ev('document.querySelectorAll(".show-dots button").length'), halls.length, 'one famous figure per hall');
    assert.equal(await ev(current), 0);
    assert.ok(await ev(`${hallLink('topology')} && !!document.querySelector(".show-cta a[href='#play/mobius']")`), 'mobius links to its hall');
    assert.ok(await ev('document.querySelector(".show-source").href.startsWith("https://mathworld.wolfram.com/")'), 'slide cites its source');
    assert.ok(await ev('!document.querySelector(".qa-line")'), 'home carousel has no dialogue');
    const startLap = await ev(readout);
    await wait(`${readout} !== ${JSON.stringify(startLap)}`);
    assert.ok(await ev(showClean), 'mobius frame');
    await wait(`${current} === 1`, 180);
    await wait(`${readout}.includes("φ = 1.618") && document.querySelectorAll(".show-penrose").length === 2`);
    assert.ok(await ev(showClean), 'penrose frame');
    assert.ok(await ev(hallLink('mosaics')));
    await ev('document.querySelector(".show-toggle").click()');
    assert.equal(await ev('document.querySelector(".show-toggle").getAttribute("aria-pressed")'), 'false');
    const held = await ev('document.querySelector(".show-progress").style.transform');
    await delay(400);
    assert.equal(await ev('document.querySelector(".show-progress").style.transform'), held, 'pausing stops the slide timer');
    const slides = [
      ['dimensions', '16 个顶点 · 32 条棱'],
      ['curves', '个点连到第'],
      ['non-euclid', '每个角 120.0°'],
      ['fractal', '第 4 轮 · 768 条边'],
      ['solids', 'V − E + F = '],
      ['transforms', '每颗多转 137.5°'],
      ['computational', '13 个站点 · 13 个格子'],
    ];
    for (const [i, [hallId, text]] of slides.entries()) {
      await showDot(i + 2);
      await wait(`${current} === ${i + 2} && ${readout}.includes(${JSON.stringify(text)})`);
      assert.ok(await ev(showClean), `${hallId} frame`);
      assert.ok(await ev(hallLink(hallId)), `${hallId} slide links to its hall`);
    }
    await showDot(2);
    await wait('document.querySelectorAll(".show-cube-line").length === 32');
    assert.equal(await ev('document.querySelectorAll(".show-cube-line.is-bridge").length'), 8);
    await showDot(5);
    await wait(`${readout}.includes("周长 ×3.16 · 面积 ×1.58")`);
    await showDot(6);
    await wait(`/= 2$/.test(${readout})`);
    await showDot(8);
    await ev('document.querySelector(".show-nav").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))');
    await wait(`${current} === 9 && !!document.querySelector(".show-stage .index-handle")`);
    assert.ok(await ev(hallLink('euclid')));
    await ev(`{
      const handle = document.querySelector('.index-handle');
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    }`);
    assert.ok(await ev('document.querySelector(".index-measurement").textContent.includes("三边仍然等长，顶角 60°")'));
    await ev('document.querySelectorAll(".show-arrow")[1].click()');
    await wait(`${current} === 0`);

    const typeSearch = value => ev(`{
      const input = document.querySelector('.home-search input');
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }`);
    await typeSearch('莫比乌斯');
    await wait('!!document.querySelector(".home-results a[href=\'#q/mobius\']")');
    assert.ok(await ev('document.querySelector(".home-results-meta").textContent.startsWith("找到")'));
    await typeSearch('not-a-geometry-topic');
    await wait('!!document.querySelector(".home-results-meta .chip")');
    await ev('[...document.querySelectorAll(".home-results-meta .chip")].find(b => b.textContent === "雪花").click()');
    await wait('!!document.querySelector(".home-results a[href=\'#q/koch\']")');
    await ev('document.querySelector(".home-search-clear").click()');
    await wait('!document.querySelector(".home-results")');

    for (const [legacy, now, ready] of [
      ['#lab/mobius', '#play/mobius', '#lab-workbench'],
      ['#question/mobius', '#q/mobius', '.film'],
      ['#reading', '#stories', '.talk-list'],
      ['#hall/dynamic', '#hall/transforms', '.qlist-intro'],
      ['#hall/euclid/play', '#hall/euclid', '.qlist-intro'],
      ['#halls', '#', '.hall-card'],
    ]) await route(legacy, ready, now);

    await route('#q/mobius', '.film #canvas svg');
    assert.ok(await ev('document.querySelector(".film #canvas svg").parentElement.inert'), 'the film board is not interactive');
    assert.ok(await ev('!document.querySelector("#lab-workbench, #choices")'), 'the question page has no workbench or challenge');
    await ev('document.querySelector(".qa-play").click()');
    await wait('location.hash === "#play/mobius" && !!document.querySelector("#lab-workbench .drawing")');
    const mobius = lessons.find(lesson => lesson.id === 'mobius');
    await ev(`{
      document.querySelector('.sound-toggle').click();
      document.querySelector('[data-choice="${mobius.answer}"]').click();
      document.querySelector('.sound-toggle').click();
    }`);
    assert.ok(await ev('!!document.querySelector("#feedback .win-card")'));
    await route('#progress', '.progress-grid');
    assert.ok(await ev('!!document.querySelector(".progress-row.is-done a[href=\'#play/mobius\']")'), 'a challenge records progress');

    await route('#q/equilateral', '.film #canvas svg');
    await filmChip(0);
    assert.equal(await ev('document.querySelector(".film .sound-toggle").getAttribute("aria-pressed")'), 'true');
    await gesture('document.querySelector(".film-play").click()');
    await wait('!!document.querySelector(".qa-turn.is-playing .qa-line.is-nian.is-speaking")');
    await wait('!!document.querySelector(".qa-line.is-dad.is-speaking")', 260);
    assert.ok(await ev('document.querySelector(".drawing").getAnimations({subtree:true}).length > 0'), 'animation starts as Dad answers');
    await ev('document.querySelector(".film-play").click()');
    assert.ok(await ev('!document.querySelector(".qa-line.is-speaking")'), 'pausing stops narration');
    await ev('document.querySelector(".film .sound-toggle").click()');
    await ev('document.querySelector(".film-play").click()');
    await wait(`${filmTime} === "第 2 幕 / 3"`, 160);
    await ev('document.querySelector(".film-play").click()');
    assert.equal(await ev('document.querySelector(".film").dataset.playing'), 'false');
    await ev('document.querySelector(".film .sound-toggle").click()');
    await gesture('document.querySelector(".qa-watch").click()');
    await wait('!!document.querySelector(".qa-line.is-nian.is-speaking")');
    assert.equal(await ev(filmTime), '第 1 幕 / 3', '🎬 jumps the film to that turn');
    await route('#', '.hall-card');
    assert.ok(await ev('!document.querySelector(".is-speaking")'), 'leaving the film cancels narration');
    await ev('document.querySelector(".home-random").click()');
    await wait('location.hash.startsWith("#q/") && !!document.querySelector(".film")');

    await route('#stories', '.talk-list');
    assert.equal(await ev('document.querySelectorAll(".talk-card").length'), geometryTalks.length);
    assert.equal(await ev('document.querySelectorAll(".wiki-card").length'), geometryWiki.length);
    await gesture('document.querySelector(".talk-head").click()');
    await wait('!!document.querySelector(".talk-body .qa-line.is-speaking")');

    await route('#play', '.play-group');
    assert.equal(await ev('document.querySelectorAll(".mode-card").length'), lessons.length, 'the playground index lists every lab once');
    assert.ok(await ev('document.querySelectorAll(".elements-chapter").length >= 2'));

    await route('#compare', '#curvature-compare');
    const totals = () => ev('[...document.querySelectorAll("#curvature-compare [data-total]")].map(e => parseFloat(e.textContent))');
    const compareShape = 'document.querySelector(\'[data-kind="sphere"] .compare-shape\').getAttribute("d")';
    const [flat, round, saddle] = await totals();
    assert.ok(flat === 180 && round > flat && saddle < flat, 'the comparison shows three intrinsic angle sums');
    const initialShape = await ev(compareShape);
    await ev('document.querySelector(\'[data-kind="disk"] .compare-tip\').focus()');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown' });
    assert.ok(await ev(compareShape) !== initialShape, 'keyboard move in one world redraws the others');
    const [, beforeRound, beforeSaddle] = await totals();
    await click('compare-tiny');
    await wait('document.querySelector("#compare-size").value === document.querySelector("#compare-size").min');
    const [nearFlat, nearRound, nearSaddle] = await totals();
    assert.ok(nearFlat === flat && nearRound < beforeRound && nearSaddle > beforeSaddle, 'shrinking brings all three sums closer');
    await click('compare-reset');
    await wait(`${compareShape} === ${JSON.stringify(initialShape)}`);
    assert.deepEqual(await totals(), [flat, round, saddle]);
    assert.equal(await ev('document.querySelector(".compare-why a[href=\'#play/sphere\']").hash'), '#play/sphere');

    for (const h of halls) {
      await route(`#hall/${h.id}`, '.qlist-intro');
      assert.ok(await noOverflow(1280), `desktop overflow on #hall/${h.id}`);
      assert.equal(await ev('document.querySelectorAll(".qlist-card").length'), h.lessons.length);
      assert.ok(await ev(`document.querySelectorAll(".qlist-play .chip").length >= ${h.lessons.length}`));
      assert.equal(await ev('document.querySelector(".qlist-stories").open'), false, 'stories are optional');
      assert.ok(await ev('document.querySelectorAll(".qlist-stories .wiki-card").length >= 2'));
      assert.equal(await ev('document.querySelectorAll(".qlist-stories .wiki-source").length'), 1);
    }
    await gesture('document.querySelector(".qlist-listen").click()');
    await wait('!!document.querySelector(".qlist-intro .is-speaking")');
    await ev('document.querySelector(".qlist-listen").click()');
    await wait('!document.querySelector(".qlist-intro .is-speaking")');
  }

  for (const id of allLabIds) {
    await route(`#q/${id}`, '.film #canvas svg');
    assert.equal(await ev('document.querySelectorAll(".qa-turn").length'), 3);
    await filmChip(1);
    assert.equal(await ev(filmTime), '第 2 幕 / 3');
    assert.ok(await ev('document.querySelectorAll(".qa-turn")[1].classList.contains("is-playing")'), `${id} the chosen act highlights its turn`);
    await filmChip(2);
    assert.equal(await ev(filmTime), '第 3 幕 / 3');
    assert.ok(await ev(drawingOk), `${id} question third scene numeric output`);
    assert.equal(await ev('document.querySelector(".qa-play").hash'), `#play/${id}`);
    await route(`#play/${id}`, '#lab-workbench .drawing');
    const spatial = Object.hasOwn(spatialLabs, id);
    if (sourcedLabs.has(id)) {
      assert.ok(await ev('document.querySelector(".play-notes .ref-list a").protocol === "https:"'), `${id} links to its reference`);
    }
    if (id === 'pythagoras') {
      const countPlaced = () => ev('document.querySelectorAll("[data-placed]").length');
      assert.equal(await countPlaced(), 0, 'puzzle is the default');
      await click('hint-piece');
      assert.ok(await ev('!!document.querySelector("[data-slot=\\"0\\"] .is-hinted")'));
      const [from, to, wrong] = await pieceTargets('[data-piece="0"] polygon', '[data-slot="0"] polygon', '[data-slot="2"] polygon');
      const mouse = (type, { x, y }, buttons) => send('Input.dispatchMouseEvent', { type, x, y, buttons,
        button: type === 'mouseMoved' && !buttons ? 'none' : 'left', clickCount: 1 });
      await mouse('mouseMoved', wrong, 0);
      await mouse('mousePressed', wrong, 1);
      await mouse('mouseReleased', wrong, 0);
      assert.equal(await countPlaced(), 0, 'a mismatched slot does not place the piece');
      await mouse('mouseMoved', from, 0);
      await mouse('mousePressed', from, 1);
      await wait('!document.querySelector(".dissect-slot.is-hinted")');
      const pieceX = 'document.querySelector(\'[data-piece="0"] polygon\').points[0].x';
      const startX = await ev(pieceX);
      await mouse('mouseMoved', { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }, 1);
      await wait(`${pieceX} > ${startX + 8}`);
      await mouse('mouseMoved', to, 1);
      await wait(`${pieceX} > 300`);
      await mouse('mouseReleased', to, 0);
      await wait('document.querySelectorAll("[data-placed]").length === 1');
      assert.equal(await countPlaced(), 1, 'trusted drag snaps into the matching slot');
      for (let i = 0; i < 3; i++) await click('move-piece');
      assert.equal(await countPlaced(), 4);
      assert.ok(await ev('!document.querySelector(".dissect-why").hidden && !!document.querySelector(".dissect-equation")'));
      await slider('#pythagoras-angle', 63);
      assert.equal(await countPlaced(), 4, 'changing shape preserves arrangement');
      await click('classic');
      assert.ok(await ev('!document.querySelector("#lab-guide").hidden'));
      assert.equal(await ev('getComputedStyle(document.querySelector("[data-puzzle-tools]")).display'), 'none');
      await click('puzzle');
      assert.equal(await countPlaced(), 4, 'classic proof preserves puzzle state');
      await click('reset-piece');
      assert.equal(await countPlaced(), 0);
    }
    for (let i = 0; i < 3; i++) {
      await preset(i);
      assert.equal(await ev(`document.querySelector('[data-preset="${i}"]').getAttribute('aria-pressed')`), 'true');
      assert.ok(await ev(spatial ? '!!document.querySelector(".space-stage[data-playing]")' :
        'document.querySelector(".drawing").getAnimations({subtree:true}).length > 0'), `${id} preset ${i + 1} animation`);
      assert.ok(await ev(drawingOk), `${id} preset ${i + 1} numeric output`);
    }
    if (id === 'shear-stack') {
      await slider('#stack-height', 100);
      await slider('#stack-offset', 100);
      assert.deepEqual(await statValues(), ['16 = 16', '6.00', '96 = 96']);
      assert.ok(await ev(`(() => {
        const [left, right] = Array.from(document.querySelectorAll('.stack-slice'), p => Array.from(p.points));
        return left.every((p, i) => right[i].x - p.x === 389 && right[i].y === p.y && right[i].x < 640);
      })()`), 'both rendered sections are translates, without clipping at maximum shear');
    } else if (id === 'cycloid') {
      assert.ok(await ev(statsContain('带回环')));
      await slider('#cycloid-arm', 0);
      assert.ok(await ev(statsContain('水平直线')));
      await slider('#cycloid-angle', 40);
      await click('cycloid-play');
      await wait('Number(document.querySelector("#cycloid-angle").value) > 40');
      await slider('#cycloid-arm', 100);
      assert.equal(await ev('document.querySelector("[data-action=cycloid-play]").getAttribute("aria-pressed")'), 'false');
      assert.ok(await ev(statsContain('尖点摆线')));
    } else if (id === 'dual-tiling') {
      await click('cells');
      assert.equal(await ev('document.querySelectorAll(".dual-link").length'), 0);
      await click('both');
      assert.equal(await ev('document.querySelectorAll(".dual-focus, .dual-cell").length'), 37);
      assert.equal((await statValues()).at(-1), '6');
      await slider('#dual-rings', 1);
      assert.deepEqual(await statValues(), ['7', '12', '6']);
    } else if (id === 'euler-holes') {
      assert.equal(await ev('document.querySelectorAll(".euler-boundary").length'), 2);
      await slider('#euler-grid', 12);
      assert.match((await statValues()).at(-1), /= 0$/);
      const before = await statValues();
      await slider('#euler-skew', 85);
      assert.deepEqual(await statValues(), before, 'deformation preserves all incidence counts');
      await click('euler-hole');
      assert.match((await statValues()).at(-1), /= 1$/);
    } else if (id === 'convex-hull') {
      assert.equal((await statValues())[0], '凸包顶点');
      await click('edge');
      assert.equal((await statValues())[0], '在边上，不是角');
      await ev('document.querySelector("[data-point=hull-p]").focus()');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowUp' });
      assert.equal((await statValues())[0], '凸包顶点');
      assert.equal(await ev('document.activeElement.dataset.point'), 'hull-p');
    } else if (id === 'cube-growth') {
      assert.deepEqual(await statValues(), ['32', '80', '16']);
      const bridges = () => ev('document.querySelectorAll(".growth-bridge").length');
      assert.equal(await bridges(), 16);
      await slider('#growth-dimension', 0);
      assert.deepEqual(await statValues(), ['1', '0', '0']);
      assert.ok(await ev('document.querySelector("#growth-gap").disabled'));
      await slider('#growth-dimension', 2);
      assert.deepEqual(await statValues(), ['4', '4', '2']);
      assert.equal(await bridges(), 2);
    } else if (id === 'perspective-rail') {
      assert.equal(await ev('document.querySelectorAll(".rail-ray").length'), 2);
      await click('rail-double');
      assert.equal((await statValues()).at(-1), '0.50 倍');
      const lengths = () => ev('[...document.querySelectorAll(".rail-selected")].map(e => e.getTotalLength())');
      const [actual, pictured] = await lengths();
      await slider('#rail-focal', 150);
      const [same, zoomed] = await lengths();
      assert.equal(same, actual);
      assert.ok(zoomed < pictured);
      assert.equal((await statValues()).at(-1), '0.50 倍');
    } else if (id === 'chaos-game') {
      const dotCount = () => ev('[...document.querySelectorAll(".chaos-dots")].reduce((n, p) => n + p.getAttribute("d").split("M").length - 1, 0)');
      assert.equal(await dotCount(), 5000);
      assert.equal(await ev('document.querySelectorAll(".chaos-copy").length'), 4);
      await click('chaos-clear');
      assert.equal(await dotCount(), 0);
      await click('chaos-step');
      await click('chaos-batch');
      assert.equal(await dotCount(), 501);
      const cloud = await ev('document.querySelector(".chaos-dots").getAttribute("d")');
      await click('chaos-seed');
      assert.notEqual(await ev('document.querySelector(".chaos-dots").getAttribute("d")'), cloud);
      await click('chaos-three');
      await slider('#chaos-fraction', 65);
      assert.equal(await ev('document.querySelectorAll(".chaos-copy").length'), 3);
      assert.equal(await dotCount(), 501);
    }
    if (spatial) {
      const [input, finalValue, expected] = spatialLabs[id];
      await wait(`!document.querySelector(".space-stage[data-playing]")`);
      assert.equal(await ev(`Number(document.querySelector("${input}").value)`), finalValue, `${id} final animation frame`);
      assert.ok(await ev(statsContain(expected)), `${id} final metric`);
      assert.ok(await ev(drawingOk), `${id} final numeric output`);
      const model = 'document.querySelector(".drawing").innerHTML';
      const initial = await ev(model);
      await ev('document.querySelector(".space-stage").focus()');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight' });
      assert.ok(await ev(model) !== initial, `${id} keyboard orbit`);
      await click('reset-space');
      assert.ok(await ev(model) === initial, `${id} reset orbit`);

      if (id === 'cube-section') {
        const result = () => ev('document.querySelector("#lab-records").dataset.result');
        await click('record-0');
        await click('record-1');
        assert.equal(await result(), 'area', 'identical cuts are not evidence');
        await click('play-space');
        await wait('Number(document.querySelector("#section-offset").value) > -110');
        await slider('#section-offset', 25);
        assert.ok(await ev('!document.querySelector(".space-stage[data-playing]")'));
        assert.ok(await ev(statsContain('六边形')));
        assert.ok(!await ev(statsContain('5.20')));
        await click('record-1');
        assert.equal(await result(), 'match');
        assert.ok(await ev('document.querySelector(".cut-verdict").textContent.includes("0.98")'));
        assert.equal(await ev('document.querySelectorAll(".space-detail .cut-graph-dot").length'), 2);
        await slider('#section-offset', 110);
        assert.ok(await ev(statsContain('不相交')));
        await click('record-1');
        assert.ok(await ev('document.querySelector(".cut-verdict").textContent.includes("切不出")'));
        await click('revisit-1');
        assert.equal(await ev('document.querySelector("#section-offset").value'), '25');
        await route('#hall/solids', '.qlist-intro');
        await route('#play/cube-section', '#lab-records');
        assert.equal(await result(), 'match', 'notebook restores after leaving and returning');
      } else if (id === 'mobius') {
        await slider('#ribbon-lap', 1);
        assert.equal(await ev('document.querySelector(".space-detail .space-point").getAttribute("cy")'), '225');
        await click('loop');
        await slider('#ribbon-cut', 100);
        assert.ok(await ev(statsContain('2 条')));
      } else if (id === 'tesseract') {
        await slider('#four-angle', 45);
        await slider('#four-slice', 1);
        assert.ok(await ev(statsContain('3.31')));
        await slider('#four-slice', 1.5);
        assert.ok(await ev(statsContain('不相交')));
      } else if (id === 'conic-slices') {
        assert.equal(await ev('document.querySelectorAll(".space-detail .conic-curve").length'), 2);
        for (const [degrees, name] of [[0, '圆'], [44, '椭圆'], [45, '抛物线'], [46, '双曲线']]) {
          await slider('#conic-angle', degrees);
          assert.equal((await statValues())[0], name);
        }
      } else {
        await click('90');
        assert.ok(await ev(statsContain('12.50%')));
        const { x, y } = await ev(`(() => {
          const svg = document.querySelector('.space-stage');
          svg.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = svg.getBoundingClientRect();
          return { x: Math.round(r.x + 80), y: Math.round(r.y + 100) };
        })()`);
        const forward = await ev(model);
        for (const [type, dx, buttons] of [['mouseMoved', 0, 0], ['mousePressed', 0, 1], ['mouseMoved', 30, 1], ['mouseMoved', 70, 1], ['mouseReleased', 70, 0]]) {
          await send('Input.dispatchMouseEvent', { type, x: x + dx, y, button: type === 'mouseMoved' && !buttons ? 'none' : 'left', buttons, clickCount: 1 });
        }
        assert.ok(await ev(model) !== forward, 'sphere pointer orbit');
      }
    }
    assert.ok(await noOverflow(1280), `desktop overflow on #play/${id}`);
  }

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await route('#', '.hall-card');
    assert.ok(await noOverflow(width), `${width}px overflow on home`);
    assert.equal(await ev('document.querySelector(".show-toggle").getAttribute("aria-pressed")'), 'false', 'reduced motion does not autoplay the carousel');
    assert.equal(await ev('getComputedStyle(document.querySelector(".show-copy")).animationName'), 'none');
    const still = await ev('document.querySelector(".show-stage").innerHTML');
    await delay(300);
    assert.equal(await ev('document.querySelector(".show-stage").innerHTML'), still, 'reduced motion keeps the famous figure still');
    for (const i of halls.keys()) {
      await ev(`document.querySelectorAll(".show-dots button")[${i}].click()`);
      await wait(`[...document.querySelectorAll(".show-dots button")][${i}].getAttribute("aria-current") === "true" && !!document.querySelector(".show-stage figcaption")`);
      assert.ok(await ev('document.querySelector(".show-stage figcaption").getBoundingClientRect().bottom <= document.querySelector(".show-stage").getBoundingClientRect().bottom'), `${width}px slide ${i} readout stays inside the stage`);
      assert.ok(await noOverflow(width), `${width}px overflow on slide ${i}`);
    }
    if (!filterIds.length) {
      for (const page of ['#stories', '#play', '#progress']) {
        await route(page, '.page-top');
        assert.ok(await noOverflow(width), `${width}px overflow on ${page}`);
      }
    }
    if (!filterIds.length && width === 390) {
      await route('#compare', '#curvature-compare');
      assert.ok(await noOverflow(width), `${width}px overflow on comparison`);
      await send('Emulation.setTouchEmulationEnabled', { enabled: true });
      const { x, y, metric } = await ev(`(() => {
        const dot = document.querySelector('[data-kind="plane"] .compare-dot');
        dot.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = dot.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, metric: document.querySelector('[data-kind="disk"] [data-total]').textContent };
      })()`);
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 11, y: y + 22 }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.ok(await ev('document.querySelector(\'[data-kind="disk"] [data-total]\').textContent') !== metric, 'mobile touch drag updates another world');
      const blank = await ev(`(() => {
        document.querySelector('.compare-why').open = true;
        const svg = document.querySelector('[data-kind="plane"] svg');
        const { x, y } = new DOMPoint(20, 170).matrixTransform(svg.getScreenCTM());
        return { x, y, scroll: scrollY };
      })()`);
      assert.ok(await ev(`!!document.elementFromPoint(${blank.x}, ${blank.y})?.closest('.compare-world svg')`));
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: blank.x, y: blank.y }] });
      for (const dy of [20, 48, 85]) {
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: blank.x, y: blank.y - dy }] });
      }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await wait(`scrollY > ${blank.scroll}`);
      await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
    if (!filterIds.length) {
      for (const h of halls) {
        await route(`#hall/${h.id}`, '.qlist-intro');
        assert.ok(await noOverflow(width), `${width}px overflow on #hall/${h.id}`);
      }
    }
    for (const id of allLabIds) {
      await route(`#q/${id}`, '.film #canvas svg');
      assert.ok(await noOverflow(width), `${width}px overflow on #q/${id}`);
      assert.ok(await ev('document.querySelector(".film").getBoundingClientRect().bottom < document.querySelector(".qa-chat").getBoundingClientRect().top'),
        `${id} mobile shows the film above the dialogue`);
      assert.equal(await ev('document.querySelector(".film").dataset.playing'), 'false', `${id} reduced motion does not autoplay`);
      if (Object.hasOwn(spatialLabs, id)) {
        assert.ok(await ev('document.querySelector(".space-hint").hidden && !document.querySelector(".space-stage").hasAttribute("aria-describedby")'), 'a film does not advertise drag controls');
        await click('detail');
        assert.ok(await ev('!!document.querySelector(".space-stage[data-pane=detail]")'), 'film retains spatial detail view on mobile');
      }
      await route(`#play/${id}`, '#lab-workbench .drawing');
      assert.ok(await noOverflow(width), `${width}px overflow on #play/${id}`);
      assert.ok(await ev(`document.querySelector('#controls').getBoundingClientRect().top < document.querySelector('#stats').getBoundingClientRect().top`),
        `${id} mobile places controls right under the board`);
      if (id === 'equilateral' && width === 390) {
        await send('Emulation.setTouchEmulationEnabled', { enabled: true });
        const { x, y, before } = await ev(`(() => {
          const dot = document.querySelector('.board [data-point] .dot');
          dot.closest('.board').scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = dot.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, before: dot.getAttribute('cx') };
        })()`);
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 24, y: y + 18 }] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.notEqual(await ev('document.querySelector(".board [data-point] .dot").getAttribute("cx")'), before, 'a geometric handle still responds to touch dragging');
        await send('Emulation.setTouchEmulationEnabled', { enabled: false });
      }
      if (id === 'pythagoras' && width === 390) {
        await send('Emulation.setTouchEmulationEnabled', { enabled: true });
        const targets = await pieceTargets('[data-piece="1"] polygon', '[data-slot="1"] polygon');
        for (const point of targets) {
          await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
          await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        }
        assert.ok(await ev('!!document.querySelector(\'[data-placed="1"]\')'), 'mobile tap selects and places a piece');
        await send('Emulation.setTouchEmulationEnabled', { enabled: false });
      }
      if (addedLabs.has(id)) {
        await preset(0);
        assert.ok(await ev('document.querySelector(".drawing").getAnimations({subtree:true}).length === 0'), `${id} respects reduced motion`);
        assert.ok(await ev(drawingOk));
      }
      if (id === 'cycloid') {
        await click('cycloid-play');
        assert.equal(await ev('document.querySelector("#cycloid-angle").value'), '460');
      }
      if (id === 'convex-hull' && width === 390) {
        await send('Emulation.setTouchEmulationEnabled', { enabled: true });
        const [from, to] = await ev(`(() => {
          const svg = document.querySelector('.board');
          svg.scrollIntoView({ block: 'center', behavior: 'instant' });
          return [177, 80].map(y => {
            const p = new DOMPoint(305, y).matrixTransform(svg.getScreenCTM());
            return { x: p.x, y: p.y };
          });
        })()`);
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [to] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.equal((await statValues())[0], '凸包顶点', 'touch dragging P updates the hull');
        await send('Emulation.setTouchEmulationEnabled', { enabled: false });
      }
      if (Object.hasOwn(spatialLabs, id)) {
        assert.ok(await ev('!!document.querySelector(".space-stage.is-compact")'), `${id} adapts diagrams to mobile`);
        assert.ok(await ev('!!document.querySelector(".space-stage[data-pane=model]")'));
        assert.ok(await ev('document.querySelector("#controls").getBoundingClientRect().top - document.querySelector(".space-stage").getBoundingClientRect().bottom < 145'), `${id} controls stay near the model`);
        await click('detail');
        assert.ok(await ev('!!document.querySelector(".space-stage[data-pane=detail]")'));
        assert.equal(await ev('getComputedStyle(document.querySelector(".space-model")).display'), 'none');
        if (id === 'cube-section') {
          await click('revisit-1');
          assert.ok(await ev(statsContain('4.22')));
          if (width === 320) {
            await click('clear-cuts');
            assert.equal(await ev('document.querySelector("#lab-records").dataset.result'), 'waiting');
          }
        }
        await preset(0);
        assert.ok(await ev('!document.querySelector(".space-stage[data-playing]")'), `${id} reduced motion`);
        assert.ok(await ev(drawingOk), `${id} reduced-motion frame`);
      }
    }
  }

  assert.deepEqual(errors, []);
  console.log(`✅ Smoke passed: ${allLabIds.length} labs with their questions and playgrounds, zero runtime errors, zero overflow.`);
} finally {
  if (send) await Promise.race([send('Browser.close').catch(() => {}), delay(400)]);
  socket?.close();
  if (child.exitCode === null) child.kill();
  server.close();
  await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
}
