import { button, line, polygon, text, xy } from './board.js';
import { clamp, pt } from './math.js';
import { cross3, dotN, hypercube } from './spatial-math.js';

export const rad = n => n * Math.PI / 180;
export const tau = 2 * Math.PI;
export const trace = (n, fn) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
export const ease = t => t * t * (3 - 2 * t);
export const depth = points => points.reduce((sum, p) => sum + p.depth, 0) / points.length;
export const readout = (input, value) => { input.parentElement.querySelector('output').value = value; };
export const selection = (controls, key) => {
  for (const item of controls.querySelectorAll('button[data-mode]')) item.setAttribute('aria-pressed', item.dataset.action === key);
};
export const modeButton = (label, key, active = false) => button(label, key, `data-mode aria-pressed="${active}"`);
export const transport = label => button(label, 'play-space', 'class="primary"');

export function spatialStudio({ board, controls, signal, interactive = true }, draw, start = [34, 24], detailLabel = '对照图') {
  const { svg } = board;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const play = controls.querySelector('[data-action="play-space"]');
  let playLabel = play.textContent;
  const hint = document.createElement('p');
  hint.className = 'space-hint';
  hint.id = 'space-orbit-hint';
  hint.innerHTML = `<span>拖动或按方向键旋转</span>${button('复位视角', 'reset-space')}`;
  svg.after(hint);
  svg.classList.add('space-stage');
  hint.hidden = !interactive;
  if (interactive) {
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-describedby', hint.id);
  }
  let pane = 'model';
  const panePicker = document.createElement('div');
  panePicker.className = 'space-pane-picker';
  panePicker.hidden = true;
  panePicker.setAttribute('role', 'group');
  panePicker.setAttribute('aria-label', '画板视图');
  panePicker.innerHTML = button('立体模型', 'model', 'class="pill-btn" aria-pressed="true"') +
    button(detailLabel, 'detail', 'class="pill-btn" aria-pressed="false"');
  svg.before(panePicker);
  panePicker.addEventListener('click', event => {
    const item = event.target.closest('button');
    if (!item) return;
    pane = item.dataset.action;
    for (const button of panePicker.children) button.setAttribute('aria-pressed', button === item);
    setLayout(true);
  }, { signal });
  function setLayout(compact) {
    svg.classList.toggle('is-compact', compact);
    panePicker.hidden = !compact;
    if (compact) svg.dataset.pane = pane;
    else delete svg.dataset.pane;
    hint.hidden = !interactive || svg.dataset.pane === 'detail';
    if (hint.hidden) svg.removeAttribute('aria-describedby');
    else svg.setAttribute('aria-describedby', hint.id);
    svg.setAttribute('viewBox', compact ? '0 0 372 400' : '0 0 640 400');
  }
  const layout = new ResizeObserver(([entry]) => {
    const compact = entry.contentRect.width < 470;
    if (compact === svg.classList.contains('is-compact')) return;
    setLayout(compact);
  });
  layout.observe(svg);

  let [yaw, pitch] = start, pointer, request = 0;
  function stop() {
    if (!request) return;
    cancelAnimationFrame(request);
    request = 0;
    delete svg.dataset.playing;
    play.textContent = playLabel;
  }
  function orbit(dx, dy) {
    stop();
    yaw = (yaw + dx) % 360;
    pitch = clamp(pitch + dy, -85, 85);
    draw();
  }
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer || svg.dataset.pane === 'detail') return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
  }, { signal });
  svg.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer?.id) return;
    const { clientX: x, clientY: y } = event;
    orbit((x - pointer.x) * .55, (y - pointer.y) * .55);
    pointer = { ...pointer, x, y };
  }, { signal });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(type, event => { if (pointer?.id === event.pointerId) pointer = undefined; }, { signal });
  }
  svg.addEventListener('keydown', event => {
    const directions = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
    if (Object.hasOwn(directions, event.key) && svg.dataset.pane !== 'detail') {
      event.preventDefault();
      orbit(...directions[event.key]);
    }
  }, { signal });
  hint.querySelector('button').addEventListener('click', () => {
    [yaw, pitch] = start;
    orbit(0, 0);
  }, { signal });
  signal.addEventListener('abort', () => { stop(); layout.disconnect(); }, { once: true });
  preference.addEventListener('change', stop, { signal });

  return {
    stop,
    get playing() { return Boolean(request); },
    playLabel(label) {
      playLabel = label;
      if (!request) play.textContent = label;
    },
    animate(duration, update) {
      stop();
      if (preference.matches) { update(1); return; }
      update(0);
      play.textContent = '停止演示';
      svg.dataset.playing = 'true';
      let startTime;
      function tick(now) {
        startTime ??= now;
        const t = Math.min(1, (now - startTime) / duration);
        update(t);
        if (t < 1) request = requestAnimationFrame(tick);
        else stop();
      }
      request = requestAnimationFrame(tick);
    },
    camera(origin, scale) {
      const c = Math.cos(rad(yaw)), s = Math.sin(rad(yaw)), d = Math.cos(rad(pitch)), e = Math.sin(rad(pitch));
      const eye = [d * s, e, d * c];
      return {
        eye,
        project: ([x, y, z]) => ({
          x: origin.x + (c * x - s * z) * scale,
          y: origin.y + (e * (s * x + c * z) - d * y) * scale,
          depth: dotN([x, y, z], eye),
        }),
      };
    },
  };
}

export function stage(left, right, model, detail, note, legend) {
  return `<rect class="space-backdrop" width="640" height="400"/>
    <path class="space-grid space-wide-rule" d="M20 59H620 M20 350H620 M372 20V380"/>
    <path class="space-grid space-compact-rule" d="M20 59H352 M20 350H352"/>
    <g class="space-model">${text(pt(24, 42), left, 'space-heading')}${model}${text(pt(24, 379), note, 'space-label')}</g>
    <g class="space-detail">${detail}</g>
    <g class="space-detail-label">${text(pt(392, 42), right, 'space-heading')}${text(pt(392, 379), legend, 'space-label')}</g>`;
}

export function wire(points, edges, style) {
  return edges.map(([i, j]) => line(points[i], points[j], typeof style === 'function' ? style(i, j) : style)).join('');
}

const faces = [0, 1, 2].flatMap(axis => [-1, 1].map(side => {
  const [u, v] = [1, 2, 4].filter((_, i) => i !== axis);
  const base = side > 0 ? 1 << axis : 0;
  return { indices: [base, base ^ u, base ^ u ^ v, base ^ v], axis, side };
}));
const { edges } = hypercube(3);

export function boxMesh(world, { eye, project }, style = '') {
  const points = world.map(project);
  const minus = (a, b) => a.map((n, i) => n - b[i]);
  const front = faces.filter(({ indices: [i, j, , k], axis }) => {
    const normal = cross3(minus(world[j], world[i]), minus(world[k], world[i]));
    return dotN(normal, eye) * dotN(normal, minus(world[i], world[i ^ (1 << axis)])) > 1e-8;
  });
  return {
    surfaces: front.map(({ indices, axis, side }) => {
      const shape = indices.map(i => points[i]);
      return { depth: depth(shape), html: polygon(shape, `space-face shade-${axis}-${side > 0 ? 'p' : 'n'} ${style}`) };
    }),
    edges: wire(points, edges, (i, j) =>
      `space-wire ${front.some(({ indices }) => indices.includes(i) && indices.includes(j)) ? 'is-near' : 'is-far'} ${style}`),
  };
}

export const path = (points, cls, closed = false) => points.length
  ? `<path d="M${points.map(xy).join('L')}${closed ? 'Z' : ''}" class="${cls}"/>` : '';
