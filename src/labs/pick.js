import { clamp, isSimplePolygon, latticeCount, pt } from '../math.js';
import { button, dragPoints, metric, point, polygon } from '../board.js';

const STEP = 40, COLS = 15, ROWS = 9;
const shapes = {
  square: [pt(4, 2), pt(8, 2), pt(8, 6), pt(4, 6)],
  triangle: [pt(3, 7), pt(12, 6), pt(6, 2)],
  arrow: [pt(2, 4), pt(7, 1), pt(7, 3), pt(13, 3), pt(13, 6), pt(7, 6), pt(7, 8)],
};
const toBoard = p => pt(p.x * STEP, p.y * STEP);
const toLattice = p => pt(clamp(Math.round(p.x / STEP), 1, COLS), clamp(Math.round(p.y / STEP), 1, ROWS));

export function pickLab({ board, controls, stats, signal }) {
  let corners = shapes.square.map(p => ({ ...p })), shape = 'square';
  controls.innerHTML = `<div class="control-row">${button('正方形', 'square', 'aria-pressed="false"')}${button('斜三角形', 'triangle', 'aria-pressed="false"')}${button('箭头', 'arrow', 'aria-pressed="false"')}</div>
    <p class="lab-note">拖动顶点（会吸在格点上），或选中顶点用方向键一格一格地走。数一数图形里面和边上各有几个格点。</p>`;

  function draw(focus) {
    const simple = isSimplePolygon(corners);
    const count = simple ? latticeCount(corners) : null;
    const inside = new Set(count?.interiorPoints.map(p => `${p.x},${p.y}`));
    const edge = new Set(count?.boundaryPoints.map(p => `${p.x},${p.y}`));
    let dots = '';
    for (let x = 1; x <= COLS; x++) {
      for (let y = 1; y <= ROWS; y++) {
        const key = `${x},${y}`, kind = inside.has(key) ? 'pick-in fade-in' : edge.has(key) ? 'pick-on' : 'pick-dot';
        dots += `<circle cx="${x * STEP}" cy="${y * STEP}" r="${kind === 'pick-dot' ? 2.4 : 5.5}" class="${kind}"/>`;
      }
    }
    board.draw(dots + polygon(corners.map(toBoard), simple ? 'shape pick-shape' : 'shape pick-shape is-crossed') +
      corners.map((p, i) => point(toBoard(p), String.fromCharCode(65 + i), { key: String(i), kind: 'draggable' })).join(''));
    for (const item of controls.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item.dataset.action === shape));
    stats.innerHTML = count
      ? metric('里面的格点 I', count.interior) + metric('边上的格点 B', count.boundary) +
        metric('I + B ÷ 2 − 1', count.interior + count.boundary / 2 - 1) + metric('实际面积（格）', count.area)
      : metric('边交叉了', '皮克公式只管不自交的多边形');
    if (focus !== undefined) board.svg.querySelector(`[data-point="${focus}"]`)?.focus();
  }

  function show(name) {
    shape = name;
    corners = shapes[name].map(p => ({ ...p }));
    draw();
    board.animate('.pick-shape, .pick-in');
  }

  dragPoints(board, (key, p) => {
    corners[Number(key)] = toLattice(p);
    shape = '';
    draw();
  });
  board.svg.addEventListener('keydown', event => {
    const handle = event.target.closest('[data-point]');
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!handle || !Object.hasOwn(moves, event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const i = Number(handle.dataset.point), [dx, dy] = moves[event.key];
    corners[i] = pt(clamp(corners[i].x + dx, 1, COLS), clamp(corners[i].y + dy, 1, ROWS));
    shape = '';
    draw(i);
  }, { capture: true, signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (Object.hasOwn(shapes, action)) show(action);
  }, { signal });
  draw();
  return (_, name) => show(name);
}
