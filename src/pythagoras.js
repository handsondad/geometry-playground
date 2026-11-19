import { button, line, metric, point, polygon, slider, text } from './board.js';
import { add, dist, mul, pt, pythagorasDissection, pythagorasFigure, sub } from './math.js';
import { proofPanel } from './proof-panel.js';

const proofSteps = [
  ['在三条边上作正方形。', '∠A 是直角，因此 BC 是斜边。三个正方形的面积分别是 AB²、AC² 和 BC²。'],
  ['从 A 向下画垂线，分开大正方形。', '过 A 向 BC 作垂线，并延长到大正方形的对边。现在大正方形分成了两个长方形。'],
  ['左边的正方形和长方形等积。', '两个高亮三角形各有两条等长的对应边，夹角都是 ∠ABC + 90°，所以全等。一个和左边正方形同底同高，另一个和左边长方形同底同高；两块四边形的面积都是相应三角形的两倍。'],
  ['右边也一样，两块长方形拼成大正方形。', '在右侧重复同样的全等论证，右边正方形也与对应长方形等积。把两个等积关系加起来，得到 AB² + AC² = BC²。'],
];

const rad = n => n * Math.PI / 180;
const side = 252, left = pt(35, 65), right = pt(353, 65);
const place = (points, origin) => points.map(p => add(p, origin));
const mid = points => mul(points.reduce(add, pt(0, 0)), 1 / points.length);
const border = [pt(0, 0), pt(side, 0), pt(side, side), pt(0, side)];

export function pythagoras({ board, controls, stats, signal, guide, notify }) {
  let step = 0, mode = 'puzzle', selected, hinted, drag, layout;
  const placed = new Set();
  const { svg } = board;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  controls.innerHTML = `<div class="control-row" role="group" aria-label="证明方式">
      ${button('动手切拼', 'puzzle', 'aria-pressed="true"')}
      ${button('欧几里得原证', 'classic', 'aria-pressed="false"')}
    </div>
    ${slider('改变直角三角形：∠B', 'pythagoras-angle', 37, 27, 63, 1, '°')}
    <div class="control-row" data-puzzle-tools>
      ${button('移入下一块', 'move-piece', 'class="primary"')}
      ${button('提示', 'hint-piece')}${button('重新拼', 'reset-piece')}
    </div>
    <details class="dissect-why" hidden>
      <summary>为什么中间留下的是正方形？</summary>
      <p>把直角边记为 a、b，斜边记为 c。左边空出来的四条边都是斜边，长度都是 c。每个空角旁边的两个锐角加起来是 90°，所以空角也是 90°。四条边一样长，四个角都是直角，中间这块就是正方形。</p>
    </details>`;
  const get = action => controls.querySelector(`[data-action="${action}"]`);
  const input = controls.querySelector('input'), next = get('move-piece'), hint = get('hint-piece');
  const intro = '把左边四块三角形移到右边。可以拖动，也可以先点一块，再点右边的虚线槽。';
  const result = '拼成了！同样大的正方形，拿掉同样的四块三角形，剩下的面积相等：a² + b² = c²。';
  const update = proofPanel(guide, proofSteps, reveal, signal);

  function drawPuzzle() {
    const solved = placed.size === 4;
    const { pieces, center, corners } = layout;
    const source = (piece, i, offset = left) => `<g data-piece="${i}" class="dissect-piece part-${i}${selected === i ? ' is-selected' : ''}">` +
      polygon(place(piece.from, offset), 'dissect-chip') + text(add(mid(piece.from), offset), i + 1, 'dissect-number') + '</g>';
    const art = [
      '<rect class="dissect-backdrop" width="640" height="400"/>',
      text(pt(161, 41), '原来的拼法', 'dissect-heading'),
      text(pt(479, 41), '换一种拼法', 'dissect-heading'),
      text(pt(320, 191), '→', 'dissect-equation'),
      polygon(place(border, left), 'dissect-frame'), polygon(place(border, right), 'dissect-frame'),
      polygon(place(center, left), 'dissect-leftover dissect-center'),
      text(add(mid(center), left), 'c²', 'dissect-area'),
      ...corners.map((corner, i) => polygon(place(corner, right), `dissect-leftover ${i ? 'dissect-b' : 'dissect-a'}`) +
        text(add(mid(corner), right), i ? 'b²' : 'a²', 'dissect-area')),
      ...pieces.map((piece, i) => placed.has(i)
        ? `<g class="dissect-piece part-${i} is-placed" data-placed="${i}">${polygon(place(piece.to, right), 'dissect-chip')}${text(add(mid(piece.to), right), i + 1, 'dissect-number')}</g>`
        : `<g data-slot="${i}">${polygon(place(piece.to, right), `dissect-slot${hinted === i ? ` part-${i} is-hinted` : ''}`)}</g>`),
      ...pieces.map((piece, i) => placed.has(i) || (drag?.moving && drag.id === i) ? '' : source(piece, i)),
      drag?.moving ? source(pieces[drag.id], drag.id, add(left, drag.offset)) : '',
      text(pt(320, 365), solved ? 'a² + b² = c²' : '两个大正方形同样大', solved ? 'dissect-equation' : 'dissect-label'),
    ];
    board.draw(art.join(''));
    controls.querySelector('.dissect-why').hidden = !solved;
    next.disabled = hint.disabled = solved;
    next.textContent = selected === undefined ? '移入下一块' : '移入选中块';
    stats.innerHTML = metric('已移入', `${placed.size} / 4`) + metric('比较留下的面积', solved ? 'a² + b² = c²' : '拼完就能比较');
  }

  function drawClassic() {
    const b = pt(244, 224), c = pt(396, 224), angle = rad(Number(input.value));
    const f = pythagorasFigure(b, c, angle);
    const highlight = step >= 2 ? step - 2 : -1;
    const squares = polygon(f.left, 'proof-piece proof-left') + polygon(f.right, 'proof-piece proof-right') + polygon(f.hypotenuse, 'proof-outline');
    const rectangles = step ? f.rectangles.map((p, i) =>
      polygon(p, `proof-piece proof-${i === 0 ? 'left' : 'right'}${highlight === i ? ' proof-active' : ''}`)).join('') + line(f.a, f.g, 'aux') : '';
    const bridge = highlight < 0 ? '' : (highlight ? f.rightBridge : f.leftBridge).map(p => polygon(p, 'proof-bridge')).join('');
    const u = mul(sub(b, f.a), 12 / dist(f.a, b)), v = mul(sub(c, f.a), 12 / dist(f.a, c));
    const rightAngle = polygon([f.a, add(f.a, u), add(add(f.a, u), v), add(f.a, v)], 'proof-outline');
    board.draw(squares + rectangles + polygon([f.a, b, c], 'proof-outline') + bridge + rightAngle +
      point(f.a, 'A') + point(b, 'B') + point(c, 'C'));
    const leftArea = 100 * Math.cos(angle) ** 2;
    stats.innerHTML = metric('AB² + AC²（相对面积）', `${leftArea.toFixed(2)} + ${(100 - leftArea).toFixed(2)}`) +
      metric('BC²（定为 100）', '100.00');
    update(step);
  }

  function draw() {
    const puzzle = mode === 'puzzle';
    guide.hidden = puzzle;
    controls.querySelector('[data-puzzle-tools]').hidden = !puzzle;
    if (!puzzle) controls.querySelector('.dissect-why').hidden = true;
    get('puzzle').setAttribute('aria-pressed', puzzle);
    get('classic').setAttribute('aria-pressed', !puzzle);
    controls.querySelector('output').value = `${input.value}°`;
    if (puzzle) drawPuzzle();
    else drawClassic();
  }

  function reveal(index) {
    mode = 'classic'; step = index; drag = undefined;
    draw(); notify('这里是不移动纸片的另一种证明。用「动手切拼」可回到刚才的进度。');
    board.animate('.proof-bridge, .proof-active, .proof-piece, .aux');
  }

  function land(i, origin = left) {
    placed.add(i);
    drag = selected = hinted = undefined;
    drawPuzzle();
    if (!motion.matches) {
      const { from, to } = layout.pieces[i];
      const delta = sub(add(from[0], origin), add(to[0], right));
      svg.querySelector(`[data-placed="${i}"]`).animate(
        [{ transform: `translate(${delta.x}px, ${delta.y}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 280, easing: 'ease-out' },
      );
    }
    notify(placed.size === 4 ? result : `第 ${i + 1} 块只平移，没有拉长或压扁，面积不变。`);
  }

  function cancelDrag() {
    if (!drag) return;
    const { pointer } = drag;
    drag = undefined;
    if (svg.hasPointerCapture(pointer)) svg.releasePointerCapture(pointer);
  }
  const nextId = () => selected ?? layout.pieces.findIndex((_, i) => !placed.has(i));
  controls.addEventListener('input', () => {
    cancelDrag();
    layout = pythagorasDissection(side, rad(Number(input.value)));
    draw();
  }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    cancelDrag();
    if (action === 'classic') reveal(step);
    else if (action === 'puzzle') { mode = 'puzzle'; draw(); notify(placed.size === 4 ? result : intro); }
    else if (action === 'move-piece' && placed.size < 4) land(nextId());
    else if (action === 'hint-piece' && placed.size < 4) {
      selected = hinted = nextId(); drawPuzzle();
      notify(`右边亮起的虚线槽与第 ${selected + 1} 块形状、朝向相同。`);
    } else if (action === 'reset-piece') {
      placed.clear(); selected = hinted = undefined; drawPuzzle(); notify(intro);
    }
  }, { signal });

  svg.addEventListener('pointerdown', event => {
    if (mode !== 'puzzle' || event.button !== 0 || drag) return;
    const slot = event.target.closest('[data-slot]');
    if (slot && selected !== undefined) {
      if (Number(slot.dataset.slot) === selected) land(selected);
      else notify('这块的朝向和槽不一样。试另一个，或者点「提示」。');
      return;
    }
    const piece = event.target.closest('[data-piece]');
    if (!piece) return;
    event.preventDefault();
    const id = Number(piece.dataset.piece);
    drag = { id, pointer: event.pointerId, start: board.coords(event), offset: pt(0, 0), moving: false };
    selected = id; hinted = undefined;
    svg.setPointerCapture(event.pointerId);
    drawPuzzle();
  }, { signal });
  svg.addEventListener('pointermove', event => {
    if (drag?.pointer !== event.pointerId) return;
    drag.offset = sub(board.coords(event), drag.start);
    if (drag.moving || (drag.moving = Math.hypot(drag.offset.x, drag.offset.y) > 8)) drawPuzzle();
  }, { signal });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(type, event => {
      if (drag?.pointer !== event.pointerId) return;
      const { id, start } = drag;
      drag = undefined;
      if (type === 'pointerup') {
        const position = board.coords(event), offset = sub(position, start);
        if (dist(position, start) <= 8) {
          notify(`选中了第 ${id + 1} 块。点右边和它朝向相同的槽。`);
          drawPuzzle();
          return;
        }
        const { from, to } = layout.pieces[id];
        const origin = add(left, offset);
        if (dist(add(from[0], origin), add(to[0], right)) <= 32 ||
            dist(position, add(mid(to), right)) <= 23) { land(id, origin); return; }
        notify('还没对齐。也可以点右边的虚线槽来放置这一块。');
      }
      drawPuzzle();
    }, { signal });
  }
  layout = pythagorasDissection(side, rad(Number(input.value)));
  draw();
  notify(intro);
  return (_, index) => reveal(index);
}
