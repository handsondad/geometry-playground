import { goldenAngle, pt, spiralFamilies, vogelSpiral } from '../math.js';
import { button, metric, slider } from '../board.js';

const O = pt(320, 200), scale = 176 / Math.sqrt(600);
const golden = goldenAngle * 180 / Math.PI;

/** The smallest q ≤ 24 with angle/360 = p/q, i.e. seeds stacking into q straight rays, or 0. */
function rays(degrees) {
  for (let q = 1; q <= 24; q++) if (Math.abs(degrees / 360 * q - Math.round(degrees / 360 * q)) < 1e-6) return q;
  return 0;
}

export function phyllotaxisLab({ board, controls, stats, signal }) {
  let angle = golden, arms = false;
  controls.innerHTML = slider('每颗新种子多转的角度', 'phyllo-angle', 137.5, 90, 180, .1, '°') +
    slider('种子数', 'phyllo-count', 300, 30, 600, 10) +
    `<div class="control-row">${button('黄金角 137.508°', 'phyllo-golden')}${button('给螺旋上色', 'phyllo-arms', 'aria-pressed="false"')}</div>
    <p class="lab-note">从 90° 慢慢拉向黄金角，看种子怎样从几条直线散开、铺满整个花盘。</p>`;
  const [angleInput, countInput] = controls.querySelectorAll('input');

  function draw() {
    const count = Number(countInput.value), q = rays(angle);
    const seeds = vogelSpiral(count, angle * Math.PI / 180);
    const families = q || count < 60 ? null : spiralFamilies(seeds);
    const few = families?.[0];
    const paint = n => arms && few ? ` is-arm-${Math.floor((n % few) * angle / 360 % 1 * few) % 2}` : '';
    board.draw(`<circle cx="${O.x}" cy="${O.y}" r="${scale * Math.sqrt(count) + 8}" class="phyllo-disk"/>` +
      seeds.map((p, n) => `<circle cx="${(O.x + scale * p.x).toFixed(1)}" cy="${(O.y + scale * p.y).toFixed(1)}" r="${(2.2 + 1.6 * n / 600).toFixed(2)}" class="phyllo-seed fade-in${paint(n)}"/>`).join(''));
    angleInput.previousElementSibling.value = `${angle.toFixed(Math.abs(angle - golden) < 1e-9 ? 3 : 1)}°`;
    countInput.previousElementSibling.value = String(count);
    controls.querySelector('[data-action="phyllo-arms"]').setAttribute('aria-pressed', String(arms));
    stats.innerHTML = metric('每颗多转', `${angle.toFixed(Math.abs(angle - golden) < 1e-9 ? 3 : 1)}°`) + metric('种子数', count) +
      metric('外圈看到的', q ? `排成 ${q} 条直线` : families ? `${families[0]} 条和 ${families[1]} 条螺旋` : '种子还太少');
  }

  function show(degrees, count, nextArms) {
    angle = degrees;
    angleInput.value = degrees;
    countInput.value = count;
    arms = nextArms;
    draw();
    board.animate('.phyllo-seed');
  }

  controls.addEventListener('input', event => {
    if (event.target === angleInput) angle = Number(angleInput.value);
    draw();
  }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'phyllo-golden') show(golden, countInput.value, arms);
    else if (action === 'phyllo-arms') show(angle, countInput.value, !arms);
  }, { signal });
  draw();
  return (_, degrees, count, nextArms) => show(degrees === 'golden' ? golden : degrees, count, nextArms);
}
