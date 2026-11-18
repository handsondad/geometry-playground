import { pt, add, sub, mul, mix, norm, dist, cross, clamp, intersections } from './math.js';
import { W, H, button, circle, infinite, line, metric, point, dragPoints, polygon } from './board.js';
import { proofPanel } from './proof-panel.js';

const makeCircle = (c, through) => ({ c, r: dist(c, through) });
const makeLine = (a, b) => ({ a, b });
const labeled = (p, name) => ({ ...p, name });
const svgObject = (o, tone) => o.r === undefined ? infinite(o.a, o.b, tone) : circle(o.c, o.r, tone);
const pair = (a, b, cls = 'result') => line(a, b, cls);
const triangle = (a, b, c) => polygon([a, b, c], 'proof-bridge');

const vertices = {
  'bisect-angle': [{ name: 'A', start: pt(175, 200), box: [138, 220, 160, 240] },
    { name: 'B', start: pt(465, 62), box: [385, 540, 40, 142] },
    { name: 'C', start: pt(465, 338), box: [385, 540, 259, 355] }],
  'perpendicular-on': [{ name: 'C', start: pt(320, 242), box: [217, 423, 242, 242] }],
  'perpendicular-off': [{ name: 'C', start: pt(318, 136), box: [224, 416, 106, 170] }],
  segment: [{ name: 'A', start: pt(230, 200), box: [226, 280, 170, 230] },
    { name: 'B', start: pt(410, 200), box: [360, 414, 170, 230] }],
};

function perpendicular(id, c) {
  const a = pt(114, 242), b = pt(526, 242);
  const base = line(a, b), objects = [makeLine(a, b)];
  const given = [labeled(a, 'A'), labeled(b, 'B'), labeled(c, 'C')];
  if (id === 'perpendicular-on') {
    const d = pt(c.x - 55, c.y), e = pt(c.x + 55, c.y), u = makeCircle(d, e), v = makeCircle(e, d);
    const options = intersections(u, v), f = options.find(p => p.y < c.y);
    return { given, base, objects, steps: [
      ['在直线上取等距点 D、E', '在 C 的两侧截取等长线段 CD、CE。', circle(c, 55), [[d, 'D'], [e, 'E']]],
      ['作 DEF 所需的第一个圆', '以 D 为圆心，以 DE 为半径。', svgObject(u, 'aux')],
      ['画第二个圆', '以 E 为圆心，圆规保持相同开口。', svgObject(v, 'aux alt')],
      ['选直线上方交点 F', '两圆交点都能作垂线。这次取上方交点，便于观察。', '', [[f, 'F']], options.map(p => [p, p === f ? 'F' : 'F′', p === f])],
      ['连接 C、F', 'CF 与原直线形成两个相邻直角。', pair(d, f, 'aux') + pair(e, f, 'aux') + pair(c, f)],
    ], proof: [
      ['先找等长线段', '同圆给出 CD = CE；等边三角形给出 DF = EF。', () => pair(d, c) + pair(c, e) + pair(d, f) + pair(e, f)],
      ['比较 △DCF 与 △ECF', 'CF 是公共边，按三边全等，两侧相邻角相等。', () => triangle(d, c, f) + triangle(e, c, f)],
      ['相邻等角都是直角', '两角合成平角，大小又相同，因此 ∠DCF = ∠FCE = 90°。', () => pair(c, f) + pair(d, e)],
    ] };
  }
  const d = pt(c.x, 270), u = makeCircle(c, d);
  const [e, g] = intersections(objects[0], u).sort((p, q) => p.x - q.x);
  const h = mix(e, g);
  return { given, base, objects, steps: [
    ['在线的另一侧取 D', 'D 与 C 在 AB 的不同侧。', '', [[d, 'D']]],
    ['画圆截取弦 EG', '以 C 为圆心、CD 为半径画圆，圆与 AB 相交于 E、G。', svgObject(u, 'aux'), [[e, 'E'], [g, 'G']]],
    ['按命题 10 平分 EG', '先使用已学的尺规构造确定弦中点 H。右侧可打开命题 10 复习操作。', pair(e, g, 'result'), [[h, 'H']]],
    ['连接 C、H', 'H 就是从 C 向 AB 作垂线的垂足。', pair(c, e, 'aux') + pair(c, g, 'aux') + pair(c, h)],
  ], proof: [
    ['标出半径与半弦', 'CE、CG 是同圆半径；H 是中点，所以 EH = HG。', () => pair(c, e) + pair(c, g) + pair(e, g)],
    ['用公共边 CH 证明全等', '△EHC 与 △GHC 的三条对应边分别相等。', () => triangle(e, h, c) + triangle(g, h, c)],
    ['垂足处出现两个直角', '全等给出两相邻角相等，它们相加为平角，所以 CH ⟂ AB。', () => pair(c, h) + pair(e, g)],
  ] };
}

function setup(id, supplied) {
  if (id.startsWith('perpendicular-')) return perpendicular(id, supplied[0]);
  if (id === 'bisect-angle') {
    const [a, b, c] = supplied, radius = 130;
    const along = q => add(a, mul(sub(q, a), radius / norm(sub(q, a))));
    const d = along(b), e = along(c);
    const u = makeCircle(d, e), v = makeCircle(e, d);
    const side = q => cross(sub(e, d), sub(q, d));
    const candidates = intersections(u, v), p = candidates.find(q => side(q) * side(a) < 0);
    return {
      given: [labeled(a, 'A'), labeled(b, 'B'), labeled(c, 'C')],
      objects: [makeLine(a, b), makeLine(a, c)],
      base: line(a, b) + line(a, c),
      steps: [
        ['取等距点 D、E', '以 A 为圆心画圆，在两条边上截出 D、E。', circle(a, radius), [[d, 'D'], [e, 'E']]],
        ['以 D 为圆心画圆', '圆规张开到 DE，第一只脚放在 D。', svgObject(u, 'aux')],
        ['以 E 为圆心画圆', '保持开口不变，把第一只脚放在 E。', svgObject(v, 'aux alt')],
        ['选取交点 P', '选 DE 另一侧（远离 A）的交点，作等边三角形 DEP。', '', [[p, 'P']], candidates.map(x => [x, x === p ? 'P' : 'P′', x === p])],
        ['连接 A、P', 'AP 把 ∠BAC 分成大小相等的两个角。', line(d, p, 'aux') + line(e, p, 'aux') + line(a, p, 'result')],
      ],
      proof: [
        ['标出两组相等的边', 'AD = AE，DP = EP；这些长度由画圆确定。', () => pair(a, d) + pair(a, e) + pair(d, p) + pair(e, p)],
        ['比较两个三角形', 'AP 是公共边，按命题 8（三边对应相等），△ADP 与 △AEP 的夹角 ∠DAP、∠PAE 相等。', () => triangle(a, d, p) + triangle(a, e, p)],
      ],
    };
  }
  const midpoint = id === 'midpoint';
  const [a, b] = supplied;
  const u = makeCircle(a, b), v = makeCircle(b, a);
  const candidates = intersections(u, v).sort((p, q) => p.y - q.y);
  const [c, p] = candidates, base = makeLine(a, b), bisector = makeLine(c, p);
  const [m] = intersections(base, bisector);
  return {
    given: [labeled(a, 'A'), labeled(b, 'B')],
    objects: [base],
    base: line(a, b),
    steps: [
      ['以 A 为圆心画圆', '把圆规开到 AB，以 A 为圆心画圆。', svgObject(u, 'aux')],
      ['以 B 为圆心画圆', '保持开口不变，以 B 为圆心画第二个圆。', svgObject(v, 'aux alt')],
      ['取交点 C', midpoint ? '选上方交点为 C，给下方交点 P 留位置，以便下一步平分顶角。' : '两个交点都能作顶点，任选其一。', '', [[c, 'C']], candidates.map(x => [x, 'C', !midpoint || x === c])],
      ['连接 AC 和 BC', 'C 在两个圆上。连接 AC 和 BC，就得到等边三角形 ABC。', ([q]) => line(a, q, 'result') + line(b, q, 'result')],
      ...(midpoint ? [
        ['取另一个交点 P', '平分 ∠ACB：CA = CB，所以直接在两条边上取 A、B。前面画的两个圆正好能用来作等边三角形 ABP。', line(a, p, 'aux') + line(b, p, 'aux'), [[p, 'P']]],
        ['连接 C、P，得到中点 M', 'CP 是顶角平分线，它与 AB 的交点 M 就是中点。', line(c, p, 'result'), [[m, 'M']]],
      ] : []),
    ],
    proof: midpoint ? [
      ['先作等边三角形 ABC', '命题 1 保证 CA = CB；命题 9 将顶角平分。', () => pair(c, a) + pair(c, b) + pair(c, m)],
      ['比较 △ACM 与 △BCM', 'CM 是公共边，两组对应边和它们夹的角分别相等。按命题 4，AM = BM。', () => triangle(a, c, m) + triangle(b, c, m)],
    ] : [
      ['AC 等于 AB', 'C 在以 A 为圆心的圆上，AC 与 AB 都是这个圆的半径。', ([q]) => circle(a, u.r, 'result') + pair(a, q) + pair(a, b)],
      ['BC 也等于 AB', 'C 同时也是以 B 为圆心的圆上的点，BC 与 BA 都是第二个圆的半径。', ([q]) => circle(b, v.r, 'result') + pair(b, q) + pair(a, b)],
      ['三边相等', 'AC 和 BC 都等于 AB，因此 AC = BC，得到等边三角形。', ([q]) => triangle(a, b, q)],
    ],
  };
}

export function construction({ board, controls, stats, lesson, signal, notify, guide }) {
  const handles = vertices[lesson.id] ?? vertices.segment;
  const supplied = handles.map(p => p.start);
  let model = setup(lesson.id, supplied);
  let freeModel = model;
  let step = 0, choice = -1, free = false, tool = 'point', anchor = null, proving = -1, preview;
  let points = [...model.given], objects = [], undo = [];
  const updateProof = proofPanel(guide, model.proof, i => {
    proving = i; free = false; preview = undefined; notify(''); draw(); board.animate('.proof-highlight > *');
  }, signal);

  function draw() {
    const activeProof = preview?.kind === 'proof' ? preview.index : preview ? -1 : proving;
    const activeStep = activeProof >= 0 ? model.steps.length : preview?.index ?? step;
    const visibleFree = free && !preview;
    const guides = model.steps.slice(0, activeStep);
    const current = model.steps[step], candidates = !free && proving < 0 && current?.[4];
    const previewCandidates = preview?.kind === 'build' && model.steps[activeStep]?.[4];
    const options = model.steps.find(item => item[4])?.[4];
    const selected = (options?.[choice] ?? options?.find(item => item[2]))?.[0];
    updateProof(activeProof);
    board.draw((visibleFree ? freeModel : model).base + (visibleFree
      ? objects.map(o => svgObject(o, o.r === undefined ? 'result' : 'aux')).join('') +
        crossings().map(p => circle(p, 2.8, 'crossing')).join('') +
        points.map((p, i) => point(p, p.name, { key: i, kind: p === anchor ? 'selected' : 'point' })).join('')
      : guides.map(([, , art], i) => `<g class="${i === guides.length - 1 ? 'latest-ink' : ''}">${typeof art === 'function' ? art([selected]) : art}</g>`).join('') +
        (activeProof >= 0 ? `<g class="proof-highlight">${model.proof[activeProof][2]([selected])}</g>` : '') +
        model.given.map(p => {
          const index = handles.findIndex(h => h.name === p.name);
          return point(p, p.name, index < 0 ? {} : { key: `given-${index}`, kind: 'draggable' });
        }).join('') +
        guides.flatMap(([, , , ps, options]) => options ? [[selected, ps[0][1]]] : ps || []).map(([p, name]) => point(p, name)).join('') +
        (previewCandidates ? previewCandidates.map(([p, name, valid]) => point(p, name, { kind: valid ? 'highlight' : 'point' })).join('') :
          !preview && candidates ? candidates.map(([p, name], i) => point(p, candidates.every(item => item[1] === name) ? `${name}${i + 1}` : name, { key: i, kind: 'candidate' })).join('') : '')));
    const option = (label, id) => button(label, `tool-${id}`, `aria-pressed="${tool === id}"`);
    controls.innerHTML = `<div class="control-row mode-row" aria-label="尺规模式">
      ${button(preview ? '回到亲手作图' : '引导作图', 'guided', `aria-pressed="${!preview && !free && proving < 0}"`)}${button('自由作图', 'free', `aria-pressed="${visibleFree}"`)}
    </div>` + (preview ? '<p class="lab-note">现在是对话演示。可以拖动已知点验证；回到亲手作图会接着你原来的步骤。</p>' :
      visibleFree ? `<div class="control-row">${option('取点', 'point')}${option('直尺', 'line')}${option('圆规', 'circle')}${button('撤销', 'undo', undo.length ? '' : 'disabled')}${button('清空', 'reset')}</div>
      <p class="lab-note">${{point: '点按画板放置新点；靠近标出的交点时会自动吸附。', line: '依次选择两个不同的点，过它们画一条直线。', circle: '先选择圆心，再选择圆上另一点。'}[tool]}${anchor ? ` 已选 ${anchor.name}。` : ''}</p>` : proving >= 0 ?
      '<p class="lab-note">正在读证明。拖动已知点，验证图形改变后证明是否仍然成立。</p>' :
      `<div class="steps" aria-label="作图步骤">${model.steps.map((item, i) => `<span class="${i < step ? 'done' : i === step ? 'current' : ''}" ${i === step ? 'aria-current="step"' : ''} title="${item[0]}">${i + 1}</span>`).join('')}</div>
      <p class="lab-note"><strong>${current?.[0] ?? '作图完成'}</strong> · ${current?.[1] ?? '对照图形，试着解释为什么结果一定成立。'}</p>
      <div class="control-row">${button('上一步', 'back', step ? '' : 'disabled')}${button(candidates ? '请在图中选择' : current ? '执行这一步 →' : '从头再画', current ? 'next' : 'reset', candidates ? 'disabled' : 'class="primary"')}${button('复位已知点', 'reset-givens')}</div>
      <p class="lab-note">拖动标出的已知点，或用方向键移动；已经画出的图形会随之变化。</p>`);
    stats.innerHTML = preview ? metric('对话演示', preview.kind === 'proof' ? '检验结论' : '画出辅助图形') + metric('亲手作图进度保留', `${step} / ${model.steps.length}`) :
      visibleFree ? metric('已取点', points.length) + metric('已画图形', objects.length)
      : proving >= 0 ? metric('正在读证明', `${proving + 1} / ${model.proof.length}`) + metric('作图进度保留', `${step} / ${model.steps.length}`)
      : metric('作图进度', `${step} / ${model.steps.length}`) + metric('工具', '直尺 · 圆规');
  }

  function crossings() {
    const all = [...freeModel.objects, ...objects];
    return all.flatMap((a, i) => all.slice(i + 1).flatMap(b => intersections(a, b)))
      .filter(p => p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H && points.every(q => dist(p, q) > .1));
  }
  function select(index, position) {
    if (preview) return;
    if (!free) {
      const candidate = proving < 0 && model.steps[step]?.[4]?.[index];
      if (!candidate) return;
      if (!candidate[2]) { notify('再试一次：请按这一步的提示选择交点。'); return; }
      choice = Number(index);
      step++;
    } else if (tool === 'point') {
      if (!position || points.some(q => dist(position, q) < 8)) return;
      const snap = crossings().filter(q => dist(position, q) < 13).sort((a, b) => dist(a, position) - dist(b, position))[0];
      undo.push('point');
      points.push(labeled(snap ?? position, `P${points.length - model.given.length + 1}`));
    } else {
      const p = points[index];
      if (!p) { notify('请先选中画板上的已有点。'); return; }
      if (!anchor) anchor = p;
      else if (anchor !== p) {
        objects.push(tool === 'line' ? makeLine(anchor, p) : makeCircle(anchor, p));
        undo.push('object');
        anchor = null;
      } else {
        notify('请选择不同的第二个点。');
        return;
      }
    }
    notify('');
    draw();
    if (!free) board.animate('.latest-ink > *');
  }
  board.svg.addEventListener('click', event => {
    const handle = event.target.closest('[data-point]');
    select(handle?.dataset.point, handle ? undefined : board.coords(event));
  });
  board.svg.addEventListener('keydown', event => {
    if (!event.target.matches('[data-point]:not([data-point^="given-"])') || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    select(event.target.dataset.point);
    (board.svg.querySelector('.candidate[data-point]') ?? controls.querySelector('[data-action="next"]:enabled') ??
      board.svg.querySelector('[data-point]') ?? controls.querySelector('[aria-pressed="true"]')).focus();
  });
  dragPoints(board, (key, p) => {
    const i = Number(key.slice(6)), [minX, maxX, minY, maxY] = handles[i].box;
    supplied[i] = pt(clamp(p.x, minX, maxX), clamp(p.y, minY, maxY));
    model = setup(lesson.id, supplied);
    draw();
  }, '[data-point^="given-"]');
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'guided' || action === 'free') {
      free = action === 'free'; proving = -1; preview = undefined;
      if (free) {
        anchor = null;
        if (!undo.length) { freeModel = model; points = [...freeModel.given]; }
      }
    }
    if (action === 'next') step++;
    if (action === 'back') {
      step--;
      if (model.steps[step][4]) choice = -1;
    }
    if (action.startsWith('tool-')) { tool = action.slice(5); anchor = null; }
    if (action === 'undo') {
      (undo.pop() === 'point' ? points : objects).pop();
      anchor = null;
    }
    if (action === 'reset') {
      if (free) { freeModel = model; points = [...freeModel.given]; objects = []; undo = []; anchor = null; }
      else { step = 0; choice = -1; }
    }
    if (action === 'reset-givens') {
      handles.forEach((item, i) => { supplied[i] = item.start; });
      model = setup(lesson.id, supplied);
    }
    notify('');
    draw();
    if (action === 'next') board.animate('.latest-ink > *');
    if (action === 'next' && model.steps[step]?.[4]) board.svg.querySelector('.candidate[data-point]').focus();
    else (controls.querySelector(`[data-action="${action}"]:enabled`) ?? controls.querySelector('[data-action="next"]:enabled, [aria-pressed="true"]')).focus();
  }, { signal });
  draw();
  return (kind, index) => {
    preview = { kind, index };
    notify('');
    draw();
    board.animate(kind === 'proof' ? '.proof-highlight > *' :
      board.svg.querySelector('.latest-ink > *') ? '.latest-ink > *' : '.aux, .result');
  };
}
