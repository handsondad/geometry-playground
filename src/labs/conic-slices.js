import { line, metric, polygon, slider } from '../board.js';
import { pt } from '../math.js';
import { modeButton, path, rad, readout, selection, spatialStudio, stage, tau, trace, transport } from '../spatial-view.js';

const height = .9, coneEnd = 2.5, extent = 3.6;
const types = { 0: '圆', 22: '椭圆', 45: '抛物线', 68: '双曲线' };

export function conicSection(degrees) {
  const angle = rad(degrees), sin = Math.sin(angle), cos = Math.cos(angle);
  const kind = degrees === 0 ? '圆' : degrees < 45 ? '椭圆' : degrees === 45 ? '抛物线' : '双曲线';
  const world = ([u, v]) => [u * cos, height + u * sin, v];
  // On the cone x² + z² = y², the two factors below give v² in the cutting plane.
  const factors = [sin + cos, degrees === 45 ? 0 : sin - cos];
  const vSquared = u => factors.reduce((value, f) => value * (height + f * u), 1);
  const [lo, hi] = sin ? [Math.max(-extent, (-coneEnd - height) / sin), Math.min(extent, (coneEnd - height) / sin)] : [-extent, extent];
  const roots = factors.filter(Boolean).map(f => -height / f);
  const stops = [lo, ...roots.filter(u => u > lo && u < hi).sort((a, b) => a - b), hi];
  const branches = [];
  for (let i = 0; i + 1 < stops.length; i++) {
    const a = stops[i], b = stops[i + 1];
    if (vSquared((a + b) / 2) <= 0) continue;
    const top = trace(56, t => {
      const u = a + (b - a) * (1 - Math.cos(Math.PI * t)) / 2;
      return [u, Math.sqrt(Math.max(0, vSquared(u)))];
    });
    const bottom = top.map(([u, v]) => [u, -v]).reverse();
    const joinLeft = Math.abs(vSquared(a)) < 1e-10, joinRight = Math.abs(vSquared(b)) < 1e-10;
    const side = height + (a + b) / 2 * sin < 0 ? 'lower' : 'upper';
    if (joinRight) branches.push({ points: [...top, ...bottom.slice(1)], closed: joinLeft, side });
    else if (joinLeft) branches.push({ points: [...bottom, ...top.slice(1)], closed: false, side });
    else branches.push({ points: top, closed: false, side }, { points: bottom, closed: false, side });
  }
  return { kind, world, branches };
}

export function conicSlicesLab(ctx) {
  const { board, controls, stats, signal } = ctx;
  controls.innerHTML = slider('切面倾角（相对水平）', 'conic-angle', 22, 0, 70, 1, '°') +
    `<div class="control-row">${Object.entries(types).map(([angle, label]) => modeButton(label, angle, angle === '22')).join('')}</div>
    <div class="control-row">${transport('播放切面倾斜')}</div>
    <p class="lab-note">在 45° 附近慢慢拨动。模型只展示锥顶附近，开口曲线和较长的椭圆可能伸出画框。</p>`;
  const input = controls.querySelector('input');
  const studio = spatialStudio(ctx, draw, [26, 22], '正对切面');
  const plot = ([u, v]) => pt(502 + u * 30, 204 - v * 30);
  const rings = [-coneEnd, -1.65, -.8, .8, 1.65, coneEnd];
  const onCone = (y, a) => [Math.abs(y) * Math.cos(a), y, Math.abs(y) * Math.sin(a)];

  function draw() {
    const degrees = Number(input.value), section = conicSection(degrees);
    const { project } = studio.camera(pt(184, 203), 45);
    const outline = rings.map(y => path(trace(48, t => project(onCone(y, tau * t))), 'conic-cone-ring', true)).join('');
    const spokes = Array.from({ length: 12 }, (_, i) => {
      const a = i * tau / 12;
      return line(project(onCone(coneEnd, a)), project([0, 0, 0]), 'conic-cone-wire') +
        line(project(onCone(-coneEnd, a)), project([0, 0, 0]), 'conic-cone-wire');
    }).join('');
    const plane = [[-extent, -2.63], [extent, -2.63], [extent, 2.63], [-extent, 2.63]];
    const curves = map => section.branches.map(({ points, side, closed }) =>
      path(points.map(map), `conic-curve space-${side === 'upper' ? 'warm' : 'cold'}-line`, closed)).join('');
    const model = '<defs><clipPath id="conic-model-clip"><rect x="20" y="61" width="332" height="288"/></clipPath></defs>' +
      `<g clip-path="url(#conic-model-clip)">${spokes}${outline}${polygon(plane.map(p => project(section.world(p))), 'space-plane')}` +
      curves(p => project(section.world(p))) + '</g>';
    const detail = line(plot([-extent, 0]), plot([extent, 0]), 'space-axis') +
      line(plot([0, -coneEnd]), plot([0, coneEnd]), 'space-axis') + curves(plot);
    board.draw(stage('倾斜切平面', '正对切面', model, detail, '金色：上锥｜青色：下锥', '同一段截线，沿切面法向看'));
    readout(input, `${degrees}°`);
    selection(controls, String(degrees));
    stats.innerHTML = metric('截线类型', section.kind) +
      metric('与母线的倾角之差', `${degrees - 45}°`) +
      metric('无限双圆锥上相交的半锥', degrees > 45 ? '上锥与下锥' : '只有上锥');
  }

  function sweep(from, to, duration) {
    studio.animate(duration, t => { input.value = Math.round(from + (to - from) * t); draw(); });
  }

  controls.addEventListener('input', () => { studio.stop(); draw(); }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'play-space') {
      if (studio.playing) studio.stop();
      else sweep(0, 70, 4200);
    } else if (Object.hasOwn(types, action)) {
      studio.stop();
      input.value = action;
      draw();
    }
  }, { signal });
  draw();
  return (_, angle) => sweep(angle === 22 ? 0 : angle === 45 ? 32 : 46, angle, 950);
}
