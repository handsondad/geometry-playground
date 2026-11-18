import { pt } from './math.js';
import { H, W, button, line, metric, point, polygon, polyline, slider, text } from './board.js';
import { cubeSection, hypercube, rotateXW, tesseractSlice, ribbonPoint, ribbonComponents } from './spatial-math.js';

const rad = n => n * Math.PI / 180;
const tau = 2 * Math.PI;
const cube = hypercube(3), tesseract = hypercube(4);
const trace = (n, fn) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
const readout = (input, value) => { input.parentElement.querySelector('output').value = value; };
const selection = (controls, key) => {
  for (const item of controls.querySelectorAll('[aria-pressed]')) item.setAttribute('aria-pressed', item.dataset.action === key);
};

function projector(origin, scale, heading, pitch) {
  const c = Math.cos(heading), s = Math.sin(heading), d = Math.cos(pitch), e = Math.sin(pitch);
  return ([x, y, z]) => {
    const across = c * x - s * z, away = s * x + c * z;
    return { x: origin.x + across * scale, y: origin.y + (e * away - d * y) * scale, depth: e * y + d * away };
  };
}

const wire = (points, edges, style) => edges.map(([i, j]) =>
  line(points[i], points[j], typeof style === 'function' ? style(i, j) : style)).join('');

export function cubeLab({ board, controls, stats, signal }) {
  const directions = { face: [0, 1, 0], edge: [1, 1, 0], diagonal: [1, 1, 1] };
  let mode = 'diagonal';
  controls.innerHTML = `<div class="control-row">${button('平行于面', 'face', 'aria-pressed="false"')}${button('斜切两组棱', 'edge', 'aria-pressed="false"')}${button('垂直体对角线', 'diagonal', 'aria-pressed="true"')}</div>` +
    slider('切面位置（0% 为正中心）', 'section-offset', 0, -110, 110, 1, '%') +
    slider('旋转观察方向', 'cube-yaw', 35, -180, 180, 1, '°') +
    `<div class="control-row">${button('移到中心', 'middle')}${button('移近角点', 'corner')}</div>`;
  const [offset, yaw] = controls.querySelectorAll('input');
  function draw() {
    const t = Number(offset.value), normal = directions[mode], level = t * normal.reduce((a, b) => a + b) / 100;
    const section = cubeSection(normal, level);
    const project = projector(pt(201, 202), 91, rad(Number(yaw.value)), rad(24));
    const slice = section.map(project);
    const rendered = slice.length >= 3 ? polygon(slice) : slice.length === 2 ? line(...slice, 'result') : slice.length === 1 ? point(slice[0]) : '';
    const insetOrigin = pt(496, 202);
    const chart = text(pt(201, 38), '立体视图', 'view-label') + text(pt(496, 38), '正对截面', 'view-label') +
      line(pt(363, 51), pt(363, 351), 'aux');
    let inset = text(pt(496, 207), '没有交点', 'view-label');
    if (section.length === 1) inset = point(insetOrigin);
    if (section.length === 2) inset = line(pt(426, 202), pt(566, 202), 'result');
    if (section.length >= 3) {
      const center = normal.map((_, i) => section.reduce((sum, p) => sum + p[i], 0) / section.length);
      const delta = section.map(p => p.map((x, i) => x - center[i]));
      const distance = Math.hypot(...delta[0]);
      const u = delta[0].map(x => x / distance), [a, b, c] = normal, [x, y, z] = u;
      const length = Math.hypot(...normal), v = [(b * z - c * y) / length, (c * x - a * z) / length, (a * y - b * x) / length];
      const flatten = delta.map(p => pt(insetOrigin.x + 63 * p.reduce((sum, d, i) => sum + d * u[i], 0),
        insetOrigin.y + 63 * p.reduce((sum, d, i) => sum + d * v[i], 0)));
      inset = polygon(flatten) + flatten.map(p => point(p)).join('');
    }
    board.draw(chart + wire(cube.vertices.map(project), cube.edges, 'space-edge') + rendered + slice.map(p => point(p)).join('') + inset);
    const names = ['不相交', '一点', '一条线段', '三角形', '四边形', '五边形', '六边形'];
    const name = mode === 'diagonal' && t === 0 ? '正六边形' : mode === 'face' && section.length === 4 ? '正方形' : names[section.length];
    stats.innerHTML = metric('截面的形状', name) + metric('多边形边数', section.length >= 3 ? section.length : '—');
    readout(offset, `${t}%`); readout(yaw, `${yaw.value}°`);
  }
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (Object.hasOwn(directions, action)) { mode = action; selection(controls, mode); }
    else if (action === 'middle') offset.value = 0;
    else if (action === 'corner') { mode = 'diagonal'; selection(controls, mode); offset.value = 75; }
    draw();
  }, { signal });
  draw();
  return (_, nextMode, nextOffset) => {
    mode = nextMode;
    selection(controls, mode);
    offset.value = nextOffset;
    draw();
    board.animate('.shape, .result');
  };
}

export function tesseractLab({ board, controls, stats, signal }) {
  let mode = 'shadow';
  controls.innerHTML = `<div class="control-row">${button('观察投影', 'shadow', 'aria-pressed="true"')}${button('沿 w 轴切片', 'slice', 'aria-pressed="false"')}</div>` +
    slider('四维旋转角（x–w 平面）', 'four-angle', 28, 0, 90, 1, '°') +
    slider('切片的 w 坐标', 'four-slice', 0, -1.5, 1.5, .01) +
    '<p class="lab-note">在投影中，两种实线颜色标记原来的两组立方体，虚线是把两组连起来的棱。</p>';
  const [angle, offset] = controls.querySelectorAll('input');
  function draw() {
    const turn = rad(Number(angle.value)), level = Number(offset.value), slice = mode === 'slice';
    const project = projector(pt(W / 2, H / 2), slice ? 86 : 72, rad(34), rad(26));
    offset.parentElement.hidden = !slice;
    if (slice) {
      const extent = tesseractSlice(turn, level);
      const width = extent ? extent[1] - extent[0] : 0;
      if (!extent) board.draw(text(pt(W / 2, H / 2), '这个位置没有切到超立方体', 'view-label'));
      else if (width < 1e-8) {
        board.draw(polygon([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([y, z]) => project([extent[0], y, z])), 'shape'));
      } else {
        const points = cube.vertices.map(([x, y, z]) => project([extent[x > 0 ? 1 : 0], y, z]));
        board.draw(wire(points, cube.edges, 'result') + points.map(p => point(p)).join(''));
      }
      stats.innerHTML = metric('截面', !extent ? '不相交' : width < 1e-8 ? '正方形（退化）' : Math.abs(width - 2) < 1e-8 ? '正方体' : '长方体') +
        metric('截面在 x 方向的宽度', extent ? width.toFixed(2) : '—');
    } else {
      const points = tesseract.vertices.map(p => {
        const [x, y, z, w] = rotateXW(p, turn);
        const perspective = 4.5 / (4.5 - w);
        return project([x * perspective, y * perspective, z * perspective]);
      });
      board.draw(wire(points, tesseract.edges, (i, j) => (i ^ j) === 8 ? 'aux' : i < 8 ? 'space-edge' : 'edge-highlight') + points.map(p => point(p)).join(''));
      stats.innerHTML = metric('四维顶点数', tesseract.vertices.length) + metric('四维棱数', tesseract.edges.length);
    }
    readout(angle, `${angle.value}°`); readout(offset, level.toFixed(2));
  }
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action) { mode = action; selection(controls, mode); draw(); }
  }, { signal });
  draw();
  return (_, nextMode, nextAngle, nextOffset = 0) => {
    mode = nextMode;
    selection(controls, mode);
    angle.value = nextAngle;
    offset.value = nextOffset;
    draw();
    board.animate(mode === 'slice' ? '.result, .shape' : '.edge-highlight, .aux');
  };
}

export function mobiusLab({ board, controls, stats, signal }) {
  let twisted = true;
  controls.innerHTML = `<div class="control-row">${button('莫比乌斯带', 'twist', 'aria-pressed="true"')}${button('普通纸环', 'loop', 'aria-pressed="false"')}</div>` +
    slider('沿中线剪开的进度', 'ribbon-cut', 0, 0, 100, 1, '%') +
    `<div class="control-row">${button('剪完一整圈', 'cut', 'class="primary"')}${button('重新接好', 'reset')}</div>`;
  const cut = controls.querySelector('input');
  function draw() {
    const progress = Number(cut.value), full = progress === 100, components = ribbonComponents(twisted);
    const project = projector(pt(208, 192), 122, rad(12), rad(26));
    const spatial = (u, v) => {
      const [x, y, z] = ribbonPoint(u, v, twisted);
      return project([x, z, y]);
    };
    const isCut = u => u <= progress * tau / 100 && progress > 0;
    const panels = [];
    for (let i = 0; i < 100; i++) {
      const a = i * tau / 100, b = (i + 1) * tau / 100;
      for (const side of [-1, 1]) {
        const inner = isCut(b) ? .04 * side : 0;
        const points = [spatial(a, inner), spatial(a, side * .28), spatial(b, side * .28), spatial(b, inner)];
        const cls = full && components.length === 1 ? 'ribbon-one' : side < 0 ? 'ribbon-one' : 'ribbon-two';
        panels.push({ points, cls, depth: points.reduce((sum, p) => sum + p.depth, 0) });
      }
    }
    panels.sort((a, b) => a.depth - b.depth);
    const diagram = panels.map(p => polygon(p.points, `ribbon-panel ${p.cls}`)).join('') +
      (!full ? polyline(trace(100 - progress, f => spatial(tau * (progress / 100 + (1 - progress / 100) * f), 0)), 'aux') : '') +
      (progress > 0 && !full ? point(spatial(tau * progress / 100, 0), '剪到这里', { kind: 'highlight' }) : '');
    const x = 485, y = 206, colors = full && twisted ? ['ribbon-one', 'ribbon-one'] : ['ribbon-one', 'ribbon-two'];
    const seam = text(pt(x, 109), '接缝对应图', 'view-label') +
      colors.map((cls, i) => {
        const a = pt(x - 70, y - 29 + i * 58), b = pt(x + 70, y + (twisted ? 29 - i * 58 : -29 + i * 58));
        return line(a, b, `ribbon-join ${cls}`) + point(a, i ? '下' : '上') + point(b);
      }).join('');
    board.draw(text(pt(208, 41), '纸带模型', 'view-label') + diagram + seam);
    stats.innerHTML = metric('当前材料', twisted ? '接缝上下交换' : '接缝上下不交换') +
      metric('剪完后分成几条', full ? `${components.length} 条` : '先猜猜看');
    readout(cut, `${progress}%`);
  }
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'cut' || action === 'reset') cut.value = action === 'cut' ? 100 : 0;
    else if (action === 'twist' || action === 'loop') {
      twisted = action === 'twist'; cut.value = 0; selection(controls, action);
    } else return;
    draw();
  }, { signal });
  draw();
  return (_, nextTwisted, nextProgress) => {
    twisted = Boolean(nextTwisted);
    selection(controls, twisted ? 'twist' : 'loop');
    cut.value = nextProgress;
    draw();
    board.animate('.ribbon-panel, .aux');
  };
}
