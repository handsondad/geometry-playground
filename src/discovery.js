import { pt, add, sub, mul, norm, dist, cross, rotate, hyperbolicAngles, geodesic, treeLevels, interiorAngle, cornerTile } from './math.js';
import { W, H, button, circle, line, metric, point, polygon, slider, text, xy, dragPoints } from './board.js';

const rad = n => n * Math.PI / 180;
const deg = n => n * 180 / Math.PI;
const setReadout = (input, value) => { input.parentElement.querySelector('output').value = value; };

export function fractalTree({ board, controls, stats, signal }) {
  const maxDepth = 8;
  const presets = { canopy: [28, 72, 6], fan: [55, 62, 5], fern: [16, 82, 8] };
  controls.innerHTML = slider('每侧分叉角', 'branch-angle', 28, 6, 70, 1, '°') +
    slider('子枝长度 / 母枝长度', 'branch-ratio', 72, 48, 85, 1, '%') +
    slider('迭代轮数', 'tree-depth', 6, 0, maxDepth) +
    `<div class="control-row">${button('树冠', 'canopy')}${button('扇形', 'fan')}${button('窄枝', 'fern')}</div>
    <p class="lab-note">试试保持轮数不变，只改角度：枝条的位置和数量，哪一个变了？</p>`;
  const inputs = [...controls.querySelectorAll('input')];
  function draw() {
    const [angle, ratio, depth] = inputs.map(el => Number(el.value));
    const levels = treeLevels(maxDepth, ratio / 100, rad(angle));
    const ends = levels.flat().map(b => b.end);
    const minX = Math.min(0, ...ends.map(p => p.x)), maxX = Math.max(0, ...ends.map(p => p.x));
    const minY = Math.min(0, ...ends.map(p => p.y)), maxY = Math.max(0, ...ends.map(p => p.y));
    const scale = Math.min((W - 92) / (maxX - minX), (H - 66) / (maxY - minY));
    const origin = pt(W / 2 - (maxX + minX) * scale / 2, H - 35 - maxY * scale);
    const map = p => add(origin, mul(p, scale));
    const art = levels.slice(0, depth + 1).map((branches, i) => {
      const d = branches.map(b => `M${xy(map(b.start))}L${xy(map(b.end))}`).join('');
      return `<path d="${d}" class="tree-branch ${i === depth && i > 0 ? 'tree-tips' : ''}" stroke-width="${Math.max(1.05, 7 * .76 ** i)}"/>`;
    }).join('');
    board.draw(art + point(origin));
    [angle + '°', ratio + '%', depth].forEach((value, i) => setReadout(inputs[i], value));
    stats.innerHTML = metric('本轮新长出的枝条', `${levels[depth].length} 根`) +
      metric('枝条总数（含树干）', `${levels.slice(0, depth + 1).reduce((sum, level) => sum + level.length, 0)} 根`);
  }
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!Object.hasOwn(presets, action)) return;
    presets[action].forEach((value, i) => { inputs[i].value = value; });
    draw();
  }, { signal });
  draw();
  return (_, preset) => {
    if (!Object.hasOwn(presets, preset)) return;
    presets[preset].forEach((value, i) => { inputs[i].value = value; });
    draw();
    board.animate('.tree-branch');
  };
}

export function tiling({ board, controls, stats, signal, notify }) {
  const center = pt(W / 2, H / 2), size = 86, start = -Math.PI / 2;
  const names = { 3: '正三角形', 4: '正方形', 5: '正五边形', 6: '正六边形' };
  const tiles = [];
  controls.innerHTML = `<div class="control-row" aria-label="放一块砖">${Object.entries(names).map(([id, name]) =>
    button(`${name} · ${interiorAngle(Number(id))}°`, id, `class="tile-key tile-${id}"`)).join('')}</div>
    <div class="control-row">${button('撤销上一块', 'undo')}${button('清空重来', 'reset')}</div>
    <p class="lab-note">点击一种砖就会沿上一块的边贴上。试试只用一种砖，再试混搭。</p>`;
  const occupied = () => tiles.reduce((sum, sides) => sum + interiorAngle(sides), 0);
  function draw() {
    let heading = start;
    const art = tiles.map(sides => {
      const pts = cornerTile(center, size, sides, heading);
      heading += rad(interiorAngle(sides));
      const label = mul(pts.reduce(add, pt(0, 0)), 1 / sides);
      return polygon(pts, `paving-tile tile-${sides}`) + text(add(label, pt(0, 5)), `${interiorAngle(sides)}°`, 'tile-label');
    }).join('');
    const used = occupied(), gap = 360 - used;
    const split = add(center, rotate(pt(size, 0), heading));
    const first = add(center, rotate(pt(size, 0), start));
    const gapMark = used > 0 && gap > 0 ? `<path d="M${xy(add(center, rotate(pt(37, 0), heading)))} A37 37 0 ${gap > 180 ? 1 : 0} 1 ${xy(add(center, rotate(pt(37, 0), start)))}" class="aux"/>` : '';
    board.draw(circle(center, size, 'aux') + art + gapMark + (gap ? line(center, first, 'aux') + line(center, split, 'result') : '') + point(center));
    stats.innerHTML = metric('已经拼上', `${used}°`) + metric('剩余角度', gap ? `${gap}°` : '0° · 拼满了！');
    controls.querySelector('[data-action="undo"]').disabled = tiles.length === 0;
  }
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'undo') tiles.pop();
    else if (action === 'reset') tiles.length = 0;
    else {
      const sides = Number(action), remaining = 360 - occupied(), needed = interiorAngle(sides);
      if (needed > remaining) {
        notify(remaining === 0 ? '已经拼满。撤销一块，或者清空后再试别的组合。' :
          `只剩 ${remaining}°，放入 ${needed}° 的砖会重叠。试试撤销一块。`);
        return;
      }
      tiles.push(sides);
    }
    notify(occupied() === 360 ? '正好拼满一个顶点！还能找到另一种组合吗？' : '');
    draw();
  }, { signal });
  draw();
  return (_, pattern) => {
    tiles.length = 0;
    tiles.push(...pattern);
    notify(occupied() === 360 ? '正好拼满一个顶点！还能找到另一种组合吗？' : '');
    draw();
    board.animate('.paving-tile, .aux');
  };
}

export function hyperbolicTriangle({ board, controls, stats, signal }) {
  const center = pt(W / 2, H / 2), radius = 158;
  const presets = {
    reset: [pt(0, -.62), pt(-.58, .38), pt(.61, .32)],
    small: [pt(0, -.18), pt(-.16, .1), pt(.16, .1)],
    large: [pt(0, -.9), pt(-.8, .45), pt(.8, .45)],
  };
  let vertices = presets.reset.slice();
  const map = p => add(center, mul(p, radius));
  const edge = (a, b) => {
    if (dist(a, b) < 1e-8) return '';
    const model = geodesic(a, mul(sub(b, a), 1 / dist(a, b)));
    if (!model.center) return `L${xy(map(b))}`;
    const r = model.radius * radius;
    const sweep = cross(sub(a, model.center), sub(b, model.center)) > 0 ? 1 : 0;
    return `A${r} ${r} 0 0 ${sweep} ${xy(map(b))}`;
  };
  controls.innerHTML = `<div class="control-row">${button('试小三角形', 'small')}${button('试大三角形', 'large')}${button('复位顶点', 'reset')}</div>
    <p class="lab-note">拖动顶点，或选中后用方向键移动。圆盘的边界不属于双曲平面。</p>`;
  function draw() {
    const angles = hyperbolicAngles(vertices);
    const d = `M${xy(map(vertices[0]))}${vertices.map((p, i) => edge(p, vertices[(i + 1) % 3])).join('')}Z`;
    board.draw(circle(center, radius, 'globe') + `<path d="${d}" class="${angles ? 'shape' : 'aux'}"/>` + circle(center, radius, 'rim') +
      vertices.map((p, i) => point(map(p), 'ABC'[i], { key: i, kind: 'draggable' })).join(''));
    if (!angles) {
      stats.innerHTML = metric('内角和', '未定义（退化）') + metric('角亏', '—');
      return;
    }
    const sum = deg(angles.reduce((total, a) => total + a, 0));
    stats.innerHTML = metric('内角和', `${sum.toFixed(2)}°`) + metric('角亏：180° − 内角和', `${(180 - sum).toFixed(2)}°`) +
      angles.map((a, i) => metric(`∠${'ABC'[i]}`, `${deg(a).toFixed(2)}°`)).join('');
  }
  dragPoints(board, (i, p) => {
    const local = mul(sub(p, center), 1 / radius), r = norm(local);
    vertices[i] = r > .94 ? mul(local, .94 / r) : local;
    draw();
  });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (Object.hasOwn(presets, action)) { vertices = presets[action].slice(); draw(); }
  }, { signal });
  draw();
  return (_, preset) => {
    if (!Object.hasOwn(presets, preset)) return;
    vertices = presets[preset].slice();
    draw();
    board.animate('.shape');
  };
}
