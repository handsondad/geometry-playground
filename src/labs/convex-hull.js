import { cross, dist, pt, sub } from '../math.js';
import { button, dragPoints, line, metric, point, polygon } from '../board.js';

export function convexHull(points) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const unique = sorted.filter((p, i) => !i || p.x !== sorted[i - 1].x || p.y !== sorted[i - 1].y);
  if (unique.length < 2) return unique;
  const turn = (a, b, c) => cross(sub(b, a), sub(c, a));
  const chain = order => {
    const result = [];
    for (const p of order) {
      while (result.length > 1 && turn(result.at(-2), result.at(-1), p) <= 0) result.pop();
      result.push(p);
    }
    return result.slice(0, -1);
  };
  return [...chain(unique), ...chain(unique.reverse())];
}

export function convexHullLab({ board, controls, stats, signal }) {
  const fixed = [pt(165, 133), pt(438, 133), pt(529, 244), pt(388, 332), pt(173, 313),
    pt(103, 226), pt(221, 189), pt(357, 236), pt(260, 268)];
  const positions = { inside: pt(305, 177), edge: pt(305, 133), outside: pt(305, 55) };
  let moving = positions.inside;
  controls.innerHTML = `<div class="control-row">${button('内部', 'inside', 'aria-pressed="false"')}${button('边上', 'edge', 'aria-pressed="false"')}${button('外侧', 'outside', 'aria-pressed="false"')}</div>
    <p class="lab-note">拖动 P，或选中 P 后用方向键移动。试着让 P 贴住上方直边，再稍稍越过它。</p>`;

  function draw() {
    const hull = convexHull([...fixed, moving]);
    const onEdge = hull.some((p, i) => {
      const q = hull[(i + 1) % hull.length];
      return cross(sub(q, p), sub(moving, p)) === 0 &&
        dist(p, moving) <= dist(p, q) && dist(q, moving) <= dist(p, q);
    });
    const role = hull.includes(moving) ? '凸包顶点' : onEdge ? '在边上，不是角' : '严格在内部';
    const area = Math.abs(hull.reduce((sum, p, i) => sum + cross(p, hull[(i + 1) % hull.length]), 0)) / 2;
    board.draw(polygon(hull, 'shape') +
      hull.map((p, i) => line(p, hull[(i + 1) % hull.length], 'result hull-edge')).join('') +
      fixed.map(p => point(p, '', { kind: hull.includes(p) ? 'highlight' : 'hull-interior' })).join('') +
      point(moving, 'P', { key: 'hull-p', kind: 'hull-probe' }));
    for (const btn of controls.querySelectorAll('button')) {
      btn.setAttribute('aria-pressed', String(positions[btn.dataset.action] === moving));
    }
    stats.innerHTML = metric('P 的位置', role) + metric('凸包顶点数', hull.length) +
      metric('凸包面积 · 画板平方单位', Math.round(area));
  }

  function preset(name) {
    moving = positions[name];
    draw();
    board.animate('.hull-edge');
  }

  dragPoints(board, (_, p) => { moving = p; draw(); });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (Object.hasOwn(positions, action)) preset(action);
  }, { signal });
  draw();
  return (_, name) => preset(name);
}
