import { pt, timesTableEnvelope } from '../math.js';
import { button, circle, metric, slider } from '../board.js';

const curveNames = { 2: '心形线', 3: '肾形线' };
const O = pt(320, 200), R = 176;
const place = p => pt(O.x + R * p.y, O.y - R * p.x);
const onCircle = angle => place(pt(Math.cos(angle), Math.sin(angle)));
const coords = p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

export function timesTableLab({ board, controls, stats, signal }) {
  let envelope = false;
  controls.innerHTML = slider('乘数 m：第 k 个点连到第 m × k 个点', 'times-m', 2, 2, 10, .1) +
    slider('圆上的点数', 'times-n', 120, 6, 240, 1) +
    `<div class="control-row">${button('描出弦围成的曲线', 'times-envelope', 'aria-pressed="false"')}</div>
    <p class="lab-note">先拉乘数，再把点数减到十几个，看看弯弯的曲线是不是真的被画出来过。</p>`;
  const [mInput, nInput] = controls.querySelectorAll('input');

  function draw() {
    const m = Number(mInput.value), n = Number(nInput.value), whole = Math.abs(m - Math.round(m)) < 1e-9 ? Math.round(m) : 0;
    const groups = [[], [], [], []];
    for (let k = 0; k < n; k++) {
      const a = onCircle(2 * Math.PI * k / n), b = onCircle(2 * Math.PI * m * k / n);
      groups[k % 4].push(`M${coords(a)}L${coords(b)}`);
    }
    const curve = whole && envelope
      ? `<path d="M${Array.from({ length: 721 }, (_, i) => coords(place(timesTableEnvelope(2 * Math.PI * i / 720, whole)))).join('L')}" class="result times-envelope"/>`
      : '';
    board.draw(circle(O, R, 'structural times-ring') +
      groups.map((d, g) => `<path d="${d.join('')}" class="times-chord is-${g}"/>`).join('') + curve +
      Array.from({ length: n }, (_, k) => {
        const p = onCircle(2 * Math.PI * k / n);
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${n > 60 ? 1.6 : 3.2}" class="times-dot"/>`;
      }).join(''));
    mInput.previousElementSibling.value = m.toFixed(1);
    nInput.previousElementSibling.value = String(n);
    controls.querySelector('[data-action="times-envelope"]').setAttribute('aria-pressed', String(envelope));
    stats.innerHTML = metric('乘数 m', m.toFixed(1)) +
      metric('尖角', whole ? `${whole - 1} 个` : '整数时才数得清') +
      metric('弦包出的曲线', whole ? curveNames[whole] ?? `${whole - 1} 个尖角的外摆线` : '在两种曲线之间');
  }

  function show(m, n, nextEnvelope) {
    mInput.value = m;
    nInput.value = n;
    envelope = nextEnvelope;
    draw();
    board.animate('.times-envelope, .times-chord');
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    if (event.target.closest('button')?.dataset.action !== 'times-envelope') return;
    show(mInput.value, nInput.value, !envelope);
  }, { signal });
  draw();
  return (_, m, n, nextEnvelope) => show(m, n, nextEnvelope);
}
