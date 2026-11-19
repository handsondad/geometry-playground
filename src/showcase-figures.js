import { euclidCoverHtml, mountEuclidCover } from './euclid-cover.js';
import {
  cross, diskTranslate, geodesicAngle, geodesicThrough, goldenAngle, goldenRatio, hyperbolicTiling, koch, penroseTriangles,
  perimeter, polygonArea, pt, spiralFamilies, sub, timesTableEnvelope, vogelSpiral, voronoiCells,
} from './math.js';
import { hypercube, platonicSolids, ribbonPoint, rotateXW } from './spatial-math.js';

const tau = 2 * Math.PI;
const coords = p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
const svgPath = (points, close = false) => `M${points.map(coords).join('L')}${close ? 'Z' : ''}`;
const tint = percent => `color-mix(in srgb, var(--bubble) ${Math.round(percent)}%, white)`;
const smooth = t => t * t * (3 - 2 * t);
const clamp01 = t => Math.min(1, Math.max(0, t));

const cube = hypercube(4);
const samples = Array.from({ length: 64 }, (_, i) => i * tau / 64);
const band = [...samples, tau].map(u => [ribbonPoint(u, -.33, true), ribbonPoint(u, .33, true)]);
const boundary = [...band.slice(0, -1).map(pair => pair[0]), ...band.slice(0, -1).map(pair => pair[1])];

const snowSide = 200, snowBase = 196;
const snow = [pt(225, snowBase - snowSide * Math.sqrt(3) / 2), pt(225 + snowSide / 2, snowBase), pt(225 - snowSide / 2, snowBase)];
const snowLayers = Array.from({ length: 5 }, (_, n) => {
  const points = koch(snow, n);
  return { path: svgPath(points, true), sides: points.length, perimeter: perimeter(points) / perimeter(snow), area: polygonArea(points) / polygonArea(snow) };
});

function projector(turn, scale, pitch) {
  const c = Math.cos(turn), s = Math.sin(turn), a = Math.cos(pitch), b = Math.sin(pitch);
  return ([x, y, z]) => {
    const horizontal = c * x - s * z, rotatedZ = s * x + c * z;
    return { x: 225 + scale * horizontal, y: 145 - scale * (a * y - b * rotatedZ), depth: b * y + a * rotatedZ };
  };
}

function mobiusFrame(time) {
  const project = projector(.7 + time * .24, 98, .51);
  const map = ([x, y, z]) => project([x, z, y]);
  const panels = band.slice(0, -1).map(([a, b], i) => {
    const points = [a, b, band[i + 1][1], band[i + 1][0]].map(map);
    const depth = points.reduce((sum, p) => sum + p.depth, 0) / 4;
    return { points, depth, fill: tint(42 + 22 * (1 + Math.cos(samples[i])) / 2 + depth * 16) };
  }).sort((a, b) => a.depth - b.depth);
  const travelled = Math.max(0, time) * .62 % (2 * tau);
  const dot = map(ribbonPoint(travelled, -.33, true));
  return {
    svg: panels.map(({ points, fill }) => `<path d="${svgPath(points, true)}" style="fill:${fill};stroke:${fill}" stroke-width="1"/>`).join('') +
      `<path d="${svgPath(boundary.map(map), true)}" class="show-boundary"/><circle cx="${dot.x}" cy="${dot.y}" r="6" class="show-spark"/>`,
    readout: [`金点沿边走了 ${(travelled / tau).toFixed(1)} / 2 圈`, '1 个面 · 1 条边'],
  };
}

function tesseractFrame(time) {
  const project = projector(.6 + time * .18, 54, .38);
  const angle = .17 + Math.max(0, time) * .36;
  const pos = cube.vertices.map(v => {
    const [x, y, z, w] = rotateXW(v, angle);
    return project([x, y, z].map(value => value * 3.8 / (3.8 - w)));
  });
  const edges = cube.edges.map(([a, b]) => ({ a, b, d: pos[a].depth + pos[b].depth })).sort((a, b) => a.d - b.d);
  return {
    svg: edges.map(({ a, b }) => `<path d="${svgPath([pos[a], pos[b]])}" class="show-cube-line ${a < 8 && b >= 8 ? 'is-bridge' : b < 8 ? 'is-near' : ''}"/>`).join('') +
      pos.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.4" class="show-vertex"/>`).join(''),
    readout: [`第四个方向转了 ${Math.round(angle * 180 / Math.PI) % 360}°`, `${cube.vertices.length} 个顶点 · ${cube.edges.length} 条棱`],
  };
}

function kochFrame(time) {
  const n = time < 0 ? 4 : Math.min(4, Math.floor(time % 7 * 1.15));
  const layer = snowLayers[n];
  return {
    svg: `<path d="${snowLayers[0].path}" class="show-snow-guide"/><path d="${layer.path}" class="show-snow"/>`,
    readout: [`第 ${n} 轮 · ${layer.sides} 条边`, `周长 ×${layer.perimeter.toFixed(2)} · 面积 ×${layer.area.toFixed(2)}`],
  };
}

const penroseLayers = Array.from({ length: 6 }, (_, depth) => {
  // The decagon's inradius (300 cos 18°) stays outside the frame's corners while it turns.
  const tiles = penroseTriangles(depth), place = p => pt(225 + 300 * p.x, 145 + 300 * p.y);
  const fill = kind => tiles.filter(t => t.kind === kind).map(({ a, b, c }) => svgPath([a, b, c].map(place), true)).join('');
  const thin = tiles.filter(t => t.kind === 0).length;
  return {
    svg: `<path d="${fill(1)}" class="show-penrose is-fat"/><path d="${fill(0)}" class="show-penrose is-thin"/>` +
      `<path d="${tiles.map(({ a, b, c }) => svgPath([b, a, c].map(place))).join('')}" class="show-penrose-edge" style="stroke-width:${1.7 - depth * .16}"/>`,
    thin, fat: tiles.length - thin,
  };
});

function penroseFrame(time) {
  const depth = time < 0 ? 5 : Math.min(5, Math.floor(time % 9 / 1.2));
  const { svg, thin, fat } = penroseLayers[depth];
  return {
    svg, transform: `rotate(${(Math.max(0, time) * 2.4).toFixed(2)} 225 145)`,
    readout: [`第 ${depth} 次细分 · 胖 ${fat} : 瘦 ${thin}`, fat ? `胖 ÷ 瘦 = ${(fat / thin).toFixed(3)} → φ = ${goldenRatio.toFixed(3)}` : '一开始全是瘦三角'],
  };
}

const ring = Array.from({ length: 120 }, (_, k) => k * tau / 120);
const curveNames = { 2: '心形线', 3: '肾形线', 4: '三尖外摆线', 5: '四尖外摆线' };

function cardioidFrame(time) {
  const step = time < 0 ? 0 : time % 8 / 2, from = 2 + Math.floor(step), to = from === 5 ? 2 : from + 1;
  const m = from + (to - from) * smooth(clamp01((step % 1 - .55) / .45));
  // Turn the unit circle so the first cusp points up.
  const place = p => pt(225 + 118 * p.y, 141 - 118 * p.x);
  const onRing = theta => place(pt(Math.cos(theta), Math.sin(theta)));
  const chords = [0, 1, 2, 3].map(group => ring.slice(group * 30, group * 30 + 30)
    .map(theta => `M${coords(onRing(theta))}L${coords(onRing(m * theta))}`).join(''));
  const whole = Math.abs(m - Math.round(m)) < .01 ? Math.round(m) : 0;
  const envelope = whole
    ? `<path d="${svgPath(Array.from({ length: 240 }, (_, i) => place(timesTableEnvelope(i * tau / 240, whole))), true)}" class="show-envelope"/>` : '';
  return {
    svg: '<circle cx="225" cy="141" r="118" class="show-ring"/>' +
      chords.map((d, group) => `<path d="${d}" class="show-chord" style="stroke:color-mix(in srgb, var(--bubble) ${88 - group * 16}%, #21406a)"/>`).join('') + envelope +
      ring.map(theta => { const p = onRing(theta); return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.3" class="show-ring-dot"/>`; }).join(''),
    readout: [`第 k 个点连到第 ${m.toFixed(2)} × k 个点`, whole ? `${whole - 1} 个尖角 · ${curveNames[whole]}` : '在两种曲线之间变形……'],
  };
}

const disk = hyperbolicTiling(7, 3, .016);
const toDisk = p => pt(225 + 128 * p.x, 145 + 128 * p.y);

function hyperbolicFrame(time) {
  const t = Math.max(0, time), shift = pt(.26 * Math.sin(t * .45), .17 * Math.sin(t * .7));
  const spin = t * .06, c = Math.cos(spin), s = Math.sin(spin);
  const move = z => diskTranslate(pt(c * z.x - s * z.y, s * z.x + c * z.y), shift);
  const tiles = disk.map(({ vertices, depth }) => ({ depth, vertices: vertices.map(move) }));
  const edge = (u, v) => {
    const circle = geodesicThrough(u, v), end = toDisk(v);
    if (!circle) return `L${coords(end)}`;
    const sweep = cross(sub(u, circle.center), sub(v, circle.center)) > 0 ? 1 : 0;
    return `A${(128 * circle.radius).toFixed(1)} ${(128 * circle.radius).toFixed(1)} 0 0 ${sweep} ${coords(end)}`;
  };
  const outline = vertices => `M${coords(toDisk(vertices[0]))}${vertices.map((v, i) => edge(v, vertices[(i + 1) % vertices.length])).join('')}Z`;
  const byTone = [0, 1, 2].map(tone => tiles.filter(tile => tile.depth % 3 === tone).map(tile => outline(tile.vertices)).join(''));
  const middle = tiles[0].vertices;
  return {
    svg: `<circle cx="225" cy="145" r="128" class="show-disk"/>` +
      byTone.map((d, tone) => `<path d="${d}" class="show-heptagon is-tone-${tone}"/>`).join('') +
      `<circle cx="225" cy="145" r="128" class="show-disk-rim"/>`,
    readout: [`${disk.length} 块七边形，其实一样大`, `每个角 ${(geodesicAngle(middle[0], middle[1], middle[6]) * 180 / Math.PI).toFixed(1)}°（平面上 128.6°）`],
  };
}

const solidInfo = {
  tetrahedron: ['正四面体', '正三角形'], cube: ['正方体', '正方形'], octahedron: ['正八面体', '正三角形'],
  dodecahedron: ['正十二面体', '正五边形'], icosahedron: ['正二十面体', '正三角形'],
};

function platonicFrame(time) {
  const t = Math.max(0, time), index = time < 0 ? 3 : Math.floor(t / 1.6) % 5, solid = platonicSolids[index];
  const yaw = .5 + t * .55, pitch = .42 + .18 * Math.sin(t * .4), grow = time < 0 ? 1 : .82 + .18 * smooth(clamp01(t % 1.6 / .35));
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const turned = solid.vertices.map(([x, y, z]) => {
    const x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
    return [x1, cp * y - sp * z1, sp * y + cp * z1];
  });
  const screen = turned.map(([x, y]) => pt(225 + 112 * grow * x, 145 - 112 * grow * y));
  const faces = solid.faces.map(face => {
    const [a, b, c] = face.map(n => turned[n]);
    const u = b.map((x, i) => x - a[i]), v = c.map((x, i) => x - b[i]);
    const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const size = Math.hypot(...normal), light = (-.35 * normal[0] + .55 * normal[1] + .76 * normal[2]) / size;
    return { face, front: normal[2] > 0, light, depth: face.reduce((sum, n) => sum + turned[n][2], 0) / face.length };
  }).sort((a, b) => a.depth - b.depth);
  const draw = ({ face }) => svgPath(face.map(n => screen[n]), true);
  const front = faces.filter(f => f.front), seen = new Set(front.flatMap(f => f.face));
  const [name, faceName] = solidInfo[solid.id], { length: V } = solid.vertices, { length: E } = solid.edges, { length: F } = solid.faces;
  return {
    svg: `<path d="${faces.filter(f => !f.front).map(draw).join('')}" class="show-solid-back"/>` +
      front.map(f => `<path d="${draw(f)}" class="show-solid-face" style="fill:${tint(22 + 46 * Math.max(0, f.light))}"/>`).join('') +
      [...seen].map(n => `<circle cx="${screen[n].x.toFixed(1)}" cy="${screen[n].y.toFixed(1)}" r="2.6" class="show-vertex"/>`).join(''),
    readout: [`${name} · ${F} 个${faceName}`, `V − E + F = ${V} − ${E} + ${F} = ${V - E + F}`],
  };
}

const seeds = vogelSpiral(420).map(p => pt(225 + 6.3 * p.x, 145 + 6.3 * p.y));
const families = new Map();
const familiesOf = count => {
  const key = Math.max(60, Math.round(count / 30) * 30);
  if (!families.has(key)) families.set(key, spiralFamilies(vogelSpiral(key)));
  return families.get(key);
};

function phyllotaxisFrame(time) {
  const count = time < 0 ? 420 : Math.min(420, 12 + Math.floor(time * 66));
  const [few, many] = familiesOf(count);
  const arm = n => Math.floor((n % few) * goldenAngle / tau % 1 * few) % 2;
  return {
    svg: seeds.slice(0, count).map((p, n) =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(1.5 + 1.9 * Math.sqrt(n / 420)).toFixed(2)}" class="show-seed${arm(n) ? ' is-arm' : ''}"/>`).join(''),
    readout: [`第 ${count} 颗种子 · 每颗多转 ${(goldenAngle * 180 / Math.PI).toFixed(1)}°`, count < 60 ? '种子越来越多……' : `外圈数得出 ${few} 条和 ${many} 条螺旋`],
  };
}

const stations = [[70, 60], [160, 40], [270, 55], [380, 70], [110, 140], [215, 125], [320, 150], [400, 185],
  [60, 230], [165, 215], [255, 235], [345, 245], [205, 185]].map(([x, y]) => pt(x, y));
const field = [pt(12, 10), pt(438, 10), pt(438, 274), pt(12, 274)];

function voronoiFrame(time) {
  const t = Math.max(0, time);
  const sites = stations.map((p, i) => pt(p.x + 20 * Math.sin(t * .5 + i * 1.7), p.y + 14 * Math.cos(t * .37 + i * 2.3)));
  const cells = voronoiCells(sites, field);
  const probe = pt(225 + 150 * Math.sin(t * .41), 142 + 92 * Math.sin(t * .67 + 1));
  const nearest = sites.reduce((best, p, i) => Math.hypot(p.x - probe.x, p.y - probe.y) < Math.hypot(sites[best].x - probe.x, sites[best].y - probe.y) ? i : best, 0);
  return {
    svg: '<clipPath id="show-field"><rect x="12" y="10" width="426" height="264" rx="16"/></clipPath><g clip-path="url(#show-field)">' +
      cells.map((cell, i) => `<path d="${svgPath(cell, true)}" class="show-cell${i === nearest ? ' is-near' : ''}" style="fill:${tint(i === nearest ? 46 : 12 + i % 3 * 8)}"/>`).join('') +
      `</g><path d="${svgPath([probe, sites[nearest]])}" class="show-probe-line"/>` +
      sites.map((p, i) => `<g class="show-site"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"/><text x="${(p.x + 6).toFixed(1)}" y="${(p.y - 6).toFixed(1)}">${i + 1}</text></g>`).join('') +
      `<circle cx="${probe.x.toFixed(1)}" cy="${probe.y.toFixed(1)}" r="5.5" class="show-probe"/>`,
    readout: [`${sites.length} 个站点 · ${cells.filter(cell => cell.length >= 3).length} 个格子`, `红点离 ${nearest + 1} 号站最近`],
  };
}

const frames = {
  mobius: mobiusFrame, tesseract: tesseractFrame, koch: kochFrame, penrose: penroseFrame, cardioid: cardioidFrame,
  hyperbolic: hyperbolicFrame, platonic: platonicFrame, phyllotaxis: phyllotaxisFrame, voronoi: voronoiFrame,
};
const guided = new Set(['mobius', 'tesseract', 'platonic']);

/** Draws one famous figure into `box`; animated figures pause off-screen, in hidden tabs, and under reduced motion. */
export function mountShowcaseFigure(box, id, { signal, label }) {
  if (id === 'equilateral') {
    box.innerHTML = euclidCoverHtml();
    mountEuclidCover(box.firstElementChild, signal);
    return;
  }
  const frame = frames[id];
  box.innerHTML = `<figure class="show-figure">
    <svg viewBox="0 0 450 290" role="img" aria-label="${label}">
      ${guided.has(id) ? '<ellipse cx="225" cy="147" rx="157" ry="113" class="show-guide"/><path d="M37 145H413 M225 20V270" class="show-guide"/>' : ''}
      <g class="show-model"></g>
    </svg>
    <figcaption class="show-readout"><span></span><span></span></figcaption>
  </figure>`;
  const model = box.querySelector('.show-model'), [first, second] = box.querySelectorAll('.show-readout span');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, raf = 0, start, last = -Infinity, shown = '';

  function draw(time) {
    const { svg, readout, transform = '' } = frame(time);
    if (svg !== shown) { model.innerHTML = svg; shown = svg; }
    model.setAttribute('transform', transform);
    first.textContent = readout[0];
    second.textContent = readout[1];
  }
  function tick(now) {
    raf = 0;
    if (!visible || document.hidden || reduce.matches) return;
    start ??= now;
    if (now - last >= 50) { draw((now - start) / 1000); last = now; }
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    if (reduce.matches) { cancelAnimationFrame(raf); raf = 0; draw(-1); return; }
    if (visible && !document.hidden && !raf) raf = requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(box);
  document.addEventListener('visibilitychange', sync, { signal });
  reduce.addEventListener('change', sync, { signal });
  signal.addEventListener('abort', () => { observer.disconnect(); cancelAnimationFrame(raf); }, { once: true });
  draw(reduce.matches ? -1 : 0);
}
