import { pt } from '../math.js';
import { cubeCut, dotN, hypercube, normalized, planeBasis } from '../spatial-math.js';
import { button, metric, slider, text } from '../board.js';

const shapes = { sphere: '球', 'cube-face': '正方体（面朝下）', 'cube-corner': '正方体（角朝下）' };
const scene = pt(198, 206), detail = pt(518, 212), S = 56, D = 72;
const yaw = -.5, pitch = .36;
const coords = p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const cube = hypercube(3);
const sectionName = { 3: '三角形', 4: '正方形', 6: '六边形' };

function project([x, y, z]) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
  return pt(scene.x + S * x1, scene.y - S * (Math.cos(pitch) * y - Math.sin(pitch) * z1));
}
/** Cube vertices (±1) carried so that `up` points straight up, then lifted by `height`. */
function lift(up, height) {
  const n = normalized(up), [u, v] = planeBasis(up);
  return p => [dotN(p, u), dotN(p, n) + height, dotN(p, v)];
}

export function flatlandLab({ board, controls, stats, signal }) {
  let shape = 'sphere';
  controls.innerHTML = `<div class="control-row">${Object.entries(shapes).map(([id, label]) => button(label, id, 'aria-pressed="false"')).join('')}</div>` +
    slider('物体中心离平面国多高', 'flat-height', 60, -190, 190, 1) +
    '<p class="lab-note">慢慢拖动高度，让物体从平面国上方穿过去。右边是平面国居民能看到的全部：只有切口。</p>';
  const input = controls.querySelector('input');

  function draw() {
    const height = Number(input.value) / 100;
    const plane = [[-2.6, 0, -1.9], [2.6, 0, -1.9], [2.6, 0, 1.9], [-2.6, 0, 1.9]].map(project);
    let body = '', cut = '', flat = '', name = '不相交', area = 0;
    if (shape === 'sphere') {
      const center = project([0, height, 0]), r = Math.sqrt(Math.max(0, 1 - height * height));
      body = `<circle cx="${center.x.toFixed(1)}" cy="${center.y.toFixed(1)}" r="${S}" class="flat-body"/>`;
      if (r > 0) {
        const ring = Array.from({ length: 73 }, (_, i) => project([r * Math.cos(i * Math.PI / 36), 0, r * Math.sin(i * Math.PI / 36)]));
        cut = `<path d="M${ring.map(coords).join('L')}" class="result flat-section"/>`;
        flat = `<circle cx="${detail.x}" cy="${detail.y}" r="${(D * r).toFixed(1)}" class="result flat-section flat-true"/>`;
        name = '圆';
        area = Math.PI * r * r;
      }
    } else {
      const corner = shape === 'cube-corner', up = corner ? [1, 1, 1] : [0, 1, 0], place = lift(up, height);
      const world = cube.vertices.map(place);
      body = cube.edges.map(([i, j]) => {
        const [a, b] = [project(world[i]), project(world[j])];
        return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" class="flat-edge"/>`;
      }).join('');
      const section = cubeCut(corner ? 'diagonal' : 'face', -height * 100 / (corner ? Math.sqrt(3) : 1));
      if (section.section.length >= 3) {
        cut = `<path d="M${section.section.map(p => coords(project(place(p)))).join('L')}Z" class="result flat-section"/>`;
        const [u, v] = planeBasis(up);
        flat = `<path d="M${section.section.map(p => coords(pt(detail.x + D * dotN(p, u), detail.y + D * dotN(p, v)))).join('L')}Z" class="result flat-section flat-true"/>`;
        name = sectionName[section.section.length] ?? `${section.section.length} 边形`;
        area = section.area;
      }
    }
    board.draw(`<path d="M${plane.map(coords).join('L')}Z" class="flat-plane"/>` + body + cut +
      text(pt(26, 44), '从外面看', 'graph-note') + text(pt(410, 44), '平面国居民看到的', 'graph-note') +
      `<rect x="406" y="66" width="224" height="292" rx="18" class="flat-window"/>` + flat +
      (area ? '' : text(pt(detail.x, detail.y + 5), '什么也没有', 'graph-note flat-empty')));
    input.previousElementSibling.value = height.toFixed(2);
    for (const item of controls.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item.dataset.action === shape));
    stats.innerHTML = metric('物体中心的高度', height.toFixed(2)) + metric('切口形状', name) + metric('切口面积', area ? area.toFixed(2) : '0');
  }

  function show(nextShape, percent) {
    shape = nextShape;
    input.value = percent;
    draw();
    board.animate('.flat-section');
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (Object.hasOwn(shapes, action)) show(action, input.value);
  }, { signal });
  draw();
  return (_, nextShape, percent) => show(nextShape, percent);
}
