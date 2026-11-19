import { add, cornerTile, cross, geodesicAngle, geodesicThrough, hyperbolicTiling, interiorAngle, mul, norm, pt, sub } from '../math.js';
import { button, circle, dragPoints, metric, point, slider, text } from '../board.js';

const O = pt(320, 200), R = 184;
const solids = { '3,3': '正四面体', '4,3': '正方体', '3,4': '正八面体', '5,3': '正十二面体', '3,5': '正二十面体' };
const toBoard = z => add(O, mul(z, R));
const coords = p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const cache = new Map();
const tilingOf = (p, q, shift) => {
  if (shift.x || shift.y) return hyperbolicTiling(p, q, .022, 900, shift);
  const key = `${p},${q}`;
  if (!cache.has(key)) cache.set(key, hyperbolicTiling(p, q, .022, 900));
  return cache.get(key);
};

function arcPath(vertices) {
  const edge = (u, v) => {
    const c = geodesicThrough(u, v), end = coords(toBoard(v));
    if (!c) return `L${end}`;
    const r = (R * c.radius).toFixed(1);
    return `A${r} ${r} 0 0 ${cross(sub(u, c.center), sub(v, c.center)) > 0 ? 1 : 0} ${end}`;
  };
  return `M${coords(toBoard(vertices[0]))}${vertices.map((v, i) => edge(v, vertices[(i + 1) % vertices.length])).join('')}Z`;
}

export function hyperbolicTilingLab({ board, controls, stats, signal }) {
  let shift = pt(0, 0);
  controls.innerHTML = slider('每块砖有几条边 p', 'tile-p', 7, 3, 9) + slider('每个顶点围几块 q', 'tile-q', 3, 3, 9) +
    `<div class="control-row">${button('把中间那块拉回圆心', 'tile-center')}</div>
    <p class="lab-note">拖动「中间那块」的圆点，把这块砖拉向边缘；它会变小，可边数、角度都和原来一样。</p>`;
  const [pInput, qInput] = controls.querySelectorAll('input');

  function draw() {
    const p = Number(pInput.value), q = Number(qInput.value), kind = Math.sign((p - 2) * (q - 2) - 4);
    pInput.previousElementSibling.value = String(p);
    qInput.previousElementSibling.value = String(q);
    if (kind > 0) {
      const tiles = tilingOf(p, q, shift);
      const byTone = [0, 1, 2].map(tone => tiles.filter(t => t.depth % 3 === tone).map(t => arcPath(t.vertices)).join(''));
      const first = tiles[0].vertices, corner = geodesicAngle(first[0], first[1], first[p - 1]) * 180 / Math.PI;
      board.draw(circle(O, R, 'hyper-disk') +
        byTone.map((d, tone) => `<path d="${d}" class="hyper-tile is-tone-${tone}"/>`).join('') +
        `<path d="${arcPath(first)}" class="result hyper-first"/>` + circle(O, R, 'hyper-rim') +
        point(toBoard(shift), '中间那块', { key: 'tile-shift', kind: 'draggable' }));
      stats.innerHTML = metric(`{${p}, ${q}} 在哪里铺`, '双曲平面，铺不完') + metric('每个角（实测）', `${corner.toFixed(1)}°`) +
        metric(`q 个角加起来`, `${(corner * q).toFixed(1)}°`) + metric(`平面上正 ${p} 边形的角`, `${interiorAngle(p).toFixed(1)}°`);
    } else {
      const side = p > 4 ? 82 : 104, sum = q * interiorAngle(p);
      let heading = -Math.PI / 2;
      const fan = Array.from({ length: q }, (_, i) => {
        const tile = cornerTile(O, side, p, heading);
        heading += interiorAngle(p) * Math.PI / 180;
        return `<polygon points="${tile.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')}" class="hyper-flat is-tone-${i % 3}"/>`;
      }).join('');
      board.draw(fan + text(add(O, pt(-60, R - 6)), kind < 0 ? `还差 ${(360 - sum).toFixed(0)}°，能折起来` : '刚好 360°，平平铺开', 'graph-note hyper-note') +
        point(O, ''));
      stats.innerHTML = metric(`{${p}, ${q}} 在哪里铺`, kind < 0 ? `球面：${solids[`${p},${q}`]}` : '平面') +
        metric('每个角', `${interiorAngle(p).toFixed(1)}°`) + metric(`q 个角加起来`, `${sum.toFixed(1)}°`) + metric('和 360° 比', kind < 0 ? '不够' : '正好');
    }
  }

  function show(p, q, distance) {
    pInput.value = p;
    qInput.value = q;
    shift = mul(pt(Math.cos(-Math.PI / 5), Math.sin(-Math.PI / 5)), distance);
    draw();
    board.animate('.hyper-first, .hyper-flat');
  }

  dragPoints(board, (_, position) => {
    const z = mul(sub(position, O), 1 / R), size = norm(z);
    shift = size > .86 ? mul(z, .86 / size) : z;
    draw();
  });
  controls.addEventListener('input', () => { shift = pt(0, 0); draw(); }, { signal });
  controls.addEventListener('click', event => {
    if (event.target.closest('button')?.dataset.action === 'tile-center') show(pInput.value, qInput.value, 0);
  }, { signal });
  draw();
  return (_, p, q, distance) => show(p, q, distance);
}
