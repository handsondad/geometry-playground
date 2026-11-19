import { add, mul, pt, theodorus } from '../math.js';
import { hypercube } from '../spatial-math.js';
import { line, metric, polygon, slider, text } from '../board.js';

const spiralCenter = pt(514, 214), UNIT = 60;
const box = { left: 24, right: 306, top: 62, bottom: 372 };

/** Screen directions for the n unit edges: a real square and cube first, then a fan. */
function axes(n) {
  if (n === 1) return [pt(1, 0)];
  if (n === 2) return [pt(1, 0), pt(0, -1)];
  if (n === 3) return [pt(1, 0), pt(0, -1), pt(.52, -.34)];
  return Array.from({ length: n }, (_, i) => pt(Math.cos(Math.PI * i / n), -Math.sin(Math.PI * i / n)));
}

export function cubeDiagonalLab({ board, controls, stats, signal }) {
  controls.innerHTML = slider('维数 n', 'diag-n', 3, 1, 8, 1) +
    '<p class="lab-note">每多一维，就多一条和前面都垂直、长度为 1 的棱。左边是 n 维立方体的影子，右边把每一步的直角三角形接起来。</p>';
  const input = controls.querySelector('input');

  function draw() {
    const n = Number(input.value), dirs = axes(n), { vertices, edges } = hypercube(n);
    const raw = vertices.map(v => v.reduce((sum, x, i) => add(sum, mul(dirs[i], (x + 1) / 2)), pt(0, 0)));
    const xs = raw.map(p => p.x), ys = raw.map(p => p.y);
    const scale = Math.min((box.right - box.left) / Math.max(1e-9, Math.max(...xs) - Math.min(...xs)), (box.bottom - box.top) / Math.max(1e-9, Math.max(...ys) - Math.min(...ys)), 150);
    const shift = pt((box.left + box.right) / 2 - scale * (Math.max(...xs) + Math.min(...xs)) / 2, (box.top + box.bottom) / 2 - scale * (Math.max(...ys) + Math.min(...ys)) / 2);
    const place = p => add(shift, mul(p, scale));
    const walk = [0];
    for (let i = 0; i < n; i++) walk.push(walk[i] | 1 << i);
    const spokes = theodorus(n).map(p => add(spiralCenter, mul(pt(p.x, -p.y), UNIT)));
    board.draw(edges.map(([a, b]) => line(place(raw[a]), place(raw[b]), 'diag-edge')).join('') +
      walk.slice(1).map((v, i) => line(place(raw[walk[i]]), place(raw[v]), 'aux alt diag-walk')).join('') +
      line(place(raw[0]), place(raw[vertices.length - 1]), 'result diag-main') +
      spokes.slice(0, -1).map((p, k) => polygon([spiralCenter, p, spokes[k + 1]], `shape diag-step${k === n - 2 ? ' is-last' : ''}`)).join('') +
      spokes.map((p, k) => line(spiralCenter, p, k === n - 1 ? 'result theo-spoke' : 'structural theo-spoke') +
        text(add(spiralCenter, mul(add(p, mul(spiralCenter, -1)), 1.1)), `√${k + 1}`, 'graph-note diag-root')).join('') +
      text(pt(24, 40), `${n} 维立方体的影子`, 'graph-note') + text(pt(380, 40), '一维一维接起来的直角三角形', 'graph-note'));
    input.previousElementSibling.value = String(n);
    const root = Math.sqrt(n);
    stats.innerHTML = metric('维数', n) + metric('最长对角线', Number.isInteger(root) ? `√${n} = ${root}` : `√${n} ≈ ${root.toFixed(3)}`) +
      metric('沿着棱走过去', `${n} 步`) + metric('顶点', 2 ** n);
  }

  function show(n) {
    input.value = n;
    draw();
    board.animate('.diag-main, .diag-walk, .theo-spoke, .diag-step');
  }

  controls.addEventListener('input', draw, { signal });
  draw();
  return (_, n) => show(n);
}
