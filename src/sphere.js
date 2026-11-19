import { pt } from './math.js';
import { button, circle, line, metric, slider, text } from './board.js';
import { dotN, mixN, normalized, spherePoint, visibleSphericalPolygon } from './spatial-math.js';
import { ease, path, rad, readout, spatialStudio, stage, trace, transport } from './spatial-view.js';

const graticule = [
  ...trace(11, f => trace(60, g => spherePoint(Math.PI * (g - .5), Math.PI * f * 11 / 12))),
  ...[-60, -30, 0, 30, 60].map(lat => trace(96, f => spherePoint(rad(lat), rad(360 * f)))),
];
const greatArc = (a, b) => trace(32, f => normalized(mixN(a, b, f)));

function visibleLine(world, { eye, project }, cls) {
  const sections = [];
  let segment = [];
  for (const [i, p] of world.entries()) {
    const d = dotN(p, eye);
    if (i) {
      const prev = world[i - 1], was = dotN(prev, eye);
      if ((was < 0) !== (d < 0)) {
        segment.push(project(normalized(mixN(prev, p, was / (was - d)))));
        if (d < 0) { sections.push(segment); segment = []; }
      }
    }
    if (d >= 0) segment.push(project(p));
  }
  return [...sections, segment].map(points => path(points, cls)).join('');
}

function angleArc(a, b, c) {
  const tangent = p => normalized(p.map((n, i) => n - dotN(a, p) * a[i]));
  const u = tangent(b), v = tangent(c);
  const angle = Math.acos(Math.max(-1, Math.min(1, dotN(u, v))));
  const offset = .145;
  return trace(24, f => {
    const s = Math.sin((1 - f) * angle) / Math.sin(angle), t = Math.sin(f * angle) / Math.sin(angle);
    return a.map((n, i) => n * Math.cos(offset) + (s * u[i] + t * v[i]) * Math.sin(offset));
  });
}

export function sphere(ctx) {
  const { board, controls, stats, signal, guide } = ctx;
  controls.innerHTML = slider('经度差 Δλ', 'longitude', 90, 10, 160, 1, '°') +
    `<div class="control-row">${[30, 90, 150].map(n => button(`${n}°`, n)).join('')}${transport('展开球面三角形')}</div>`;
  guide.innerHTML = '<p class="lab-note">在单位球上，球面三角形的面积等于球面角超（弧度）。试着把经度差从 30° 加到 90°：底边变长，两个赤道角仍是直角，面积和角超都变成原来的三倍。</p>';
  const input = controls.querySelector('input'), center = pt(184, 203), radius = 138;
  const studio = spatialStudio(ctx, draw, [0, 27], '内角和对照');

  function draw() {
    const n = Number(input.value), half = rad(n / 2);
    const vertices = [[0, 1, 0], spherePoint(0, -half), spherePoint(0, half)];
    const camera = studio.camera(center, radius), { project, eye } = camera;
    const visible = visibleSphericalPolygon(vertices, eye);
    const outline = visible.length < 3 ? [] : visible.flatMap((p, i) => greatArc(p, visible[(i + 1) % visible.length]).slice(0, -1)).map(project);
    const globe = `<defs>
      <radialGradient id="space-globe" cx="32%" cy="24%" r="74%">
        <stop stop-color="#f4fbff"/><stop offset=".62" stop-color="#cde8f2"/><stop offset="1" stop-color="#99cadc"/>
      </radialGradient>
    </defs>` + circle(center, radius, 'space-globe') +
      path(outline, 'space-spherical-fill', true) + graticule.map(curve => visibleLine(curve, camera, 'space-graticule')).join('') +
      vertices.map((p, i) => {
        const b = vertices[(i + 1) % 3], c = vertices[(i + 2) % 3], q = project(p);
        return visibleLine(greatArc(p, b), camera, 'space-accent') + visibleLine(angleArc(p, b, c), camera, 'space-angle') +
          (dotN(p, eye) < 0 ? '' : circle(q, 4, 'space-point') + text(pt(q.x + (q.x > center.x ? 8 : -15), q.y - 9), 'NAB'[i], 'space-vertex'));
      }).join('');
    const x = 396, y = 273, excess = 180 * n / 360;
    const panel = text(pt(401, 111), '90° + 90°', 'space-expression') +
      text(pt(401, 153), `+ ${n}°`, 'space-expression space-gold') +
      line(pt(398, 169), pt(582, 169), 'space-axis') +
      text(pt(401, 210), `= ${180 + n}°`, 'space-expression') +
      text(pt(x, 250), '平面 180°', 'space-label') +
      line(pt(x, y), pt(x + 180, y), 'space-meter-bg') +
      line(pt(x, y), pt(x + 90, y), 'space-cold-line') +
      line(pt(x + 90, y), pt(x + 90 + excess, y), 'space-accent') +
      text(pt(x, 314), `多出的 ${n}° = ${rad(n).toFixed(3)} 弧度`, 'space-label');
    board.draw(stage('沿大圆行走', '曲率留下的角超', globe, panel,
      '金线沿球面，不是屏幕上的直线', '单位球：面积 = 角超（弧度）'));
    readout(input, `${n}°`);
    stats.innerHTML = metric('三角形内角和', `${180 + n}°`) + metric('比平面多', `${n}°`) +
      metric('占整个球面的面积', `${(100 * n / 720).toFixed(2)}%`);
  }
  function sweep(from, to, duration) {
    studio.animate(duration, t => { input.value = Math.round(from + (to - from) * ease(t)); draw(); });
  }
  controls.addEventListener('input', () => { studio.stop(); draw(); }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'play-space' && !studio.playing) { sweep(10, 160, 3600); return; }
    studio.stop();
    if (action !== 'play-space') input.value = action;
    draw();
  }, { signal });
  draw();
  return (_, to) => sweep(to === 30 ? 10 : to - 55, to, 1300);
}
