import { pt } from '../math.js';
import { button, metric, polygon, slider, text } from '../board.js';

export function triangulatedSheet(divisions, hole) {
  const faces = [], vertices = new Set(), edges = new Set();
  const start = divisions / 4, end = 3 * start, stride = divisions + 1;
  for (let y = 0; y < divisions; y++) {
    for (let x = 0; x < divisions; x++) {
      if (hole && x >= start && x < end && y >= start && y < end) continue;
      const a = y * stride + x, b = a + 1, c = a + stride, d = c + 1;
      faces.push([a, b, d], [a, d, c]);
    }
  }
  for (const face of faces) {
    for (const [i, a] of face.entries()) {
      vertices.add(a);
      const b = face[(i + 1) % 3];
      edges.add(a < b ? `${a},${b}` : `${b},${a}`);
    }
  }
  return { faces, vertices, edges, characteristic: vertices.size - edges.size + faces.length };
}

export function eulerHolesLab({ board, controls, stats, signal }) {
  let hole = false;
  controls.innerHTML = slider('每边的网格数', 'euler-grid', 4, 4, 12, 4) +
    slider('拉斜纸面', 'euler-skew', 0, -100, 100, 1, '%') +
    `<div class="control-row">${button('挖去中央', 'euler-hole', 'aria-pressed="false"')}</div>
    <p class="lab-note">共享边与共享点只数一次。挖洞后，洞的边界仍算边，但里面没有面。</p>`;
  const grid = controls.querySelector('#euler-grid'), skew = controls.querySelector('#euler-skew');
  const toggle = controls.querySelector('button');

  function draw() {
    const n = Number(grid.value), mesh = triangulatedSheet(n, hole);
    const project = (x, y) => pt(165 + 310 * x + Number(skew.value) * .8 * (1 - 2 * y), 45 + 310 * y);
    const vertex = i => project(i % (n + 1) / n, Math.floor(i / (n + 1)) / n);
    const outline = (a, b) => [project(a, a), project(b, a), project(b, b), project(a, b)];
    board.draw(mesh.faces.map(face => polygon(face.map(vertex), 'euler-face')).join('') +
      polygon(outline(0, 1), 'structural euler-boundary') +
      (hole ? polygon(outline(.25, .75), 'result euler-boundary') + text(pt(301, 205), '空洞') : ''));
    grid.previousElementSibling.value = grid.value;
    skew.previousElementSibling.value = `${skew.value}%`;
    toggle.textContent = hole ? '补回中央' : '挖去中央';
    toggle.setAttribute('aria-pressed', String(hole));
    stats.innerHTML = metric('顶点 V', mesh.vertices.size) + metric('边 E', mesh.edges.size) +
      metric('三角面 F', mesh.faces.length) +
      metric('欧拉示性数 χ', `${mesh.vertices.size} − ${mesh.edges.size} + ${mesh.faces.length} = ${mesh.characteristic}`);
  }

  controls.addEventListener('input', draw, { signal });
  toggle.addEventListener('click', () => {
    hole = !hole;
    draw();
    board.animate('.euler-boundary');
  }, { signal });
  draw();
  return (_, divisions, cut) => {
    grid.value = divisions;
    skew.value = 0;
    hole = cut;
    draw();
    board.animate('.euler-boundary');
  };
}
