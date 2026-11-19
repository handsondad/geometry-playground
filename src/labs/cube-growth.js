import { pt } from '../math.js';
import { hypercube } from '../spatial-math.js';
import { line, metric, point, slider, text } from '../board.js';

export function cubeGrowthLab({ board, controls, stats, signal }) {
  const labels = ['点', '线段', '正方形', '正方体', '四维超立方体', '五维超立方体'];
  const basis = [[48, 0], [0, -48], [29, 22], [-19, -31]];
  const growthAxes = [[0, 0], [85, 0], [0, -48], [70, 38], [127, -24], [176, -30]];
  controls.innerHTML = slider('生长到几维', 'growth-dimension', 3, 0, 5) +
    slider('两份投影的间距', 'growth-gap', 95, 10, 120, 1, '%') +
    '<p class="lab-note">紫色和青色是上一维的两份投影，金线连接对应顶点。拉开间距只改变屏幕上的影子。</p>';
  const dim = controls.querySelector('#growth-dimension'), gap = controls.querySelector('#growth-gap');

  function draw() {
    const n = Number(dim.value), { vertices, edges } = hypercube(n);
    const half = n ? vertices.length / 2 : 0;
    const spread = Number(gap.value) / 120, [dx, dy] = growthAxes[n];
    const positions = vertices.map(vertex => {
      let x = 320, y = 203;
      for (let i = 0; i < n - 1; i++) {
        x += basis[i][0] * vertex[i];
        y += basis[i][1] * vertex[i];
      }
      if (n) {
        x += spread * dx * vertex[n - 1];
        y += spread * dy * vertex[n - 1];
      }
      return pt(x, y);
    });
    const isBridge = ([a, b]) => n > 0 && a < half && b >= half;
    const bridges = edges.filter(isBridge);
    board.draw(bridges.map(([a, b]) => line(positions[a], positions[b], 'result growth-bridge')).join('') +
      edges.filter(edge => !isBridge(edge)).map(([a, b]) => line(positions[a], positions[b], a < half ? 'growth-copy-a' : 'growth-copy-b')).join('') +
      positions.map((p, i) => point(p, '', { kind: n && i >= half ? 'growth-b' : 'growth-a' })).join('') +
      text(pt(24, 35), `${n} 维 · ${labels[n]}`));
    dim.previousElementSibling.value = `${n} 维`;
    gap.previousElementSibling.value = `${gap.value}%`;
    gap.disabled = n === 0;
    stats.innerHTML = metric('顶点数', vertices.length) + metric('总棱数', edges.length) +
      metric('新方向的连接棱', bridges.length);
  }

  controls.addEventListener('input', draw, { signal });
  draw();
  return (_, dimension, separation) => {
    dim.value = dimension;
    gap.value = separation;
    draw();
    board.animate('.growth-bridge');
  };
}
