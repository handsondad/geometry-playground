import { add, angleAt, clamp, dist, mul, norm, pt, sub } from '../math.js';
import { angleArc, button, circle, dragPoints, line, metric, point, polygon, slider, text } from '../board.js';

const deg = radians => radians * 180 / Math.PI;
const unit = v => mul(v, 1 / norm(v));

export function thalesLab({ board, controls, stats, signal }) {
  const O = pt(320, 222), R = 158, A = pt(O.x - R, O.y), B = pt(O.x + R, O.y);
  const places = { inside: 70, on: 100, outside: 135 };
  let heading = 62, split = false;
  controls.innerHTML = slider('C 离圆心多远（半径的百分之几）', 'thales-ratio', 100, 50, 150, 1, '%') +
    `<div class="control-row">${button('圆内', 'inside', 'aria-pressed="false"')}${button('圆上', 'on', 'aria-pressed="false"')}${button('圆外', 'outside', 'aria-pressed="false"')}</div>
    <div class="control-row">${button('连半径 OC，拆成两半', 'thales-split', 'aria-pressed="false"')}</div>
    <p class="lab-note">拖动 C 沿着圆走一圈，看 ∠ACB 变不变；再把 C 拉进圆里、推到圆外比一比。</p>`;
  const input = controls.querySelector('input');

  function draw() {
    const ratio = Number(input.value) / 100, turn = heading * Math.PI / 180;
    const C = add(O, pt(R * ratio * Math.cos(turn), -R * ratio * Math.sin(turn)));
    const atC = deg(angleAt(C, A, B)), atA = deg(angleAt(A, B, C)), atB = deg(angleAt(B, A, C));
    const where = ratio === 1 ? '圆上' : ratio < 1 ? '圆内' : '圆外';
    const halves = split && ratio === 1;
    const label = (vertex, p, q, value, gap = 46, cls = 'thales-value') => {
      const middle = add(unit(sub(p, vertex)), unit(sub(q, vertex)));
      return text(add(add(vertex, mul(unit(middle), gap)), pt(0, 5)), value, `graph-note ${cls}`);
    };
    board.draw(
      circle(O, R, 'structural thales-circle') + line(A, B, 'structural') +
      polygon([A, C, B], 'shape') +
      (halves ? polygon([A, O, C], 'image-shape thales-half') + polygon([O, B, C], 'shape thales-half is-b') + line(O, C, 'aux alt') : '') +
      angleArc(C, A, B, 30, 'result thales-angle') +
      (halves
        ? angleArc(A, B, C, 26, 'aux thales-small') + angleArc(B, A, C, 26, 'aux alt thales-small') +
          label(A, B, C, 'α') + label(B, A, C, 'β') + label(C, A, O, 'α', 52) + label(C, B, O, 'β', 52)
        : '') +
      label(C, add(C, sub(C, A)), add(C, sub(C, B)), `${atC.toFixed(1)}°`, 34, 'thales-reading') +
      point(A, 'A') + point(B, 'B') + point(O, 'O') +
      point(C, 'C', { key: 'thales-c', kind: 'draggable' })
    );
    input.previousElementSibling.value = `${input.value}%`;
    for (const item of controls.querySelectorAll('button')) {
      const name = item.dataset.action;
      item.setAttribute('aria-pressed', String(name === 'thales-split' ? split : places[name] === Number(input.value)));
    }
    stats.innerHTML = metric('∠ACB', `${atC.toFixed(1)}°`) + metric('∠A + ∠B', `${(atA + atB).toFixed(1)}°`) + metric('C 的位置', where);
  }

  function show(nextHeading, percent, nextSplit) {
    heading = nextHeading;
    input.value = percent;
    split = nextSplit;
    draw();
    board.animate('.thales-angle, .thales-half, .shape, .thales-small');
  }

  dragPoints(board, (_, p) => {
    const offset = sub(p, O);
    let angle = deg(Math.atan2(-offset.y, offset.x));
    if (Math.abs(angle) < 8) angle = 8 * Math.sign(angle || 1);
    if (Math.abs(angle) > 172) angle = 172 * Math.sign(angle);
    heading = angle;
    let percent = Math.round(clamp(dist(p, O) / R * 100, 50, 150));
    if (Math.abs(percent - 100) <= 4) percent = 100;
    input.value = percent;
    draw();
  });
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'thales-split') show(heading, input.value, !split);
    else if (Object.hasOwn(places, action)) show(heading, places[action], split);
  }, { signal });
  draw();
  return (_, nextHeading, percent, nextSplit) => show(nextHeading, percent, nextSplit);
}
