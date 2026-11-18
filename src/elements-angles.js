import { pt, add, sub, mul, norm, dist, cross, clamp, angleCopy, angleAt } from './math.js';
import { circle, dragPoints, line, point, polygon, metric, button, xy } from './board.js';
import { proofPanel } from './proof-panel.js';

const rayPoint = (o, p, length) => add(o, mul(sub(p, o), length / norm(sub(p, o))));
const angleLabel = value => `${(value * 180 / Math.PI).toFixed(1)}°`;

function sector(o, a, b, cls, r = 30) {
  const from = rayPoint(o, a, r), to = rayPoint(o, b, r);
  const sweep = cross(sub(a, o), sub(b, o)) > 0 ? 1 : 0;
  return `<path d="M${xy(o)} L${xy(from)} A${r} ${r} 0 0 ${sweep} ${xy(to)} Z" class="angle-fill angle-${cls}"/>`;
}

function angleLesson(id) {
  if (id === 'copy-angle') return {
    keys: [['B', pt(184, 116), [116, 254, 53, 200]]],
    steps: [
      ['在原角两边截取等长线段', '以 O 为圆心画圆，在原角两条边上标出 U、V。'],
      ['转移半径与弦长', '在新射线上找 X，使 PX = OU；以 P、X 为圆心分别用原半径、原弦长画圆。'],
      ['连接交点 Y', '△OUV 与 △PXY 的三条对应边分别相等，所以所夹的角也相等。'],
    ],
    figure([b], step) {
      const o = pt(106, 250), a = pt(263, 250), p = pt(384, 250), q = pt(572, 250), r = 84;
      const u = rayPoint(o, a, r), v = rayPoint(o, b, r), chord = dist(u, v);
      const { mark, end } = angleCopy(p, q, r, chord, -1);
      let art = line(o, a) + line(o, b) + line(p, q) + sector(o, a, b, 'one') + point(o, 'O') + point(p, 'P');
      if (step >= 0) art += circle(o, r) + line(u, v, 'aux') + point(u, 'U') + point(v, 'V');
      if (step >= 1) art += circle(p, r) + circle(mark, chord, 'aux alt') + point(mark, 'X');
      if (step >= 2) art += line(p, end, 'result') + line(mark, end, 'aux') + sector(p, q, end, 'one') + point(end, 'Y');
      return { art, metrics: metric('原角', angleLabel(angleAt(o, a, b))) +
        metric('复制的角', step >= 2 ? angleLabel(angleAt(p, q, end)) : '待构造') };
    },
  };
  if (id === 'draw-parallel') return {
    keys: [['A', pt(334, 139), [257, 429, 84, 184]], ['D', pt(235, 271), [191, 274, 271, 271]]],
    steps: [
      ['从 A 向已知直线作截线 AD', '把 ∠ADC 作为要复制的角。拖动 A 或 D 试试，原角可以改变。'],
      ['在截线另一侧复制等角', '按命题 23，用圆规转移半径和弦长，得到 ∠DAE = ∠ADC。'],
      ['延长 EA，得到平行线', '两条直线被 AD 所截，内错角相等。按命题 27，它们平行。'],
    ],
    figure([a, d], step) {
      const left = pt(101, d.y), c = pt(550, d.y), r = 70;
      const u = rayPoint(d, a, r), v = rayPoint(d, c, r);
      const { mark, end } = angleCopy(a, d, r, dist(u, v), 1);
      let art = line(left, c) + line(a, d) + sector(d, a, c, 'two') + point(c, 'C');
      if (step >= 1) art += circle(d, r) + line(u, v, 'aux') + circle(a, r) + circle(mark, dist(u, v), 'aux alt') +
        line(a, end, 'result') + sector(a, d, end, 'two') + point(end, 'E');
      if (step >= 2) art += line(pt(101, end.y), pt(550, end.y), 'result');
      return { art, metrics: metric('∠ADC', angleLabel(angleAt(d, a, c))) +
        metric('∠DAE', step >= 1 ? angleLabel(angleAt(a, d, end)) : '待构造') };
    },
  };
  return {
    keys: [['A', pt(275, 97), [154, 441, 56, 233]], ['B', pt(157, 293), [95, 250, 293, 293]],
      ['C', pt(388, 293), [330, 480, 293, 293]]],
    steps: [
      ['延长 BC，再从 C 引平行线', '延长 BC 到 D，然后按命题 31 过 C 作 CE ∥ AB。'],
      ['在 C 旁找出与 A 相等的角', '平行线 AB、CE 被 AC 所截，内错角 ∠BAC = ∠ACE（命题 29）。两角用同一颜色标记。'],
      ['在 C 旁找出与 B 相等的角', '用第二条截线 BD，得到 ∠ABC = ∠ECD（命题 29）。'],
      ['把三角形的三个角合成平角', '∠BCA、∠ACE、∠ECD 顺次相邻，合成从 CB 到 CD 的平角。因此原三角形的内角和是 180°。'],
    ],
    figure([a, b, c], step) {
      const d = pt(574, c.y);
      const e = add(c, mul(sub(a, b), 99 / norm(sub(a, b))));
      let art = polygon([a, b, c]) + line(b, d, 'structural') + line(c, e, 'aux') + point(d, 'D') + point(e, 'E');
      if (step >= 1) art += sector(a, b, c, 'one') + sector(c, a, e, 'one');
      if (step >= 2) art += sector(b, a, c, 'two') + sector(c, e, d, 'two');
      if (step >= 3) art += sector(c, b, a, 'three') + `<path d="M${c.x - 42} ${c.y} A42 42 0 0 1 ${c.x + 42} ${c.y}" class="aux"/>`;
      const measured = [angleAt(a, b, c), angleAt(b, a, c), angleAt(c, a, b)];
      return { art, metrics: measured.map((value, i) => metric(`∠${'ABC'[i]}`, angleLabel(value))).join('') +
        metric('三角之和', step >= 3 ? angleLabel(measured.reduce((sum, angle) => sum + angle, 0)) : '等你拼成平角') };
    },
  };
}

export function elementsAngles({ board, controls, stats, lesson, signal, guide }) {
  const { keys, steps, figure } = angleLesson(lesson.id);
  let given = keys.map(item => item[1]), step = 0;
  controls.innerHTML = `<div class="control-row">${button('上一步', 'back')}${button('下一步 →', 'next', 'class="primary"')}${button('复位图形', 'reset')}</div>
    <p class="lab-note">点读证明，或逐步推进。拖动已知点也可以用方向键，检查证明是否仍成立。</p>`;
  const back = controls.querySelector('[data-action="back"]'), next = controls.querySelector('[data-action="next"]');
  const reveal = i => { step = i; draw(); board.animate('.angle-fill, .aux, .result'); };
  const update = proofPanel(guide, steps, reveal, signal);
  function draw() {
    const { art, metrics } = figure(given, step);
    board.draw(art + given.map((p, i) => point(p, keys[i][0], { key: i, kind: 'draggable' })).join(''));
    stats.innerHTML = metrics;
    back.disabled = step === 0;
    next.disabled = step === steps.length - 1;
    update(step);
  }
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'back') reveal(step - 1);
    else if (action === 'next') reveal(step + 1);
    else if (action === 'reset') { step = 0; given = keys.map(item => item[1]); draw(); }
  }, { signal });
  dragPoints(board, (i, p) => {
    const [minX, maxX, minY, maxY] = keys[i][2];
    given[i] = pt(clamp(p.x, minX, maxX), clamp(p.y, minY, maxY));
    draw();
  });
  draw();
  return (_, index) => reveal(index);
}
