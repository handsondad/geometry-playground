import { cornerTile, interiorAngle, pt } from '../math.js';
import { platonicSolids } from '../spatial-math.js';
import { button, metric, slider, text } from '../board.js';

const solidFor = { '3,3': 'tetrahedron', '4,3': 'cube', '3,4': 'octahedron', '5,3': 'dodecahedron', '3,5': 'icosahedron' };
const names = { tetrahedron: '正四面体', cube: '正方体', octahedron: '正八面体', dodecahedron: '正十二面体', icosahedron: '正二十面体' };
const faceNames = { 3: '正三角形', 4: '正方形', 5: '正五边形', 6: '正六边形' };
const fanCenter = pt(168, 214), solidCenter = pt(486, 206);
const coords = p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const shape = (points, cls, style = '') => `<path d="M${points.map(coords).join('L')}Z" class="${cls}"${style ? ` style="${style}"` : ''}/>`;

function solidPicture(solid, yaw) {
  const pitch = .38, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const turned = solid.vertices.map(([x, y, z]) => {
    const x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
    return [x1, cp * y - sp * z1, sp * y + cp * z1];
  });
  const screen = turned.map(([x, y]) => pt(solidCenter.x + 118 * x, solidCenter.y - 118 * y));
  const faces = solid.faces.map(face => {
    const [a, b, c] = face.map(n => turned[n]);
    const u = b.map((x, i) => x - a[i]), v = c.map((x, i) => x - b[i]);
    const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const light = (-.35 * normal[0] + .55 * normal[1] + .76 * normal[2]) / Math.hypot(...normal);
    return { face, front: normal[2] > 0, light, depth: face.reduce((sum, n) => sum + turned[n][2], 0) / face.length };
  }).sort((a, b) => a.depth - b.depth);
  return faces.filter(f => !f.front).map(f => shape(f.face.map(n => screen[n]), 'platonic-back')).join('') +
    faces.filter(f => f.front).map(f => shape(f.face.map(n => screen[n]), 'platonic-face',
      `fill:color-mix(in srgb, var(--bubble, #7c6cf0) ${Math.round(24 + 46 * Math.max(0, f.light))}%, white)`)).join('');
}

export function platonicLab({ board, controls, stats, signal }) {
  let sides = 3;
  controls.innerHTML = `<div class="control-row">${[3, 4, 5, 6].map(n => button(faceNames[n], `platonic-${n}`, 'aria-pressed="false"')).join('')}</div>` +
    slider('每个顶点围几块', 'platonic-around', 3, 3, 6, 1, ' 块') + slider('转一转', 'platonic-yaw', 100, 0, 360, 1, '°') +
    '<p class="lab-note">把同样的正多边形围在一个顶点上：留出缺口才折得起来，刚好 360° 只能铺平，超过就挤不下了。</p>';
  const [aroundInput, yawInput] = controls.querySelectorAll('input');

  function draw() {
    const around = Number(aroundInput.value), corner = interiorAngle(sides), sum = around * corner, gap = 360 - sum;
    const side = sides === 3 ? 108 : sides === 4 ? 92 : sides === 5 ? 74 : 62;
    let heading = -Math.PI / 2 - (sum * Math.PI / 180) / 2;
    const fan = Array.from({ length: around }, (_, i) => {
      const tile = cornerTile(fanCenter, side, sides, heading);
      heading += corner * Math.PI / 180;
      return shape(tile, `platonic-tile is-${i % 3}${gap < -1e-9 ? ' is-crowded' : ''}`);
    }).join('');
    const id = solidFor[`${sides},${around}`], solid = platonicSolids.find(s => s.id === id);
    const verdict = gap > 1e-9 ? `缺口 ${gap.toFixed(0)}°：能折成立体` : Math.abs(gap) < 1e-9 ? '刚好 360°：只能铺平' : `多出 ${(-gap).toFixed(0)}°：挤不下`;
    board.draw(`<circle cx="${fanCenter.x}" cy="${fanCenter.y}" r="4" class="platonic-vertex"/>` + fan +
      text(pt(36, 386), verdict, 'graph-note platonic-verdict') +
      (solid ? solidPicture(solid, Number(yawInput.value) * Math.PI / 180) + text(pt(430, 386), names[id], 'graph-note platonic-name')
        : text(pt(390, 210), gap < 1e-9 && gap > -1e-9 ? '铺成一整片平地' : '这样的立体不存在', 'graph-note platonic-none')));
    aroundInput.previousElementSibling.value = `${around} 块`;
    yawInput.previousElementSibling.value = `${yawInput.value}°`;
    for (const item of controls.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item.dataset.action === `platonic-${sides}`));
    stats.innerHTML = metric('一个顶点上的角加起来', `${sum.toFixed(0)}°`) + metric('离 360° 还差', `${gap.toFixed(0)}°`) +
      metric('能折成', solid ? names[id] : '—') + metric('720° ÷ 缺口', gap > 1e-9 ? `${(720 / gap).toFixed(0)} = 顶点数 ${solid.vertices.length}` : '—');
  }

  function show(nextSides, around) {
    sides = nextSides;
    aroundInput.value = around;
    draw();
    board.animate('.platonic-tile, .platonic-face');
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action?.startsWith('platonic-')) show(Number(action.slice(9)), aroundInput.value);
  }, { signal });
  draw();
  return (_, nextSides, around) => show(nextSides, around);
}
