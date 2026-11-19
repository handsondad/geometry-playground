import { pt } from './math.js';
import { button, circle, line, metric, polygon, slider, text } from './board.js';
import { cross3, cubeCut, cubeDirections, dotN, hypercube, mixN, normalized, ribbonLap, ribbonPoint, rotateXW, tesseractSlice } from './spatial-math.js';
import { boxMesh, depth, ease, modeButton, path, rad, readout, selection, spatialStudio, stage, tau, trace, transport, wire } from './spatial-view.js';
import { cutDirectionLabels, mountCubeNotebook } from './cube-notebook.js';

const cube = hypercube(3), tesseract = hypercube(4);
const lerp = (a, b, t) => a + (b - a) * t;
const point = (p, cls = 'space-point') => circle(p, 3.3, cls);
const areaFormat = n => n.toFixed(2);
const polygonNames = ['不相交', '一点', '一条线段', '三角形', '四边形', '五边形', '六边形'];

export function cubeLab(ctx) {
  const { board, controls, stats, signal, guide, records } = ctx;
  let mode = 'diagonal';
  controls.innerHTML = slider('切面位置（0% 为正中心）', 'section-offset', 0, -110, 110, 1, '%') +
    `<div class="control-row">${Object.entries(cutDirectionLabels).map(([key, label]) => modeButton(label, key, key === mode)).join('')}</div>` +
    `<div class="control-row">${transport('从一端扫到另一端')}${button('移到中心', 'middle')}${button('移近角点', 'corner')}</div>`;
  guide.innerHTML = '<p class="lab-note">截面每条边都落在正方体的一个面上。看斜切时的面积曲线：两端是三角形，中间变成六边形；经过棱的中点时，六条边才等长。</p>';
  const offset = controls.querySelector('input');
  const studio = spatialStudio(ctx, draw, [35, 25], '截面与面积曲线');
  const recorded = mountCubeNotebook(records, {
    signal,
    sample: () => { studio.stop(); return cubeCut(mode, Number(offset.value)); },
    revisit: cut => {
      studio.stop();
      setMode(cut.mode);
      offset.value = cut.offset;
      draw();
    },
    onChange: draw,
  });
  const profiles = Object.fromEntries(Object.entries(cubeDirections).map(([key, n]) => {
    const extent = n.reduce((a, b) => a + b);
    // Include the exact tangent and vertex levels so the graph does not round off its corners.
    const stops = [...new Set([...trace(110, f => lerp(-110, 110, f)), ...cube.vertices.map(p => 100 * dotN(p, n) / extent)])]
      .sort((a, b) => a - b);
    return [key, stops.flatMap(t => {
      const sample = [t, cubeCut(key, t).area];
      if (key === 'face' && t === -100) return [[t, 0], sample];
      if (key === 'face' && t === 100) return [sample, [t, 0]];
      return [sample];
    })];
  }));
  const graph = (t, area) => pt(500 + t, 330 - area * 11);

  function draw() {
    const t = Number(offset.value);
    const { level, section, area, outline, normal: n, u, v } = cubeCut(mode, t);
    const n2 = dotN(n, n);
    const onPlane = (a, b) => n.map((x, i) => x * level / n2 + u[i] * a + v[i] * b);
    const camera = studio.camera(pt(184, 203), 63), { project } = camera;
    const mesh = boxMesh(cube.vertices, camera);
    const slice = section.map(project);
    const plane = [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]].map(([a, b]) => project(onPlane(a, b)));
    const show = points => points.length > 2 ? polygon(points, 'space-section') : points.length === 2 ? line(...points, 'space-accent') : '';
    const inset = outline.map(p => pt(502 + p.x * 55, 152 + p.y * 55));
    const cursor = graph(t, area);
    const name = mode === 'diagonal' && t === 0 ? '正六边形' :
      mode === 'face' && section.length === 4 ? '正方形' : polygonNames[section.length];
    const model = '<defs><clipPath id="cutaway"><rect x="20" y="62" width="332" height="285"/></clipPath></defs>' +
      `<g clip-path="url(#cutaway)">${mesh.surfaces.sort((a, b) => a.depth - b.depth).map(p => p.html).join('')}${mesh.edges}` +
      polygon(plane, 'space-plane') + show(slice) + slice.map(p => point(p)).join('') + '</g>';
    const detail = show(inset) + inset.map(p => point(p)).join('') +
      (mode === 'diagonal' && t === 0 ? line(inset[0], inset[3], 'space-measure') + line(inset[1], inset[4], 'space-measure') + line(inset[2], inset[5], 'space-measure') : '') +
      text(pt(502, 248), name, 'space-caption') +
      text(pt(390, 269), '截面面积', 'space-label') +
      text(pt(555, 346), '位置 →', 'space-label') +
      line(graph(-110, 0), graph(110, 0), 'space-axis') + line(graph(0, 0), graph(0, 5.4), 'space-axis') +
      path(profiles[mode].map(([x, y]) => graph(x, y)), 'space-accent') +
      line(graph(t, 0), cursor, 'space-measure') + point(cursor) +
      recorded(mode).map(({ mark, offset, area }) => {
        const q = graph(offset, area), x = q.x + (mark === 'A' ? -9 : 9), y = q.y - 9;
        return `<g class="cut-mark-${mark}">${circle(q, 4.5, 'cut-graph-dot')}${text(pt(x, y), mark, 'cut-graph-label')}</g>`;
      }).join('');
    board.draw(stage('切面穿过立方体', '正对截面', model, detail, '虚线：背向观察者的棱', '边长单位：立方体棱长 = 2'));
    stats.innerHTML = metric('截面的形状', name) + metric('边数', section.length >= 3 ? section.length : '—') + metric('截面面积', areaFormat(area));
    readout(offset, `${t}%`);
  }
  function setMode(next) { mode = next; selection(controls, mode); }
  function sweep(from, to, duration) {
    studio.animate(duration, t => { offset.value = Math.round(lerp(from, to, t)); draw(); });
  }
  controls.addEventListener('input', () => { studio.stop(); draw(); }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'play-space' && !studio.playing) { sweep(-110, 110, 4200); return; }
    studio.stop();
    if (Object.hasOwn(cubeDirections, action)) setMode(action);
    else if (action === 'middle') offset.value = 0;
    else if (action === 'corner') { setMode('diagonal'); offset.value = 75; }
    draw();
  }, { signal });
  draw();
  return (_, next, to) => { setMode(next); sweep(to > 0 ? 105 : 72, to, 1300); };
}

const xwSquare = hypercube(2);
const perspective4 = ([x, y, z, w]) => [x, y, z].map(n => n * 4.5 / (4.5 - w));

export function tesseractLab(ctx) {
  const { board, controls, stats, signal, guide } = ctx;
  let mode = 'shadow';
  controls.innerHTML = `<div class="control-row">${modeButton('观察投影', 'shadow', true)}${modeButton('沿 w 轴切片', 'slice')}</div>` +
    slider('四维旋转角（x–w 平面）', 'four-angle', 28, 0, 90, 1, '°') +
    slider('切片的 w 坐标', 'four-slice', 0, -1.5, 1.5, .01) +
    `<div class="control-row">${transport('播放旋转 / 扫描')}</div>`;
  guide.innerHTML = '<p class="lab-note">四维旋转只混合 x 与 w，y、z 不变。右图把这两维暂时省掉：水平扫描线截得的线段有多长，左侧长方体在 x 方向就有多宽。</p>';
  const [angle, offset] = controls.querySelectorAll('input');
  const studio = spatialStudio(ctx, draw, undefined, 'x–w 平面');
  const plot = ([x, w]) => pt(498 + 70 * x, 203 - 70 * w);

  function draw() {
    const turn = rad(Number(angle.value)), level = Number(offset.value), slice = mode === 'slice';
    const camera = studio.camera(pt(183, 203), slice ? 78 : 58);
    const { project } = camera;
    const slab = tesseractSlice(turn, level);
    const width = slab ? slab[1] - slab[0] : 0;
    offset.parentElement.hidden = !slice;
    let chart = line(plot([-1.55, 0]), plot([1.55, 0]), 'space-axis') + line(plot([0, -1.55]), plot([0, 1.55]), 'space-axis') +
      text(pt(612, 208), 'x', 'space-label') + text(pt(507, 97), 'w', 'space-label');
    const rotate = (x, w) => rotateXW([x, 0, 0, w], turn).filter((_, i) => i === 0 || i === 3);
    chart += wire(xwSquare.vertices.map(([x, w]) => plot(rotate(x, w))), xwSquare.edges,
      (i, j) => (i ^ j) === 2 ? 'space-link' : i < 2 ? 'space-cold-line' : 'space-warm-line');

    let model;
    if (slice) {
      chart += line(plot([-1.52, level]), plot([1.52, level]), 'space-measure');
      if (slab) {
        const [a, b] = slab.map(x => plot([x, level]));
        chart += line(a, b, 'space-accent') + point(a) + point(b);
      }
      if (!slab) model = text(pt(182, 209), '切面在模型之外', 'space-caption');
      else if (width < 1e-8) model = polygon([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([y, z]) => project([slab[0], y, z])), 'space-section');
      else {
        const mesh = boxMesh(cube.vertices.map(([x, y, z]) => [slab[Number(x > 0)], y, z]), camera, 'space-warm');
        model = mesh.surfaces.sort((a, b) => a.depth - b.depth).map(s => s.html).join('') + mesh.edges;
      }
      const type = !slab ? '不相交' : width < 1e-8 ? '正方形（退化）' : Math.abs(width - 2) < 1e-8 ? '正方体' : '长方体';
      stats.innerHTML = metric('截面', type) + metric('沿 x 的宽度', slab ? width.toFixed(2) : '—') + metric('截面体积', slab ? (4 * width).toFixed(2) : '—');
    } else {
      const world = tesseract.vertices.map(p => perspective4(rotateXW(p, turn)));
      const cells = [boxMesh(world.slice(0, 8), camera, 'space-cold'), boxMesh(world.slice(8), camera, 'space-warm')];
      model = cells.flatMap(m => m.surfaces).sort((a, b) => a.depth - b.depth).map(s => s.html).join('') +
        wire(world.map(project), tesseract.edges.filter(([i, j]) => (i ^ j) === 8), 'space-link') + cells.map(m => m.edges).join('');
      stats.innerHTML = metric('顶点', 16) + metric('棱', 32) + metric('立方体胞', 8);
    }
    board.draw(stage(slice ? '三维截面' : '超立方体的投影', 'x–w 平面', model, chart,
      slice ? '截面在 y、z 方向宽度均为 2' : '青、金标出旋转前 w = ±1 的两个胞',
      slice ? '金线：切面内的 x 区间' : '虚线：连接两胞的棱'));
    readout(angle, `${angle.value}°`); readout(offset, level.toFixed(2));
  }
  const setMode = next => { mode = next; selection(controls, mode); };
  function move(input, from, to, duration) {
    studio.animate(duration, t => { input.value = lerp(from, to, t).toFixed(input === angle ? 0 : 2); draw(); });
  }
  controls.addEventListener('input', () => { studio.stop(); draw(); }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'play-space' && !studio.playing) {
      if (mode === 'slice') move(offset, -1.5, 1.5, 4200);
      else move(angle, 0, 90, 3800);
      return;
    }
    studio.stop();
    if (action === 'shadow' || action === 'slice') setMode(action);
    draw();
  }, { signal });
  draw();
  return (_, next, turn, level = 0) => {
    setMode(next);
    if (next === 'slice') { angle.value = turn; move(offset, 1.5, level, 1400); }
    else move(angle, turn ? 0 : 45, turn, 1500);
  };
}

export function mobiusLab(ctx) {
  const { board, controls, stats, signal, guide } = ctx;
  let twisted = true, lap = 0;
  controls.innerHTML = `<div class="control-row">${modeButton('莫比乌斯带', 'twist', true)}${modeButton('普通纸环', 'loop')}</div>` +
    slider('沿中线剪开的进度', 'ribbon-cut', 0, 0, 100, 1, '%') +
    slider('追踪剪后的金线', 'ribbon-lap', 0, 0, 2, .01, ' 圈') +
    `<div class="control-row">${transport('剪完一整圈')}${button('重新接好', 'reset')}</div>`;
  guide.innerHTML = '<p class="lab-note">剪完后，跟随金线追踪同一条纸带。轨迹走过接缝时若换到另一半，就必须再走一圈才能回到原点；颜色只是标记当前路径，不用来判断连通性。</p>';
  const [cut, tracker] = controls.querySelectorAll('input');
  const studio = spatialStudio(ctx, draw, [12, 31], '接缝追踪');
  const steps = 96;

  function draw() {
    const progress = Number(cut.value), full = progress === 100, end = twisted ? 2 : 1;
    const { project } = studio.camera(pt(184, 202), 120);
    const spatial = (u, v) => {
      const [x, y, z] = ribbonPoint(u, v, twisted);
      return [x, z, y];
    };
    const limit = progress * tau / 100;
    const sample = [...trace(steps, f => f * tau), ...(progress > 0 && !full ? [limit] : [])].sort((a, b) => a - b);
    const [headU, headSide] = ribbonLap(lap, twisted);
    const panels = [];
    for (let i = 1; i < sample.length; i++) {
      const a = sample[i - 1], b = sample[i];
      if (b - a < 1e-8) continue;
      for (const side of [-1, 1]) {
        const cutHere = b <= limit;
        const gap = u => side * .055 * (full ? 1 : Math.min(1, u * 7, (limit - u) * 7));
        const world = [spatial(a, cutHere ? gap(a) : 0), spatial(a, side * .30),
          spatial(b, side * .30), spatial(b, cutHere ? gap(b) : 0)];
        const points = world.map(project);
        const normal = normalized(cross3(...[world[1], world[3]].map(p => p.map((x, j) => x - world[0][j]))));
        const light = Math.abs(dotN(normal, [.36, .8, .48]));
        const hue = side > 0 ? 188 : 265;
        const color = `hsl(${hue} 62% ${Math.round(33 + 34 * light)}%)`;
        let art = `<g style="--panel:${color}">${polygon(points, 'space-ribbon')}${line(points[1], points[2], 'space-ribbon-edge')}</g>`;
        if (!cutHere && side > 0) art += line(points[0], points[3], 'space-ribbon-center');
        if (full) {
          const endU = side === 1 ? Math.min(lap, 1) * tau : Math.max(0, lap - 1) * tau;
          if (a < endU) art += line(project(spatial(a, side * .18)), project(spatial(Math.min(b, endU), side * .18)), 'space-ribbon-trail');
        }
        if (full && side === headSide && (headU >= a && (headU < b || b === tau))) {
          art += circle(project(spatial(headU, side * .18)), 5, 'space-point');
        }
        if (!full && progress && side > 0 && a === limit) art += circle(project(spatial(limit, 0)), 4.5, 'space-point');
        panels.push({ depth: depth(points), art });
      }
    }
    const left = 408, right = 594, upper = 142, lower = 225;
    const lanes = '<rect x="408" y="115" width="186" height="136" rx="12" class="space-sheet"/>' +
      line(pt(left, (upper + lower) / 2), pt(right, (upper + lower) / 2), 'space-measure') +
      [upper, lower].map((y, i) => line(pt(left, y), pt(right, y), i ? 'space-violet-line' : 'space-cold-line')).join('') +
      text(pt(502, 288), twisted ? '接缝交换上下两半' : '接缝保留上下两半', 'space-caption') +
      text(pt(left, 316), '左端：起点　右端：接缝', 'space-label');
    const loop = (y, dest, edge) => `<path d="M${right},${y} C${right + 29},${y} ${right + 32},${edge} 504,${edge} S${left - 30},${dest} ${left},${dest}" class="space-join"/>`;
    const joins = loop(upper, twisted ? lower : upper, 70) + loop(lower, twisted ? upper : lower, 257);
    const showLap = full ? line(pt(left, upper), pt(lerp(left, right, Math.min(1, lap)), upper), 'space-accent') +
      (lap >= 1 ? `<g class="space-active-join">${loop(upper, twisted ? lower : upper, 70)}</g>` : '') +
      (lap > 1 ? line(pt(left, lower), pt(lerp(left, right, lap - 1), lower), 'space-accent') : '') +
      (twisted && lap >= 2 ? `<g class="space-active-join">${loop(lower, upper, 257)}</g>` : '') +
      point(pt(lerp(left, right, lap === end ? 0 : headU / tau), lap === end || headSide > 0 ? upper : lower)) : '';
    board.draw(stage('纸带与剪缝', '沿接缝追踪', panels.sort((a, b) => a.depth - b.depth).map(p => p.art).join(''),
      lanes + joins + showLap, '金点：剪切位置 / 追踪位置', full ? `${end} 圈回到起点` : '虚线表示边缘如何接合'));
    tracker.parentElement.hidden = !full;
    tracker.max = end;
    tracker.value = lap.toFixed(2);
    stats.innerHTML = metric('剪完后的连通片', full ? `${twisted ? 1 : 2} 条` : '—') +
      metric('回到起点所需圈数', full ? end : '—');
    readout(cut, `${progress}%`); readout(tracker, `${lap.toFixed(2)} 圈`);
    studio.playLabel(full ? '播放金线追踪' : '剪完一整圈');
  }
  function setMode(value) { twisted = value; selection(controls, twisted ? 'twist' : 'loop'); }
  function cutTo(to, follow = false) {
    lap = 0;
    studio.animate(follow ? 4400 : 1400, t => {
      const split = follow ? .48 : 1;
      cut.value = t >= split ? to : Math.floor(to * ease(t / split));
      lap = follow && t > split ? (twisted ? 2 : 1) * (t - split) / (1 - split) : 0;
      draw();
    });
  }
  controls.addEventListener('input', event => {
    studio.stop();
    lap = event.target === tracker ? Number(tracker.value) : 0;
    draw();
  }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'play-space' && !studio.playing) {
      if (Number(cut.value) === 100) {
        studio.animate(2600, t => { lap = t * (twisted ? 2 : 1); draw(); });
      } else {
        const from = Number(cut.value);
        studio.animate(2400, t => { cut.value = Math.round(lerp(from, 100, ease(t))); lap = 0; draw(); });
      }
      return;
    }
    studio.stop();
    if (action === 'reset' || action === 'twist' || action === 'loop') { cut.value = 0; lap = 0; }
    if (action === 'twist' || action === 'loop') setMode(action === 'twist');
    draw();
  }, { signal });
  draw();
  return (_, nextTwisted, progress) => { setMode(nextTwisted); cutTo(progress, progress === 100); };
}
