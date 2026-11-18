import { pt, add, sub, mul, norm, dist, cross, rotate, hyperbolicAngles, geodesic, treeLevels, interiorAngle, cornerTile, pythagorasFigure } from './math.js';
import { W, H, button, circle, line, metric, point, polygon, slider, text, xy, dragPoints } from './board.js';
import { proofPanel } from './proof-panel.js';

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

const proofSteps = [
  ['在三条边上作正方形。', '∠A 是直角，因此 BC 是斜边。三个正方形的面积分别是 AB²、AC² 和 BC²。'],
  ['从 A 向下画垂线，分开大正方形。', '过 A 向 BC 作垂线，并延长到大正方形的对边。现在大正方形分成了两个长方形。'],
  ['左边的正方形和长方形等积。', '两个高亮三角形各有两条等长的对应边，夹角都是 ∠ABC + 90°，所以全等。一个和左边正方形同底同高，另一个和左边长方形同底同高；两块四边形的面积都是相应三角形的两倍。'],
  ['右边也一样，两块长方形拼成大正方形。', '在右侧重复同样的全等论证，右边正方形也与对应长方形等积。把两个等积关系相加，得到 AB² + AC² = BC²。'],
];

export function pythagoras({ board, controls, stats, signal, guide }) {
  let step = 0;
  const b = pt(244, 224), c = pt(396, 224);
  controls.innerHTML = slider('改变直角三角形：∠B', 'pythagoras-angle', 42, 27, 63, 1, '°');
  const input = controls.querySelector('input');
  const reveal = i => { step = i; draw(); board.animate('.proof-bridge, .proof-active, .proof-piece, .aux'); };
  const update = proofPanel(guide, proofSteps, reveal, signal);
  function draw() {
    const angle = Number(input.value);
    const f = pythagorasFigure(b, c, rad(angle));
    const highlight = step >= 2 ? step - 2 : -1;
    const aArt = polygon(f.left, 'proof-piece proof-left') + polygon(f.right, 'proof-piece proof-right') + polygon(f.hypotenuse, 'proof-outline');
    const rectangles = step ? f.rectangles.map((p, i) =>
      polygon(p, `proof-piece proof-${i === 0 ? 'left' : 'right'}${highlight === i ? ' proof-active' : ''}`)).join('') + line(f.a, f.g, 'aux') : '';
    const bridge = highlight < 0 ? '' : (highlight ? f.rightBridge : f.leftBridge).map(p => polygon(p, 'proof-bridge')).join('');
    const u = mul(sub(b, f.a), 12 / dist(f.a, b)), v = mul(sub(c, f.a), 12 / dist(f.a, c));
    const rightAngle = polygon([f.a, add(f.a, u), add(add(f.a, u), v), add(f.a, v)], 'proof-outline');
    board.draw(aArt + rectangles + polygon([f.a, b, c], 'proof-outline') + bridge + rightAngle +
      point(f.a, 'A') + point(b, 'B') + point(c, 'C'));
    setReadout(input, `${angle}°`);
    const total = 100, left = total * Math.cos(rad(angle)) ** 2, whole = n => n.toFixed(2);
    stats.innerHTML = metric('AB² + AC²（相对面积）', `${whole(left)} + ${whole(total - left)}`) +
      metric('BC²（定为 100）', whole(total));
    update(step);
  }
  controls.addEventListener('input', draw, { signal });
  draw();
  return (_, index) => reveal(index);
}
