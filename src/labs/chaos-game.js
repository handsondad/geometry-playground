import { button, line, metric, point, polygon, slider } from '../board.js';
import { mix, pt } from '../math.js';

const layouts = {
  3: [pt(320, 38), pt(132, 38 + 188 * Math.sqrt(3)), pt(508, 38 + 188 * Math.sqrt(3))],
  4: [pt(158, 38), pt(482, 38), pt(482, 362), pt(158, 362)],
};
const labels = 'ABCD', limit = 10000;

export function chaosTrace(vertices, fraction, count, seed) {
  let state = seed >>> 0, current = vertices[0];
  const points = [];
  for (let i = 0; i < count; i++) {
    state = (state + 0x6d2b79f5) >>> 0;
    let bits = Math.imul(state ^ state >>> 15, state | 1);
    bits ^= bits + Math.imul(bits ^ bits >>> 7, bits | 61);
    const target = Math.floor(((bits ^ bits >>> 14) >>> 0) / 2 ** 32 * vertices.length);
    current = mix(current, vertices[target], fraction);
    points.push({ p: current, target });
  }
  return points;
}

export function chaosGameLab({ board, controls, stats, signal }) {
  let sides = 3, seed = 1, count = 1, guides = true;
  controls.innerHTML = `<div class="control-row" role="group" aria-label="外框形状">
      ${button('三角形', 'chaos-three', 'aria-pressed="true"')}${button('正方形', 'chaos-four', 'aria-pressed="false"')}
    </div>` + slider('朝目标顶点走多远', 'chaos-fraction', 50, 25, 75, 1, '%') +
    `<div class="control-row">${button('跳 1 步', 'chaos-step')}${button('+500 点', 'chaos-batch')}${button('+5000 点', 'chaos-cloud')}</div>
    <div class="control-row">${button('标出第一层副本', 'chaos-guides', 'aria-pressed="true"')}${button('换随机序列', 'chaos-seed')}${button('清空落点', 'chaos-clear')}</div>
    <p class="lab-note">颜色表示抽到的顶点；虚线是整块区域做一次同样跳法后的范围。改变步长或外框时，用同一随机序列重算。</p>`;
  const input = controls.querySelector('input');
  const getButton = name => controls.querySelector(`[data-action="chaos-${name}"]`);

  function draw() {
    const vertices = layouts[sides], fraction = Number(input.value) / 100;
    const dots = chaosTrace(vertices, fraction, count, seed);
    const groups = vertices.map(() => []);
    for (const { p, target } of dots) groups[target].push(`M${p.x.toFixed(1)},${p.y.toFixed(1)}h.25`);
    const last = dots.at(-1), previous = dots.at(-2)?.p ?? vertices[0];
    board.draw(polygon(vertices, 'chaos-outline') +
      groups.map((group, i) => group.length ? `<path d="${group.join('')}" class="chaos-dots chaos-color-${i}"/>` : '').join('') +
      (guides ? vertices.map((vertex, i) =>
        polygon(vertices.map(p => mix(p, vertex, fraction)), `chaos-copy chaos-color-${i}`)).join('') : '') +
      (last ? line(previous, last.p, 'chaos-jump') : '') +
      vertices.map((p, i) => point(p, labels[i], { kind: `chaos-vertex chaos-color-${i}` })).join('') +
      point(last?.p ?? vertices[0], '', { kind: 'chaos-current' }));
    input.previousElementSibling.value = `${input.value}%`;
    getButton('three').setAttribute('aria-pressed', String(sides === 3));
    getButton('four').setAttribute('aria-pressed', String(sides === 4));
    getButton('guides').setAttribute('aria-pressed', String(guides));
    for (const key of ['step', 'batch', 'cloud']) getButton(key).disabled = count === limit;
    stats.innerHTML = metric('已跳步数', count) +
      metric('最近抽到的角', last ? labels[last.target] : '尚未抽取') +
      metric('随机序列编号', seed);
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'chaos-three') sides = 3;
    else if (action === 'chaos-four') sides = 4;
    else if (action === 'chaos-step') count = Math.min(limit, count + 1);
    else if (action === 'chaos-batch') count = Math.min(limit, count + 500);
    else if (action === 'chaos-cloud') count = Math.min(limit, count + 5000);
    else if (action === 'chaos-clear') count = 0;
    else if (action === 'chaos-guides') guides = !guides;
    else if (action === 'chaos-seed') seed = (seed + 1) >>> 0;
    else return;
    draw();
    if (action === 'chaos-step') board.animate('.chaos-jump');
  }, { signal });
  draw();
  return (_, shape, fraction, steps) => {
    sides = shape;
    input.value = fraction;
    count = steps;
    seed = 1;
    guides = true;
    draw();
    board.animate('.chaos-copy');
  };
}
