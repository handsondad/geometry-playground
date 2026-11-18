import { pt, add, sub, mul, mix, dist, perp, rotate, area, clamp, triangleCenters, koch, sierpinski, geodesic } from './math.js';
import { W, H, button, circle, line, infinite, metric, point, polygon, polyline, slider, text, xy, dragPoints } from './board.js';

const radians = degrees => degrees * Math.PI / 180;
const center = pt(W / 2, H / 2);
const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

export function sphere({ board, controls, stats, signal }) {
  const radius = 145, tilt = radians(24);
  const project = ([lat, lon]) => {
    const [phi, theta] = [radians(lat), radians(lon)];
    const x = Math.cos(phi) * Math.sin(theta), y = Math.cos(phi) * Math.cos(theta), z = Math.sin(phi);
    return { x: center.x + radius * x, y: center.y - radius * (z * Math.cos(tilt) - y * Math.sin(tilt)), depth: y * Math.cos(tilt) + z * Math.sin(tilt) };
  };
  const graticule = [...range(12, i => range(181, j => [j - 90, i * 30])), ...[-60, -30, 0, 30, 60].map(lat => range(361, lon => [lat, lon]))];
  const grid = graticule.map(curve => {
    const path = curve.map(project).reduce((state, p) => ({
      prev: p.depth >= 0,
      d: state.d + (p.depth >= 0 ? `${state.prev ? 'L' : 'M'}${xy(p)}` : ''),
    }), { prev: false, d: '' }).d;
    return `<path d="${path}" class="globe-grid"/>`;
  }).join('');
  controls.innerHTML = slider('经度差 Δλ', 'longitude', 90, 10, 160, 1, '°') +
    `<div class="control-row">${[30, 90, 150].map(n => button(`${n}°`, n)).join('')}</div>`;
  const input = controls.querySelector('input'), output = controls.querySelector('output');
  function draw() {
    const n = Number(input.value), a = -n / 2, b = n / 2;
    const boundary = [...range(25, i => [90 - i * 90 / 24, a]), ...range(n + 1, i => [0, a + i]), ...range(25, i => [i * 90 / 24, b])].map(project);
    board.draw(circle(center, radius, 'globe') + grid + polygon(boundary) + point(project([90, 0]), 'N') +
      point(project([0, a]), 'A') + point(project([0, b]), 'B'));
    output.value = `${n}°`;
    stats.innerHTML = metric('三角形内角和', `${180 + n}°`) + metric('比平面多', `${n}°`);
  }
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action) { input.value = action; draw(); }
  }, { signal });
  draw();
  return (_, value) => {
    input.value = value;
    draw();
    board.animate('.shape');
  };
}

export function disk({ board, controls, stats, signal }) {
  const r = 148, a = .45, p = pt(0, -a), map = q => add(center, mul(q, r));
  const limit = Math.atan2(2 * a, 1 - a * a);
  let atLimit = false;
  controls.innerHTML = slider('过 P 的方向', 'direction', 0, -90, 90, 1, '°') +
    `<div class="control-row">${button('试试 0°', 'flat')}${button('试试 90°', 'vertical')}${button('看临界方向', 'limit')}</div>`;
  const input = controls.querySelector('input'), output = controls.querySelector('output');
  function draw() {
    const theta = atLimit ? limit : radians(Number(input.value));
    const g = geodesic(p, pt(Math.cos(theta), Math.sin(theta)));
    const [u, v] = g.ends.map(map);
    let art, crossPoint, status;
    if (!g.center) {
      art = line(u, v, 'result');
      crossPoint = pt(0, 0);
    } else {
      const rr = r * g.radius, direction = sub(g.ends[0], g.center), next = sub(g.ends[1], g.center);
      const sweep = direction.x * next.y - direction.y * next.x > 0 ? 1 : 0;
      art = `<path d="M${xy(u)} A${rr} ${rr} 0 0 ${sweep} ${xy(v)}" class="result"/>`;
      const cx = g.center.x, d = cx ** 2 - 1;
      if (d > 1e-8) crossPoint = pt(Math.sign(cx) / (Math.abs(cx) + Math.sqrt(d)), 0);
    }
    status = atLimit ? '只在边界相遇' : crossPoint ? '盘内相交' : '盘内不相交';
    board.draw(circle(center, r, 'globe') + line(map(pt(-1, 0)), map(pt(1, 0)), 'structural') + art +
      circle(center, r, 'rim') + point(map(p), 'P') + point(u) + point(v) +
      (crossPoint ? point(map(crossPoint), '交点') : '') + text(pt(448, 187), '基准线', 'graph-note'));
    output.value = `${atLimit ? (theta * 180 / Math.PI).toFixed(1) : input.value}°`;
    stats.innerHTML = metric('和基准线的关系', status) + metric('模型', '庞加莱圆盘');
  }
  controls.addEventListener('input', () => { atLimit = false; draw(); }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    atLimit = action === 'limit';
    input.value = atLimit ? Math.round(limit * 180 / Math.PI) : action === 'flat' ? 0 : 90;
    draw();
  }, { signal });
  draw();
  return (_, action) => {
    atLimit = action === 'limit';
    input.value = atLimit ? Math.round(limit * 180 / Math.PI) : action === 'flat' ? 0 : 90;
    draw();
    board.animate('.result');
  };
}

export function fractals({ board, controls, stats, lesson, signal }) {
  const snow = lesson.id === 'koch', side = snow ? 300 : 350, height = side * Math.sqrt(3) / 2;
  const bottom = snow ? 294 : 351;
  const triangle = [pt(320, bottom - height), pt(320 + side / 2, bottom), pt(320 - side / 2, bottom)];
  controls.innerHTML = slider('迭代轮数', 'depth', 2, 0, 6) +
    `<div class="control-row">${button('− 上一轮', 'less')}${button('+ 下一轮', 'more')}${button('回到第 0 轮', 'zero')}</div>`;
  const input = controls.querySelector('input'), output = controls.querySelector('output');
  function draw() {
    const n = Number(input.value);
    if (snow) {
      board.draw(polygon(koch(triangle, n)) + (n ? polygon(triangle, 'aux') : ''));
      stats.innerHTML = metric('边的数量', (3 * 4 ** n).toLocaleString('zh-CN')) + metric('周长 / 初始周长', `${((4 / 3) ** n).toFixed(3)} 倍`);
    } else {
      board.draw(sierpinski(triangle, n).map(t => polygon(t, 'fractal-cell')).join('') + polygon(triangle, 'aux'));
      stats.innerHTML = metric('剩余小三角形', (3 ** n).toLocaleString('zh-CN')) + metric('剩余面积比例', `${(100 * (3 / 4) ** n).toFixed(2)}%`);
    }
    output.value = input.value;
    controls.querySelector('[data-action="less"]').disabled = n === 0;
    controls.querySelector('[data-action="more"]').disabled = n === 6;
  }
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action) { input.value = action === 'zero' ? 0 : Number(input.value) + (action === 'less' ? -1 : 1); draw(); }
  }, { signal });
  draw();
  return (_, depth) => {
    input.value = depth;
    draw();
    board.animate(snow ? '.shape' : '.fractal-cell');
  };
}

const vertices = triangle => triangle.map((p, i) => point(p, 'ABC'[i], { key: i, kind: 'draggable' })).join('');
const triangleType = ([a, b, c]) => {
  const [x, y, z] = [dist(a, b), dist(b, c), dist(c, a)].sort((u, v) => u - v);
  const diff = (z ** 2 - x ** 2 - y ** 2) / z ** 2;
  return Math.abs(diff) < 1e-8 ? '直角三角形' : diff > 0 ? '钝角三角形' : '锐角三角形';
};

export function centers({ board, controls, stats, signal }) {
  const initial = [pt(302, 70), pt(130, 304), pt(508, 304)];
  let triangle = initial.slice(), mode = 'centroid';
  const modes = { centroid: '重心', circumcenter: '外心', incenter: '内心' };
  controls.innerHTML = `<div class="control-row">${Object.entries(modes).map(([id, name]) => button(name, id, 'aria-pressed="false"')).join('')}</div>
    <div class="control-row">${button('摆成钝角三角形', 'obtuse')}${button('摆成直角三角形', 'right')}${button('复位顶点', 'reset')}</div>
    <p class="lab-note">拖动标有 A、B、C 的点；也可按方向键微调，按住 Shift 加速。</p>`;
  function draw() {
    const data = triangleCenters(triangle), o = data?.[mode];
    let art = polygon(triangle);
    if (o) {
      for (let i = 0; i < 3; i++) {
        const [p, q, r] = [triangle[i], triangle[(i + 1) % 3], triangle[(i + 2) % 3]];
        if (mode === 'centroid') art += line(p, mix(q, r), 'aux');
        if (mode === 'incenter') {
          const ratio = dist(p, q) / (dist(p, q) + dist(p, r));
          art += line(p, mix(q, r, ratio), 'aux');
        }
        if (mode === 'circumcenter') {
          const midpoint = mix(q, r);
          art += infinite(midpoint, add(midpoint, perp(sub(r, q))), 'aux');
        }
      }
      if (mode === 'circumcenter') art += circle(o, dist(o, triangle[0]), 'aux alt');
      if (mode === 'incenter') art += circle(o, data.inradius, 'aux alt');
      if (o.x >= 24 && o.x <= W - 46 && o.y >= 28 && o.y <= H - 12) art += point(o, modes[mode], { kind: 'highlight' });
    }
    board.draw(art + vertices(triangle));
    const type = data ? triangleType(triangle) : '退化（共线或重合）';
    const location = !data ? '未定义' : mode !== 'circumcenter' ? '三角形内' :
      { '锐角三角形': '三角形内', '直角三角形': '斜边中点', '钝角三角形': '三角形外' }[type];
    stats.innerHTML = metric('当前形状', type) + metric(`${modes[mode]}的位置`, location);
    for (const option of controls.querySelectorAll('[aria-pressed]')) option.setAttribute('aria-pressed', option.dataset.action === mode);
  }
  dragPoints(board, (i, p) => { triangle[i] = p; draw(); });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (Object.hasOwn(modes, action)) mode = action;
    if (action === 'obtuse') triangle = [pt(300, 155), pt(132, 280), pt(510, 280)];
    if (action === 'right') triangle = [pt(205, 95), pt(205, 300), pt(495, 300)];
    if (action === 'reset') triangle = initial.slice();
    draw();
  }, { signal });
  draw();
  return (_, nextMode, shape = 'reset') => {
    if (Object.hasOwn(modes, nextMode)) mode = nextMode;
    if (shape === 'obtuse') triangle = [pt(300, 155), pt(132, 280), pt(510, 280)];
    else if (shape === 'right') triangle = [pt(205, 95), pt(205, 300), pt(495, 300)];
    else triangle = initial.slice();
    draw();
    board.animate('.aux, .highlight');
  };
}

export function transform({ board, controls, stats, signal }) {
  const o = pt(320, 200), initial = [pt(298, 125), pt(240, 190), pt(298, 250)];
  let triangle = initial.slice(), mode = 'rotate', angle = 90, scale = 1.5;
  function draw() {
    const map = p => {
      const d = sub(p, o);
      if (mode === 'rotate') return add(o, rotate(d, -radians(angle)));
      if (mode === 'mirror') return add(o, pt(-d.x, d.y));
      return add(o, mul(d, scale));
    };
    const image = triangle.map(map), a = area(triangle), b = area(image);
    board.draw(line(pt(o.x, 0), pt(o.x, H), 'aux') + line(pt(0, o.y), pt(W, o.y), 'aux') +
      polyline([triangle[0], o, image[0]], 'aux alt') + polygon(triangle) + polygon(image, 'image-shape') +
      point(o, 'O') + image.map((p, i) => point(p, `${'ABC'[i]}′`, { kind: 'highlight' })).join('') + vertices(triangle));
    const length = mode === 'scale' ? scale : 1;
    stats.innerHTML = metric('边长倍率', `${length.toFixed(2)} 倍`) + metric('面积倍率', a > 1e-7 ? `${(b / a).toFixed(2)} 倍` : '未定义（面积为 0）');
  }
  controls.innerHTML = `<div class="control-row">${button('旋转', 'rotate', 'aria-pressed="true"')}${button('反射', 'mirror', 'aria-pressed="false"')}${button('等比缩放', 'scale', 'aria-pressed="false"')}${button('复位', 'reset')}</div>
    <div class="parameter"></div><p class="lab-note">紫色是原图，橙色是变换后的像。拖动点或用方向键调整。</p>`;
  const parameter = controls.querySelector('.parameter');
  function renderParameter() {
    parameter.innerHTML = mode === 'rotate' ? slider('逆时针旋转', 'angle', angle, 0, 360, 5, '°') :
      mode === 'scale' ? slider('缩放倍数', 'scale', scale, .5, 2, .1, ' 倍') : '<p class="lab-note">以过 O 的竖直轴为镜面。</p>';
    for (const option of controls.querySelectorAll('[aria-pressed]')) option.setAttribute('aria-pressed', option.dataset.action === mode);
    draw();
  }
  dragPoints(board, (i, p) => {
    // Keep the entire image visible even at the largest available scale.
    const d = sub(p, o);
    const r = dist(p, o);
    triangle[i] = r > 82 ? add(o, mul(d, 82 / r)) : p;
    draw();
  });
  controls.addEventListener('input', event => {
    if (event.target.id === 'angle') angle = Number(event.target.value);
    else scale = clamp(Number(event.target.value), .5, 2);
    parameter.querySelector('output').value = event.target.id === 'angle' ? `${angle}°` : `${scale.toFixed(1)} 倍`;
    draw();
  }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'reset') { triangle = initial.slice(); angle = 90; scale = 1.5; }
    else mode = action;
    renderParameter();
  }, { signal });
  renderParameter();
  return (_, nextMode, value) => {
    mode = nextMode;
    if (nextMode === 'rotate' && value !== undefined) angle = value;
    if (nextMode === 'scale' && value !== undefined) scale = value;
    renderParameter();
    board.animate('.image-shape, .aux');
  };
}
