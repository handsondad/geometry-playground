import { pt } from '../math.js';
import { button, line, metric, point, polygon, slider } from '../board.js';

export function hexPatch(rings, side) {
  const cells = new Map(), links = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      if (Math.abs(q + r) > rings) continue;
      const center = pt(side * Math.sqrt(3) * (q + r / 2), side * 1.5 * r);
      cells.set(`${q},${r}`, { q, r, center });
    }
  }
  for (const cell of cells.values()) {
    for (const [dq, dr] of [[1, 0], [0, 1], [-1, 1]]) {
      const neighbor = cells.get(`${cell.q + dq},${cell.r + dr}`);
      if (neighbor) links.push([cell, neighbor]);
    }
  }
  return { cells, links };
}

export function dualTilingLab({ board, controls, stats, signal }) {
  const views = { cells: '蜂窝', both: '叠加', links: '三角网' };
  let view = 'cells';
  controls.innerHTML = slider('向外扩展圈数', 'dual-rings', 1, 1, 3) +
    `<div class="control-row">${Object.entries(views).map(([id, label]) => button(label, id, 'aria-pressed="false"')).join('')}</div>
    <p class="lab-note">切换到「叠加」，找出填色的三个中心。切换到「三角网」，再数中央点的邻居。</p>`;
  const input = controls.querySelector('input');

  function draw() {
    const rings = Number(input.value), side = 171 / (1.5 * rings + 1);
    const { cells, links } = hexPatch(rings, side);
    const project = p => pt(320 + p.x, 200 + p.y);
    const focus = ['0,0', '1,0', '0,1'].map(id => cells.get(id));
    const hex = cell => Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI * (i / 3 - .5);
      return project(pt(cell.center.x + side * Math.cos(a), cell.center.y + side * Math.sin(a)));
    });
    board.draw(
      (view === 'links' ? '' : [...cells.values()].map(cell => polygon(hex(cell),
        focus.includes(cell) ? 'shape dual-focus' : 'shape dual-cell')).join('')) +
      (view === 'cells' ? '' : polygon(focus.map(cell => project(cell.center)), 'image-shape dual-triangle') +
        links.map(([a, b]) => line(project(a.center), project(b.center), 'structural dual-link')).join('') +
        [...cells.values()].map(cell => point(project(cell.center), '', { kind: focus.includes(cell) ? 'highlight' : 'point' })).join(''))
    );
    input.previousElementSibling.value = input.value;
    for (const btn of controls.querySelectorAll('button')) btn.setAttribute('aria-pressed', String(btn.dataset.action === view));
    stats.innerHTML = metric('蜂窝格数', cells.size) +
      (view === 'cells' ? '' : metric('中心连线', links.length) +
        metric('中央点邻居', links.filter(pair => pair.includes(focus[0])).length));
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!Object.hasOwn(views, action)) return;
    view = action;
    draw();
    board.animate(view === 'cells' ? '.dual-focus' : '.dual-triangle, .dual-link');
  }, { signal });
  draw();
  return (_, rings, mode) => {
    input.value = rings;
    view = mode;
    draw();
    board.animate(view === 'cells' ? '.dual-focus' : '.dual-triangle, .dual-link');
  };
}
