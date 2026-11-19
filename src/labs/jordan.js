import { add, clamp, insidePolygon, mul, pt, rayCrossings } from '../math.js';
import { button, circle, dragPoints, line, metric, point, slider } from '../board.js';

const O = pt(320, 200);
function blob() {
  return Array.from({ length: 180 }, (_, i) => {
    const t = 2 * Math.PI * i / 180, r = 128 + 34 * Math.sin(3 * t) + 20 * Math.cos(5 * t + .6);
    return pt(O.x + 1.35 * r * Math.cos(t), O.y + .95 * r * Math.sin(t));
  });
}
/** A band wound 3½ times around the middle: its outer rim out, its inner rim back. */
function maze() {
  const turns = 3.5, per = 48, last = turns * per, rim = side => Array.from({ length: last + 1 }, (_, i) => {
    const t = 2 * Math.PI * i / per, r = 24 + 44 * i / per + side * 12;
    return pt(O.x + 1.55 * r * Math.cos(t), O.y + r * Math.sin(t));
  });
  return [...rim(1), ...rim(-1).reverse()];
}
const curves = { blob: blob(), maze: maze() };
const spots = { blob: { inside: pt(300, 190), outside: pt(560, 70) }, maze: { deep: pt(320 + 1.55 * 112, 200), gap: pt(320 + 1.55 * 134, 200) } };

export function jordanLab({ board, controls, stats, signal }) {
  let shape = 'blob', probe = spots.blob.inside, reveal = false;
  controls.innerHTML = slider('射线的方向', 'jordan-angle', 0, 0, 359, 1, '°') +
    `<div class="control-row">${button('一圈弯弯的线', 'blob', 'aria-pressed="false"')}${button('绕晕人的迷宫', 'maze', 'aria-pressed="false"')}</div>
    <div class="control-row">${button('涂出里面，核对答案', 'jordan-reveal', 'aria-pressed="false"')}</div>
    <p class="lab-note">拖动小人 P，从它画一条射线出去，数射线穿过曲线几次；再转动射线，次数变了，单双变了吗？</p>`;
  const input = controls.querySelector('input');

  function draw() {
    const curve = curves[shape], angle = Number(input.value) * Math.PI / 180;
    const hits = rayCrossings(probe, angle, curve), inside = insidePolygon(probe, curve);
    const far = add(probe, mul(pt(Math.cos(angle), Math.sin(angle)), 900));
    board.draw(`<path d="M${curve.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}Z" class="jordan-curve${reveal ? ' is-revealed' : ''}"/>` +
      line(probe, far, 'result jordan-ray') +
      hits.map(p => circle(p, 6, 'jordan-hit fade-in')).join('') +
      point(probe, 'P', { key: 'jordan-p', kind: 'draggable' }));
    input.previousElementSibling.value = `${input.value}°`;
    for (const item of controls.querySelectorAll('button')) {
      const name = item.dataset.action;
      item.setAttribute('aria-pressed', String(name === 'jordan-reveal' ? reveal : name === shape));
    }
    stats.innerHTML = metric('射线穿过曲线', `${hits.length} 次`) + metric('次数是', hits.length % 2 ? '单数' : '双数') +
      metric('所以 P 在', hits.length % 2 ? '里面' : '外面') + (reveal ? metric('涂色核对', inside ? '里面' : '外面') : '');
  }

  function show(nextShape, spot, degrees, nextReveal) {
    shape = nextShape;
    probe = spots[shape][spot];
    input.value = degrees;
    reveal = nextReveal;
    draw();
    board.animate('.jordan-ray, .jordan-hit');
  }

  dragPoints(board, (_, p) => { probe = pt(clamp(p.x, 20, 620), clamp(p.y, 20, 380)); draw(); });
  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'jordan-reveal') { reveal = !reveal; draw(); }
    else if (Object.hasOwn(curves, action)) show(action, Object.keys(spots[action])[0], input.value, reveal);
  }, { signal });
  draw();
  return (_, nextShape, spot, degrees, nextReveal) => show(nextShape, spot, degrees, nextReveal);
}
