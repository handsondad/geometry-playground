import { pt, add, sub, mul, norm, clamp, dist, dot, reflectionShot, symmetryImages, sangaku } from './math.js';
import { W, H, button, circle, line, metric, point, polygon, polyline, slider, text, xy, dragPoints } from './board.js';

const output = (input, value) => { input.parentElement.querySelector('output').value = value; };

export function billiards({ board, controls, stats, signal }) {
  const rail = 177, bounds = { minX: 56, maxX: 584, bottom: 362 }, targetRadius = 9;
  const defaults = [pt(165, 314), pt(474, 285)];
  let balls = defaults.slice(), hint = false, shot = false;
  controls.innerHTML = slider('碰边位置 Q（从左到右）', 'bounce-x', 40, 0, 100, .1, '%') +
    `<div class="control-row">${button('试射', 'shoot', 'class="primary"')}${button('镜像提示', 'hint', 'aria-pressed="false"')}${button('复位', 'reset')}</div>
    <p class="lab-note">拖动 A 和 B，或选中后用方向键调整。先试着瞄准，再打开镜像提示。</p>`;
  const input = controls.querySelector('input'), span = bounds.maxX - bounds.minX;
  function draw() {
    const [a, b] = balls;
    const { image, bounce } = reflectionShot(a, b, rail);
    const q = pt(bounds.minX + span * Number(input.value) / 100, rail);
    const d = pt(q.x - a.x, a.y - rail);
    const sideTime = d.x === 0 ? Infinity : ((d.x > 0 ? bounds.maxX : bounds.minX) - q.x) / d.x;
    const end = add(q, mul(d, Math.min(sideTime, (bounds.bottom - rail) / d.y)));
    const direction = sub(end, q), length = norm(direction);
    const unit = length ? mul(direction, 1 / length) : pt(0, 0);
    const projection = dot(sub(b, q), unit);
    const error = dist(b, add(q, mul(unit, clamp(projection, 0, length))));
    const hit = error <= targetRadius;
    const pathEnd = hit ? add(q, mul(unit, clamp(projection - Math.sqrt(Math.max(0, targetRadius ** 2 - error ** 2)), 0, length))) : end;
    const table = `<rect x="${bounds.minX}" y="${rail}" width="${span}" height="${bounds.bottom - rail}" rx="5" class="pool-table"/>`;
    const helper = hint ? line(a, image, 'aux') + line(b, image, 'aux') + line(bounce, b, 'hint-route') +
      point(image, 'B′') + point(bounce, '理想点', { kind: 'highlight' }) : '';
    board.draw(table + line(pt(bounds.minX, rail), pt(bounds.maxX, rail), 'structural') +
      text(pt(65, rail - 11), '上方库边', 'graph-note') + helper + line(a, q, 'result') +
      (shot ? line(q, pathEnd, hit ? 'hint-route' : 'result') : '') + point(q, 'Q') +
      circle(b, targetRadius, 'pool-target') + point(a, 'A', { key: 0, kind: 'draggable' }) +
      point(b, 'B', { key: 1, kind: 'draggable' }));
    output(input, `${Number(input.value).toFixed(1)}%`);
    stats.innerHTML = metric('试射结果', shot ? hit ? '命中目标' : '没有命中' : '尚未试射') +
      metric(hint ? '理想碰边位置' : '本次碰边位置', hint ? `${((bounce.x - bounds.minX) * 100 / span).toFixed(1)}%` : `${input.value}%`);
  }
  dragPoints(board, (i, p) => {
    balls[i] = pt(clamp(p.x, bounds.minX + 24, bounds.maxX - 24), clamp(p.y, rail + 38, bounds.bottom - 20));
    shot = false;
    draw();
  });
  controls.addEventListener('input', () => { shot = false; draw(); }, { signal });
  controls.addEventListener('click', event => {
    const item = event.target.closest('button');
    if (item?.dataset.action === 'shoot') shot = true;
    else if (item?.dataset.action === 'hint') { hint = !hint; item.setAttribute('aria-pressed', hint); }
    else if (item?.dataset.action === 'reset') {
      balls = defaults.slice(); input.value = 40; shot = false; hint = false;
      controls.querySelector('[data-action="hint"]').setAttribute('aria-pressed', 'false');
    } else return;
    draw();
  }, { signal });
  draw();
  return (kind, pos, nextHint, nextShot) => {
    if (kind === 'ideal') {
      const { bounce } = reflectionShot(balls[0], balls[1], rail);
      input.value = clamp(((bounce.x - bounds.minX) * 100 / span), 0, 100).toFixed(1);
      hint = true;
      shot = true;
    } else {
      input.value = pos;
      hint = Boolean(nextHint);
      shot = Boolean(nextShot);
    }
    controls.querySelector('[data-action="hint"]').setAttribute('aria-pressed', hint);
    draw();
    board.animate('.hint-route, .result, .aux');
  };
}

export function symmetryInk({ board, controls, stats, signal, notify }) {
  const center = pt(W / 2, H / 2), radius = 162, maxSamples = 5000;
  let strokes = [], stroke, pointer, mirror = false, pen = sub(center, pt(0, 70)), showPen = false, samples = 0;
  controls.innerHTML = slider('旋转份数', 'symmetry-order', 6, 1, 12) +
    `<div class="control-row">${button('镜像', 'mirror', 'aria-pressed="false"')}${button('撤销上一笔', 'undo')}${button('清空', 'reset')}</div>
    <p class="lab-note">用鼠标或手指在圆内画。也可 Tab 进入画板，按方向键移动笔尖、空格开始或结束一笔。</p>`;
  const input = controls.querySelector('input'), { svg } = board;
  svg.classList.add('ink-board');
  svg.setAttribute('tabindex', '0');
  const limit = p => { const d = sub(p, center), r = norm(d); return r > radius - 4 ? add(center, mul(d, (radius - 4) / r)) : p; };
  function draw() {
    const order = Number(input.value), n = order * (mirror ? 2 : 1);
    const ink = strokes.map(st => {
      const tracks = Array.from({ length: n }, () => []);
      for (const p of st) symmetryImages(p, center, order, mirror).forEach((q, i) => tracks[i].push(q));
      return tracks.map((track, i) => {
        const cls = i === 0 ? 'ink-origin' : mirror && i % 2 ? 'ink-mirror' : 'ink-rotation';
        return track.length === 1 ? circle(track[0], 1.65, `ink-dot ${cls}`) : polyline(track, `ink-stroke ${cls}`);
      }).join('');
    }).join('');
    board.draw(circle(center, radius, 'globe') + (mirror ? line(pt(center.x, center.y - radius), pt(center.x, center.y + radius), 'aux') : '') +
      ink + circle(center, radius, 'rim') + (showPen ? circle(pen, 5, 'ink-cursor') : ''));
    output(input, order);
    stats.innerHTML = metric('每笔生成（含原笔迹）', `${n} 份`) + metric('已画笔数', strokes.length);
    controls.querySelector('[data-action="undo"]').disabled = !strokes.length;
  }
  function append(p) {
    if (samples >= maxSamples) { notify('画纸已满。可撤销一笔或清空后继续画。'); return; }
    if (stroke && dist(p, stroke.at(-1)) < 2) return;
    if (!stroke) { stroke = []; strokes.push(stroke); }
    stroke.push(p);
    samples++;
    draw();
  }
  svg.addEventListener('pointerdown', event => {
    const p = board.coords(event);
    if (pointer !== undefined || event.button !== 0 || dist(p, center) > radius) return;
    pointer = event.pointerId;
    svg.setPointerCapture(pointer);
    stroke = undefined; showPen = false; append(limit(p));
  }, { signal });
  svg.addEventListener('pointermove', event => { if (pointer === event.pointerId) append(limit(board.coords(event))); }, { signal });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(event, e => { if (pointer === e.pointerId) { pointer = undefined; stroke = undefined; } }, { signal });
  }
  svg.addEventListener('keydown', event => {
    const vectors = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (event.key !== ' ' && !Object.hasOwn(vectors, event.key)) return;
    event.preventDefault();
    if (pointer !== undefined) return;
    showPen = true;
    if (event.key === ' ') {
      if (event.repeat) return;
      if (stroke) { stroke = undefined; draw(); }
      else append(pen);
      return;
    }
    const [x, y] = vectors[event.key], step = event.shiftKey ? 14 : 5;
    pen = limit(add(pen, pt(x * step, y * step)));
    if (stroke) append(pen);
    else draw();
  }, { signal });
  svg.addEventListener('blur', () => { if (pointer === undefined && showPen) { showPen = false; stroke = undefined; draw(); } }, { signal });
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const item = event.target.closest('button');
    if (!item) return;
    if (item.dataset.action === 'mirror') { mirror = !mirror; item.setAttribute('aria-pressed', mirror); }
    else {
      stroke = undefined;
      if (item.dataset.action === 'undo') samples -= strokes.pop().length;
      if (item.dataset.action === 'reset') { strokes = []; samples = 0; }
      notify('');
    }
    draw();
  }, { signal });
  draw();
  return (_, order, nextMirror) => {
    input.value = order;
    mirror = Boolean(nextMirror);
    controls.querySelector('[data-action="mirror"]').setAttribute('aria-pressed', mirror);
    if (!strokes.length) {
      const sample = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        sample.push(pt(center.x + 24 + 92 * t, center.y - 38 - 52 * Math.sin(t * Math.PI)));
      }
      strokes.push(sample);
      samples = sample.length;
    }
    draw();
    board.animate(mirror ? '.ink-mirror, .ink-stroke' : '.ink-stroke');
  };
}

const sangakuSteps = [
  '先观察三条弧。边长改变时，试着判断小圆半径占边长的比例是否会改变。',
  '连起圆心：小圆与右下角的大圆、左侧的半圆内切，因此圆心距分别是 s − r 和 s/2 − r；小圆与底边的半圆外切，圆心距是 s/2 + r。',
  '以左下角为原点，把小圆圆心写成 (x, y)。对三段圆心距分别平方，再两两相减消去 x² + y²，得到 x = 3r、y = 5r。把它们代入底边圆心距方程：(3r − s/2)² + (5r)² = (s/2 + r)²。整理为 r(33r − 4s) = 0，取非零解 r = 4s/33。',
];

export function sangakuPuzzle({ board, controls, stats, signal, guide }) {
  let step = 0;
  controls.innerHTML = slider('正方形边长 s', 'sangaku-side', 264, 132, 330, 1) +
    slider('我猜半径占边长', 'sangaku-guess', 15, 5, 23, .1, '%');
  guide.innerHTML = `<div class="proof-steps" aria-label="算额谜题提示">${['观察图形', '找出相切关系', '揭晓比例'].map((name, i) =>
    button(name, i, 'aria-pressed="false"')).join('')}</div><p class="proof-detail" role="status"></p>`;
  const [size, guess] = controls.querySelectorAll('input');
  function draw() {
    const s = Number(size.value), hypothesis = Number(guess.value), f = sangaku(s);
    const o = pt((W - s) / 2, (H + s) / 2), map = p => pt(o.x + p.x, o.y - p.y);
    const [bl, br, tr, tl] = [pt(0, 0), pt(s, 0), pt(s, s), pt(0, s)].map(map);
    const path = (a, b, r, cls) => `<path d="M${xy(a)} A${r} ${r} 0 0 1 ${xy(b)}" class="sangaku-arc ${cls}"/>`;
    const centers = f.arcs.map((arc, i) => {
      const tangent = add(arc.center, mul(sub(f.center, arc.center), arc.r / dist(arc.center, f.center)));
      return line(map(arc.center), map(f.center), 'aux') + point(map(arc.center), `O${i + 1}`) + point(map(tangent), '', { kind: 'highlight' });
    }).join('');
    board.draw(polygon([bl, br, tr, tl], 'proof-outline') + path(bl, tr, s, 'arc-a') + path(tl, bl, s / 2, 'arc-b') +
      path(bl, br, s / 2, 'arc-c') + circle(map(f.center), f.r, 'shape') +
      (step === 2 ? circle(map(f.center), s * hypothesis / 100, 'guess-circle') : '') +
      (step ? centers + point(map(f.center), 'P') : ''));
    output(size, s); output(guess, `${hypothesis.toFixed(1)}%`);
    stats.innerHTML = metric('边长 s', s) + (step < 2 ? metric('我的猜测', `${hypothesis.toFixed(1)}%`) :
      metric('小圆半径 r', `${f.r.toFixed(2)}`) + metric('半径 / 边长', '4/33 ≈ 12.12%') +
      metric('猜测与答案相差', `${Math.abs(hypothesis - 400 / 33).toFixed(2)} 个百分点`));
  }
  function select(index) {
    step = index;
    for (const item of guide.querySelectorAll('button')) item.setAttribute('aria-pressed', Number(item.dataset.action) === step);
    guide.querySelector('.proof-detail').textContent = sangakuSteps[step];
    draw();
  }
  guide.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action !== undefined) select(Number(action));
  }, { signal });
  controls.addEventListener('input', draw, { signal });
  select(0);
  return (_, index) => {
    select(index);
    board.animate('.sangaku-arc, .aux, .guess-circle, .shape');
  };
}
