#!/usr/bin/env node
/**
 * 几何游乐场 · 无头浏览器全站巡检脚本（零第三方依赖）
 *
 * 用法：
 *   npm run smoke                  # 全站巡检：首页 + 10 座展馆 + 26 个实验（桌面+手机）
 *   npm run smoke -- mobius        # 定向巡检指定实验
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { halls } from '../src/catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp3': 'audio/mpeg',
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
      const urlPath = (req.url || '/').split('?')[0];
      const safe = path.normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
      const file = path.join(ROOT, safe);
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
const allLabIds = filterIds.length ? filterIds : halls.flatMap(h => h.lessons.map(l => l.id));

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
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const wait = async (expr, n = 100) => {
    for (let i = 0; i < n; i++) { if (await ev(expr)) return; await delay(60); }
    throw Error(`Timeout: ${expr}`);
  };
  const route = async (hash, ready) => {
    await ev(`location.hash=${JSON.stringify(hash)}`);
    await wait(`location.hash===${JSON.stringify(hash)}&&!!document.querySelector(${JSON.stringify(ready)})`);
    await delay(60);
  };

  for (const d of ['Runtime', 'Page']) await send(`${d}.enable`);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await wait('!!document.querySelector(".hall-card")');

  if (!filterIds.length) {
    assert.equal(await ev('document.querySelectorAll(".hall-card").length'), halls.length);
    for (const h of halls) {
      await route(`#hall/${h.id}`, '#hall-guide-chat');
      assert.ok(await ev('document.documentElement.scrollWidth <= 1280'), `desktop overflow on #hall/${h.id}`);
    }
  }

  for (const id of allLabIds) {
    await route(`#lab/${id}`, '#story .story-nian p');
    for (let i = 0; i < 3; i++) {
      await ev(`document.querySelector('#story [data-action="${i ? 'next' : 'demo'}"]').click()`);
      assert.ok(await ev('document.querySelector(".drawing").getAnimations({subtree:true}).length > 0'), `${id} round ${i + 1} animation`);
      assert.ok(await ev('!document.querySelector(".drawing").innerHTML.includes("NaN")'), `${id} round ${i + 1} NaN`);
    }
    assert.ok(await ev('document.documentElement.scrollWidth <= 1280'), `desktop overflow on #lab/${id}`);
  }

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const h of ['', `#lab/${allLabIds[0]}`]) {
    await ev(`location.hash=${JSON.stringify(h)}`);
    await delay(140);
    assert.ok(await ev('document.documentElement.scrollWidth <= 390'), `mobile overflow on ${h || 'home'}`);
  }

  assert.deepEqual(errors, []);
  console.log(`✅ Smoke passed: ${allLabIds.length} lab(s), zero runtime errors, zero overflow.`);
} finally {
  if (send) await Promise.race([send('Browser.close').catch(() => {}), delay(400)]);
  socket?.close();
  if (child.exitCode === null) child.kill();
  server.close();
  await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
}
