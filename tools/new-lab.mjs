#!/usr/bin/env node
/**
 * 几何游乐场 · 新实验脚手架工具（给 AI Agent 与开发者）
 *
 * 用法：
 *   npm run lab:new                                    # 查看全部 10 座展馆与示例
 *   npm run lab:new -- <hall> <id> "<中文标题>"         # 预览模式
 *   npm run lab:new -- <hall> <id> "<中文标题>" --write # 生成 src/labs/<id>.js、注册到 custom-labs.js 与 lab-talks.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { halls } from '../src/catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const toIdent = id => id.replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase()) + 'Lab';

function printHelp() {
  console.log('📐 几何游乐场脚手架 (tools/new-lab.mjs)\n');
  console.log('用法：');
  console.log('  npm run lab:new -- <hall> <id> "<中文标题>" [--write]\n');
  console.log('可选的 10 座展馆 (<hall>)：');
  for (const h of halls) {
    console.log(`  • ${h.id.padEnd(14)} ${h.name} —— ${h.summary}`);
  }
  console.log('\n示例：');
  console.log('  npm run lab:new -- curves cycloid "滚轮画摆线"');
  console.log('  npm run lab:new -- curves cycloid "滚轮画摆线" --write');
}

function renderLabModule(id, title, ident) {
  return `import { pt } from '../math.js';
import { W, H, button, circle, line, metric, point, polygon, slider } from '../board.js';

export function ${ident}({ board, controls, stats, signal }) {
  let param = 45;
  controls.innerHTML = slider('实验参数', '${id}-param', param, 10, 90, 1) +
    \`<div class="control-row">\${button('切到演示 1', 'p1')}\${button('切到演示 2', 'p2')}\${button('复位', 'reset')}</div>
    <p class="lab-note">TODO(agent): 说明孩子可以拖动或调节什么来观察「${title}」的几何规律。</p>\`;

  const input = controls.querySelector('input');
  const output = controls.querySelector('output');

  function draw() {
    param = Number(input.value);
    const cx = W / 2, cy = H / 2, r = 50 + param;
    const pts = [pt(cx - r, cy + 70), pt(cx + r, cy + 70), pt(cx, cy - r * 0.8)];
    board.draw(
      circle(pt(cx, cy), r, 'aux') +
      polygon(pts, 'shape') +
      line(pts[0], pts[2], 'result') +
      pts.map((p, i) => point(p, 'ABC'[i])).join('')
    );
    output.value = String(param);
    stats.innerHTML = metric('当前参数', param) + metric('半径', r);
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'p1') input.value = 30;
    else if (action === 'p2') input.value = 75;
    else if (action === 'reset') input.value = 45;
    else return;
    draw();
  }, { signal });

  draw();
  return (_, value) => {
    input.value = value;
    draw();
    board.animate('.shape, .result, .aux');
  };
}
`;
}

const args = process.argv.slice(2);
const writeMode = args.includes('--write');
const pos = args.filter(a => !a.startsWith('--'));

if (pos.length < 3 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(pos.length === 0 || args.includes('--help') || args.includes('-h') ? 0 : 1);
}

const [hallId, id, title] = pos;
const hall = halls.find(h => h.id === hallId);
if (!hall) {
  console.error(`❌ 未知展馆 "${hallId}"。可选：${halls.map(h => h.id).join(', ')}`);
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error(`❌ 实验 id "${id}" 格式不合法，请使用小写字母/数字/短横线。`);
  process.exit(1);
}
if (halls.flatMap(h => h.lessons).some(l => l.id === id)) {
  console.error(`❌ 实验 "${id}" 已存在，请更换 id。`);
  process.exit(1);
}

const ident = toIdent(id);
const labFile = path.join(ROOT, 'src', 'labs', `${id}.js`);
if (fs.existsSync(labFile)) {
  console.error(`❌ 文件 src/labs/${id}.js 已存在。`);
  process.exit(1);
}

if (!writeMode) {
  console.log(`🔍 [预览模式] 将在「${hall.name}」新增实验「${title}」(id: ${id})`);
  console.log(`   加 --write 执行落盘：\n   npm run lab:new -- ${hallId} ${id} "${title}" --write\n`);
  process.exit(0);
}

fs.mkdirSync(path.join(ROOT, 'src', 'labs'), { recursive: true });
fs.writeFileSync(labFile, renderLabModule(id, title, ident), 'utf8');

const customLabsPath = path.join(ROOT, 'src', 'custom-labs.js');
const customText = fs.readFileSync(customLabsPath, 'utf8');
const entrySnippet = `  {\n    hall: '${hallId}',\n    lesson: {\n      id: '${id}',\n      name: '${title}',\n      tag: 'TODO·几何概念',\n      intro: 'TODO(agent): 一句话告诉孩子这个实验怎么动手玩。',\n      idea: 'TODO(agent): 用爸爸的口吻解释背后的几何原理。',\n      question: 'TODO(agent): 设计一道检验观察的小挑战？',\n      choices: ['选项 A', '选项 B（示例正解）', '选项 C'],\n      answer: 1,\n    },\n    load: () => import('./labs/${id}.js').then(m => m.${ident}),\n  },\n];`;
const nextCustom = `${customText.replace(/\];\s*$/, entrySnippet)}\n`;
fs.writeFileSync(customLabsPath, nextCustom, 'utf8');

const talksPath = path.join(ROOT, 'src', 'lab-talks.js');
const talksText = fs.readFileSync(talksPath, 'utf8');
const talkSnippet = `  '${id}': [\n    { scene: ['preset', 25], nian: '爸爸，为什么调节这个参数时图形会跟着变？', dad: 'TODO(agent): 第一轮引导孩子先观察最直观的现象。' },\n    { scene: ['preset', 55], nian: '那调到这里的时候，里面是不是藏着不变的规律？', dad: 'TODO(agent): 第二轮追问关键几何关系。' },\n    { scene: ['preset', 80], nian: '我来自己拉一拉滑块，看看结论还成立吗！', dad: 'TODO(agent): 第三轮鼓励孩子自己动手验证！' },\n  ],\n};`;
fs.writeFileSync(talksPath, talksText.replace(/\};\s*$/, talkSnippet + '\n'), 'utf8');

console.log(`✅ 已生成并注册「${title}」(${hallId}/${id})：`);
console.log(`  • src/labs/${id}.js`);
console.log(`  • src/custom-labs.js`);
console.log(`  • src/lab-talks.js`);
console.log('\n接下来请：');
console.log('  1. 完善 src/labs/' + id + '.js 的真实几何算法与画板动画');
console.log('  2. 补齐 src/custom-labs.js 与 src/lab-talks.js 的 TODO 文案');
console.log('  3. 运行 npm run voice && npm run check && npm test && npm run smoke -- ' + id);
