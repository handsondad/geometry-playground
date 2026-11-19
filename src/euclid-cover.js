import { add, clamp, cross, dist, dot, intersections, mix, mul, perp, pt, sub } from './math.js';

const width = 480, height = 290;
const a = pt(184, height / 2), initial = pt(296, a.y);
const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export function euclidCoverHtml() {
  return `<figure class="index-figure" id="euclid-cover">
    <svg viewBox="0 0 ${width} ${height}" role="group" aria-label="等边三角形动态尺规图">
      <g aria-hidden="true">
        <path class="index-axis"/><path class="index-triangle"/>
        <circle class="index-circle is-a" cx="${a.x}" cy="${a.y}"/><circle class="index-circle is-b"/>
        <path class="index-edges"/><path class="index-angle-mark"/><text class="index-angle"/>
        <circle class="index-vertex" cx="${a.x}" cy="${a.y}" r="4.5"/><text x="${a.x - 19}" y="${a.y + 20}">A</text>
        <g class="index-apex"><circle class="index-vertex" r="4.5"/><text x="-5" y="-13">C</text></g>
      </g>
      <g class="index-handle" tabindex="0" role="group" aria-label="可移动的 B 点" aria-describedby="index-cover-hint" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown">
        <circle class="index-hit" r="38"/>
        <circle class="index-halo" r="13"/>
        <circle class="index-vertex" r="5"/>
        <text x="15" y="6" aria-hidden="true">B</text>
      </g>
    </svg>
    <p class="index-measurement" role="status"></p>
    <figcaption>
      <span id="index-cover-hint">拖动 B · 点按 · 方向键</span>
      <span class="index-equality">AB = BC = CA</span>
      <button type="button" class="index-reset" aria-label="复位等边三角形">复位</button>
    </figcaption>
  </figure>`;
}

export function mountEuclidCover(figure, signal) {
  const $ = sel => figure.querySelector(sel);
  const svg = $('svg'), handle = $('.index-handle'), angle = $('.index-angle'), marker = $('.index-angle-mark');
  const circleA = $('.index-circle.is-a'), circleB = $('.index-circle.is-b'), cPoint = $('.index-apex');
  const axes = $('.index-axis'), edges = $('.index-edges'), fill = $('.index-triangle'), status = $('.index-measurement');
  let b = initial, pointer;
  const pair = p => `${p.x} ${p.y}`;
  const translate = (element, p) => element.setAttribute('transform', `translate(${pair(p)})`);
  const coords = event => new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());

  function draw() {
    const r = dist(a, b), delta = sub(b, a), middle = mix(a, b);
    const [, c] = intersections({ c: a, r }, { c: b, r });
    const u = sub(a, c), v = sub(b, c);
    const degrees = Math.round(Math.atan2(Math.abs(cross(u, v)), dot(u, v)) * 180 / Math.PI);
    const path = `M${pair(a)} ${pair(b)} ${pair(c)}Z`;
    edges.setAttribute('d', path);
    fill.setAttribute('d', path);
    const guide = mul(perp(delta), 1.08);
    axes.setAttribute('d', `M${pair(add(a, mul(delta, -.85)))} L${pair(add(b, mul(delta, .85)))} M${pair(sub(middle, guide))} L${pair(add(middle, guide))}`);
    for (const circle of [circleA, circleB]) circle.setAttribute('r', r);
    circleB.setAttribute('cx', b.x);
    circleB.setAttribute('cy', b.y);
    translate(cPoint, c);
    translate(handle, b);
    const arcRadius = 15;
    marker.setAttribute('d', `M${pair(add(c, mul(u, arcRadius / r)))} A${arcRadius} ${arcRadius} 0 0 0 ${pair(add(c, mul(v, arcRadius / r)))}`);
    translate(angle, mix(c, middle, .64));
    angle.textContent = `${degrees}°`;
  }

  function move(p) {
    const delta = sub(p, a);
    const bearing = clamp(Math.atan2(delta.y, Math.max(0, delta.x)), -.76, .76);
    const vertical = Math.sin(bearing);
    // Keep both compass circles inside the panel, including at the steepest angle.
    const limit = (a.y - 12) / (1 + Math.abs(vertical));
    const r = clamp(dist(a, p), 60, limit);
    b = add(a, pt(r * Math.cos(bearing), r * vertical));
    draw();
  }

  function announce() {
    status.textContent = `边长 ${dist(a, b).toFixed(1)}，三边仍然等长，顶角 ${angle.textContent}。`;
  }

  handle.addEventListener('keydown', event => {
    if (!Object.hasOwn(moves, event.key)) return;
    event.preventDefault();
    const [dx, dy] = moves[event.key], step = event.shiftKey ? 3 : 10;
    move(add(b, pt(dx * step, dy * step)));
    announce();
  }, { signal });
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer) return;
    pointer = { id: event.pointerId, offset: sub(coords(event), b) };
    handle.setPointerCapture(event.pointerId);
  }, { signal });
  handle.addEventListener('pointermove', event => {
    if (event.pointerId === pointer?.id) move(sub(coords(event), pointer.offset));
  }, { signal });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    handle.addEventListener(type, event => {
      if (event.pointerId !== pointer?.id) return;
      pointer = undefined;
      announce();
    }, { signal });
  }
  svg.addEventListener('click', event => {
    if (handle.contains(event.target)) return;
    move(coords(event));
    announce();
  }, { signal });
  $('.index-reset').addEventListener('click', () => {
    b = initial;
    draw();
    announce();
  }, { signal });
  draw();
}
