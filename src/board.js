import { add, clamp, cross, dist, mul, sub } from './math.js';

export const W = 640, H = 400;
export const xy = p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
export const line = (a, b, cls = 'structural') => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${cls}"/>`;
export const circle = (p, r, cls = 'aux') => `<circle cx="${p.x}" cy="${p.y}" r="${r}" class="${cls}"/>`;
export const polygon = (points, cls = 'shape') => `<polygon points="${points.map(xy).join(' ')}" class="${cls}"/>`;
export const polyline = (points, cls) => `<polyline points="${points.map(xy).join(' ')}" class="${cls}"/>`;
export const text = (p, value, cls = 'point-label') => `<text x="${p.x}" y="${p.y}" class="${cls}">${value}</text>`;
export function point(p, name = '', { key, kind = 'point' } = {}) {
  const action = key === undefined ? '' : ` data-point="${key}" tabindex="0" role="button" aria-label="${name || '未命名点'}"`;
  return `<g class="handle ${kind}"${action}>${key === undefined ? '' : circle(p, 16, 'hit')}${circle(p, 5, 'dot')}${name ? text({ x: p.x + 10, y: p.y - 10 }, name) : ''}</g>`;
}
export function infinite(a, b, cls = 'structural') {
  const d = mul(sub(b, a), 1400 / dist(a, b));
  return line(sub(a, d), sub(a, mul(d, -1)), cls);
}
/** The smaller arc of radius r at vertex between the rays towards a and b. */
export function angleArc(vertex, a, b, r, cls = 'result') {
  const u = mul(sub(a, vertex), r / dist(a, vertex)), v = mul(sub(b, vertex), r / dist(b, vertex));
  return `<path d="M${xy(add(vertex, u))}A${r} ${r} 0 0 ${cross(u, v) > 0 ? 1 : 0} ${xy(add(vertex, v))}" class="${cls}"/>`;
}
export const metric = (label, value) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
export const button = (label, action, attrs = '') => `<button type="button" data-action="${action}" ${attrs}>${label}</button>`;

export function slider(label, id, value, min, max, step = 1, unit = '') {
  return `<div class="slider"><label for="${id}">${label}</label><output for="${id}">${value}${unit}</output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
}

export function makeBoard(container, name) {
  container.innerHTML = `<svg class="board" viewBox="0 0 ${W} ${H}" aria-label="${name}画板">
    <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" class="grid-line"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#grid)"/><g class="drawing"></g>
  </svg>`;
  const svg = container.firstElementChild, drawing = svg.querySelector('.drawing');
  return {
    svg,
    draw: html => { drawing.innerHTML = html; },
    animate(selector = '.aux, .result, .angle-fill, .proof-bridge, .proof-active') {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      [...drawing.querySelectorAll(selector)].slice(0, 14).forEach((el, i) => {
        const delay = i * 52;
        if (el.matches('.angle-fill, .proof-bridge, .proof-active, .fractal-cell, .service-active, .paving-tile, .fade-in')) {
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, delay, easing: 'ease-out', fill: 'backwards' });
        } else if (typeof el.getTotalLength === 'function') {
          const length = el.getTotalLength();
          if (!length) return;
          el.animate([
            { strokeDasharray: `${length} ${length}`, strokeDashoffset: length, opacity: 0.35 },
            { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0, opacity: 1 },
          ], { duration: 520, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
        }
      });
      [...drawing.querySelectorAll('.handle.highlight .dot, .handle.candidate .dot')].slice(0, 8).forEach((dot, i) => {
        dot.animate([
          { transform: 'scale(0.3)', opacity: 0 },
          { transform: 'scale(1.25)', opacity: 1, offset: 0.65 },
          { transform: 'scale(1)', opacity: 1 },
        ], { duration: 420, delay: 120 + i * 60, easing: 'ease-out', fill: 'backwards' });
      });
    },
    coords(event, margin = 0) {
      const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
      return { x: clamp(local.x, margin, W - margin), y: clamp(local.y, margin, H - margin) };
    },
  };
}

export function dragPoints(board, move, selector = '[data-point]') {
  const { svg } = board;
  let active;
  svg.addEventListener('pointerdown', event => {
    const handle = event.target.closest(selector);
    if (!handle || event.button !== 0 || active) return;
    active = { key: handle.dataset.point, id: event.pointerId };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', event => {
    if (active?.id === event.pointerId) move(active.key, board.coords(event, 26));
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(type, event => { if (active?.id === event.pointerId) active = undefined; });
  }
  svg.addEventListener('keydown', event => {
    const handle = event.target.closest(selector);
    const shifts = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!handle || !Object.hasOwn(shifts, event.key)) return;
    event.preventDefault();
    const dot = handle.querySelector('.dot'), key = handle.dataset.point;
    const [dx, dy] = shifts[event.key], step = event.shiftKey ? 15 : 4;
    move(key, { x: clamp(+dot.getAttribute('cx') + dx * step, 26, W - 26), y: clamp(+dot.getAttribute('cy') + dy * step, 26, H - 26) });
    svg.querySelector(`[data-point="${key}"]`)?.focus();
  });
}
