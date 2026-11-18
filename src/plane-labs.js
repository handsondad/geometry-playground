import { pt, sub, mul, dist, clamp, ellipseString, voronoiCells } from './math.js';
import { H, W, button, line, metric, point, polygon, slider, dragPoints } from './board.js';

const readout = (input, value) => { input.parentElement.querySelector('output').value = value; };

export function ellipseLab({ board, controls, stats, signal }) {
  const a = 10, origin = pt(W / 2, H / 2), scale = 16;
  const map = p => pt(origin.x + p.x * scale, origin.y - p.y * scale);
  controls.innerHTML = slider('钉距（两颗钉子之间）', 'focal-distance', 12, 0, 18, .5) +
    slider('笔尖位置', 'ellipse-position', 48, 0, 359.5, .5, '°') +
    `<div class="control-row">${button('让钉子重合', 'circle')}${button('把钉子拉开', 'wide')}${button('复位', 'reset')}</div>
    <p class="lab-note">拖动笔尖 P 或在选中后按方向键。它会沿着绷紧的绳子滑动。</p>`;
  const [gap, angle] = controls.querySelectorAll('input');
  const setup = () => ellipseString(a, Number(gap.value) / 2, Number(angle.value) * Math.PI / 180);
  function draw() {
    const { b, pencil, foci } = setup(), [f1, f2] = foci;
    const p = map(pencil), m = map(f1), n = map(f2);
    board.draw(line(pt(93, origin.y), pt(548, origin.y), 'aux') + line(pt(origin.x, 26), pt(origin.x, 374), 'aux') +
      `<ellipse cx="${origin.x}" cy="${origin.y}" rx="${a * scale}" ry="${b * scale}" class="shape"/>` +
      line(m, p, 'result') + line(n, p, 'edge-highlight') +
      (Number(gap.value) ? point(m, 'F₁') + point(n, 'F₂') : point(origin, 'F₁ = F₂')) +
      point(p, 'P', { key: 'pencil', kind: 'draggable' }));
    const l1 = dist(pencil, f1), l2 = dist(pencil, f2);
    stats.innerHTML = metric('P 到 F₁', l1.toFixed(2)) + metric('P 到 F₂', l2.toFixed(2)) +
      metric('两段相加（绳长）', (l1 + l2).toFixed(2)) + metric('轨迹', Number(gap.value) ? '椭圆' : '圆');
    readout(gap, Number(gap.value).toFixed(1)); readout(angle, `${angle.value}°`);
  }
  dragPoints(board, (_, p) => {
    const d = mul(sub(p, origin), 1 / scale), { b } = setup();
    if (Math.hypot(d.x, d.y) < .02) return;
    const degrees = (Math.atan2(-d.y / b, d.x / a) * 180 / Math.PI + 360) % 360;
    angle.value = Math.round(degrees * 2) % 720 / 2;
    draw();
  });
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'circle') gap.value = 0;
    else if (action === 'wide') gap.value = 18;
    else if (action === 'reset') { gap.value = 12; angle.value = 48; }
    else return;
    draw();
  }, { signal });
  draw();
  return (_, nextGap, nextAngle) => {
    gap.value = nextGap;
    angle.value = nextAngle;
    draw();
    board.animate('.shape, .result, .edge-highlight');
  };
}

export function voronoiLab({ board, controls, stats, signal, notify }) {
  const [left, right, top, bottom] = [32, W - 32, 34, H - 34];
  const bounds = [pt(left, top), pt(right, top), pt(right, bottom), pt(left, bottom)], letters = 'ABCDE';
  const initial = [pt(165, 134), pt(392, 121), pt(130, 276), pt(328, 280), pt(526, 243)];
  const start = pt(267, 155);
  let sites = initial.slice(), probe = start;
  controls.innerHTML = `<div class="control-row">${button('试一个等距边界', 'tie')}${button('复位城市', 'reset')}</div>
    <p class="lab-note">拖动 A–E 调整服务站，拖动 P 查询最近的站；也可以选中点后按方向键移动。</p>`;
  function draw() {
    const cells = voronoiCells(sites, bounds);
    const distances = sites.map(site => dist(site, probe)), minimum = Math.min(...distances);
    const active = distances.map((d, i) => Math.abs(d - minimum) < 1e-7 ? i : -1).filter(i => i !== -1);
    board.draw(cells.map((cell, i) => polygon(cell, `service-cell service-${i}${active.includes(i) ? ' service-active' : ''}`)).join('') +
      polygon(bounds, 'proof-outline') + active.map(i => line(sites[i], probe, 'result')).join('') +
      sites.map((site, i) => point(site, letters[i], { key: i, kind: 'draggable' })).join('') +
      point(probe, 'P', { key: 'probe', kind: 'draggable highlight' }));
    const names = active.map(i => letters[i]).join('、');
    stats.innerHTML = metric(active.length === 1 ? '最近的服务站' : '并列最近的服务站', names) +
      metric('直线距离（画板单位）', minimum.toFixed(1));
  }
  dragPoints(board, (id, p) => {
    const location = pt(clamp(p.x, left + 14, right - 14), clamp(p.y, top + 14, bottom - 14));
    if (id === 'probe') probe = location;
    else if (sites.some((site, i) => i !== Number(id) && dist(site, location) < 20)) {
      notify('请把服务站放开一点，避免两个站的标记重叠。');
      return;
    } else sites[id] = location;
    notify('');
    draw();
  });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'tie') {
      sites = [pt(210, 135), pt(410, 135), pt(120, 293), pt(315, 304), pt(527, 283)];
      probe = pt(310, 135);
    } else if (action === 'reset') { sites = initial.slice(); probe = start; }
    else return;
    notify('');
    draw();
  }, { signal });
  draw();
  return (_, preset) => {
    if (preset === 'tie') {
      sites = [pt(210, 135), pt(410, 135), pt(120, 293), pt(315, 304), pt(527, 283)];
      probe = pt(310, 135);
    } else if (preset === 'corner') {
      sites = [pt(165, 134), pt(392, 121), pt(130, 276), pt(328, 280), pt(430, 200)];
      probe = pt(390, 200);
    } else {
      sites = initial.slice();
      probe = start;
    }
    notify('');
    draw();
    board.animate('.service-active, .result');
  };
}
