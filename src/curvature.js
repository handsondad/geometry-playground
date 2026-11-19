import { button, circle, slider, text, xy } from './board.js';
import { clamp, cross, dist, geodesic, mix, mul, pt, sub } from './math.js';
import { comparisonInverse, comparisonTriangles } from './curvature-math.js';
import { mixN, normalized } from './spatial-math.js';

export const comparisonTitle = '三个世界，同一个三角形';
const worlds = [
  { kind: 'plane', title: '平面', radius: 66 },
  { kind: 'sphere', title: '球面', radius: 83 },
  { kind: 'disk', title: '双曲面', radius: 89 },
];
const center = pt(120, 97), baseScale = 85, tinyScale = 15, homeTip = pt(.17, -1.08);

function panel({ kind, title }) {
  const field = kind === 'plane'
    ? '<rect x="26" y="12" width="188" height="170" rx="14" class="compare-field"/><path class="compare-grid" d="M37 97H203 M120 19V175 M64 33V161 M176 33V161 M40 54H200 M40 140H200"/>'
    : circle(center, kind === 'sphere' ? 83 : 89, 'compare-field') +
      (kind === 'sphere'
        ? '<path class="compare-grid" d="M37 97H203 M120 14V180 M120 14C176 32 176 163 120 180 M120 14C64 32 64 163 120 180 M50 52Q120 87 190 52 M50 142Q120 107 190 142"/>'
        : '<path class="compare-grid" d="M31 97H209 M120 8V186"/>' + circle(center, 58, 'compare-grid') + circle(center, 30, 'compare-grid'));
  return `<div class="compare-world" data-kind="${kind}">
    <h3>${title}</h3>
    <svg viewBox="0 0 240 194" aria-label="${title}上的三角形">
      ${field}<path class="compare-shape"/><g class="compare-base">${circle(pt(0, 0), 4, 'compare-anchor')}${circle(pt(0, 0), 4, 'compare-anchor')}</g>
      <g class="compare-tip" tabindex="0" role="group" aria-label="${title}的可移动顶点 C，按方向键移动，也会更新另外两个世界">
        ${circle(pt(0, 0), 38, 'compare-hit')}${circle(pt(0, 0), 9, 'compare-dot')}${text(pt(13, -9), 'C', 'compare-letter')}
      </g>
    </svg>
    <div class="compare-result"><strong data-total></strong><span data-delta></span></div>
  </div>`;
}

export function comparisonHtml() {
  return `<section id="curvature-compare" class="compare" aria-labelledby="compare-title">
    <header class="compare-header">
      <p class="compare-kicker">动手玩几何</p>
      <h2 id="compare-title">${comparisonTitle}</h2>
      <p>拖动任意一幅图的 <b>C 点</b>，看三个三角形的内角和会不会一起变。</p>
    </header>
    <div class="compare-worlds">${worlds.map(panel).join('')}</div>
    <div class="compare-controls">
      ${slider('一起缩放', 'compare-size', baseScale, tinyScale, 100, 1, '%')}
      <div class="compare-actions">
        ${button('缩小看看', 'compare-tiny', 'class="primary-btn"')}
        ${button('放到最大', 'compare-large', 'class="pill-btn"')}
        ${button('复位', 'compare-reset', 'class="pill-btn"')}
      </div>
    </div>
    <details class="compare-why">
      <summary>为什么缩小后，三个答案越来越接近？</summary>
      <p>三边都沿各自空间里的最短路线走。球面是正曲率，内角和超过 180°；双曲面是负曲率，局部像马鞍，内角和不足 180°。范围越小，弯曲的影响越不明显，就像地球很大，但脚下的一小块地面看起来是平的。</p>
      <p>比较时，每个顶点相对于图心的方向和实际距离都相同，不要求三幅图里的边一样长。球面图把半个球投到屏幕上；双曲圆盘的边界离图心无限远。</p>
      <nav aria-label="深入探索"><a href="#play/triangle-sum">平面：证明 180° →</a><a href="#play/sphere">球面：沿大圆走 →</a><a href="#play/hyperbolic-triangle">双曲面：自由拖动 →</a></nav>
    </details>
    <p class="compare-announcement" role="status"></p>
  </section>`;
}

function outline(kind, vertices, map, scale) {
  const edge = (a, b) => {
    if (kind === 'sphere') return Array.from({ length: 20 }, (_, i) => {
      const [x, y] = normalized(mixN(a, b, (i + 1) / 20));
      return `L${xy(map(pt(x, y)))}`;
    }).join('');
    if (kind === 'disk') {
      const g = geodesic(a, mul(sub(b, a), 1 / dist(a, b)));
      if (g.center) {
        const edgeA = sub(a, g.center), edgeB = sub(b, g.center);
        const sweep = Number(cross(edgeA, edgeB) > 0), radius = g.radius * scale;
        return `A${radius} ${radius} 0 0 ${sweep} ${xy(map(b))}`;
      }
    }
    return `L${xy(map(b))}`;
  };
  const first = kind === 'sphere' ? pt(...vertices[0]) : vertices[0];
  return `M${xy(map(first))}${vertices.map((p, i) => edge(p, vertices[(i + 1) % 3])).join('')}Z`;
}

export function mountComparison(root, signal) {
  const local = s => root.querySelector(s);
  const slider = local('input'), output = local('output'), announcement = local('[role="status"]');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let tip = homeTip, size = baseScale, request = 0, pointer;
  const panels = worlds.map(world => {
    const root = local(`[data-kind="${world.kind}"]`);
    return { ...world, svg: root.querySelector('svg'), handle: root.querySelector('.compare-tip'),
      shape: root.querySelector('.compare-shape'), base: root.querySelectorAll('.compare-base circle'),
      total: root.querySelector('[data-total]'), delta: root.querySelector('[data-delta]') };
  });
  const clampTip = p => pt(clamp(p.x, -.86, .86), clamp(p.y, -1.24, -.17));
  function draw() {
    const { world, sphere, disk, totals } = comparisonTriangles(tip, size / 100);
    for (const { kind, radius, total, delta, shape, base, handle } of panels) {
      const map = ({ x, y }) => pt(center.x + x * radius, center.y + y * radius);
      const verts = kind === 'sphere' ? sphere : kind === 'disk' ? disk : world;
      const points = verts.map(p => map(kind === 'sphere' ? pt(...p) : p));
      shape.setAttribute('d', outline(kind, verts, map, radius));
      handle.setAttribute('transform', `translate(${points[0].x} ${points[0].y})`);
      for (const [i, node] of base.entries()) {
        node.setAttribute('cx', points[i + 1].x);
        node.setAttribute('cy', points[i + 1].y);
      }
      total.textContent = `${totals[kind].toFixed(1)}°`;
      const diff = totals[kind] - 180;
      delta.textContent = kind === 'plane' ? '无角差' : `${diff > 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)}°`;
    }
    slider.value = Math.round(size);
    output.value = `${slider.value}%`;
  }
  function announce() {
    announcement.textContent = panels.map(p => `${p.title} ${p.total.textContent}`).join('，');
  }
  const stop = () => { cancelAnimationFrame(request); request = 0; };
  function moveTo(target, point = tip) {
    stop();
    if (preference.matches) { size = target; tip = point; draw(); announce(); return; }
    const startSize = size, startTip = tip;
    let start;
    function tick(now) {
      start ??= now;
      const t = Math.min(1, (now - start) / 340), eased = t * t * (3 - 2 * t);
      size = startSize + (target - startSize) * eased;
      tip = mix(startTip, point, eased);
      draw();
      if (t < 1) request = requestAnimationFrame(tick);
      else { request = 0; announce(); }
    }
    request = requestAnimationFrame(tick);
  }
  signal.addEventListener('abort', stop, { once: true });
  preference.addEventListener('change', stop, { signal });
  local('.compare-actions').addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'compare-tiny') moveTo(tinyScale);
    if (action === 'compare-large') moveTo(100);
    if (action === 'compare-reset') moveTo(baseScale, homeTip);
  }, { signal });
  slider.addEventListener('input', () => { stop(); size = Number(slider.value); draw(); }, { signal });
  slider.addEventListener('change', announce, { signal });
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  for (const { kind, radius, svg, handle } of panels) {
    const coords = event => new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointer) return;
      stop();
      const { x, y } = coords(event);
      const position = handle.transform.baseVal.getItem(0).matrix;
      pointer = { id: event.pointerId, kind, dx: x - position.e, dy: y - position.f };
      handle.setPointerCapture(event.pointerId);
    }, { signal });
    handle.addEventListener('pointermove', event => {
      if (pointer?.id !== event.pointerId || pointer.kind !== kind) return;
      const { x, y } = coords(event);
      const p = pt((x - pointer.dx - center.x) / radius, (y - pointer.dy - center.y) / radius);
      tip = clampTip(comparisonInverse(p, kind, size / 100));
      draw();
    }, { signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      handle.addEventListener(type, event => {
        if (pointer?.id === event.pointerId && pointer.kind === kind) { pointer = undefined; announce(); }
      }, { signal });
    }
    handle.addEventListener('keydown', event => {
      if (!Object.hasOwn(directions, event.key)) return;
      event.preventDefault();
      stop();
      const [dx, dy] = directions[event.key], step = event.shiftKey ? .18 : .065;
      tip = clampTip(pt(tip.x + dx * step, tip.y + dy * step));
      draw();
      announce();
    }, { signal });
  }
  draw();
}
