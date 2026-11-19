import { goldenRatio, pt, penroseTriangles } from '../math.js';
import { button, metric, slider, text } from '../board.js';

const layers = Array.from({ length: 7 }, (_, depth) => {
  const tiles = penroseTriangles(depth), thin = tiles.filter(t => t.kind === 0).length;
  return { tiles, thin, fat: tiles.length - thin };
});
const place = p => pt(220 + 300 * p.x, 200 + 300 * p.y);
const coords = p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const chart = { left: 470, right: 616, top: 92, bottom: 326, max: 2 };
const chartPoint = (depth, ratio) => pt(chart.left + (chart.right - chart.left) * depth / 6, chart.bottom - (chart.bottom - chart.top) * ratio / chart.max);

export function penroseLab({ board, controls, stats, signal }) {
  let halves = false;
  controls.innerHTML = slider('细分次数', 'penrose-depth', 3, 0, 6, 1) +
    `<div class="control-row">${button('拆开看：每块菱形是两个三角形', 'penrose-halves', 'aria-pressed="false"')}</div>
    <p class="lab-note">每细分一次，三角形都按同一个规则切小。数一数胖的和瘦的，再看右边的比值往哪里走。</p>`;
  const input = controls.querySelector('input');

  function draw() {
    const depth = Number(input.value), { tiles, thin, fat } = layers[depth];
    const fill = kind => tiles.filter(t => t.kind === kind).map(({ a, b, c }) => `M${coords(place(a))}L${coords(place(b))}L${coords(place(c))}Z`).join('');
    const legs = tiles.map(({ a, b, c }) => `M${coords(place(b))}L${coords(place(a))}L${coords(place(c))}`).join('');
    const bases = halves ? tiles.map(({ b, c }) => `M${coords(place(b))}L${coords(place(c))}`).join('') : '';
    const trail = layers.slice(0, depth + 1).map(({ thin: t, fat: f }, d) => chartPoint(d, f / t));
    board.draw(`<clipPath id="penrose-window"><rect x="12" y="12" width="420" height="376" rx="16"/></clipPath>` +
      `<g clip-path="url(#penrose-window)"><path d="${fill(1)}" class="penrose-tile is-fat"/><path d="${fill(0)}" class="penrose-tile is-thin"/>` +
      `<path d="${legs}" class="penrose-edge" style="stroke-width:${(2.2 - depth * .25).toFixed(2)}"/>` +
      (bases ? `<path d="${bases}" class="penrose-base"/>` : '') + '</g>' +
      `<rect x="12" y="12" width="420" height="376" rx="16" class="penrose-frame"/>` +
      text(pt(chart.left - 14, chart.top - 34), '胖 ÷ 瘦', 'graph-note') +
      `<path d="M${chart.left} ${chart.top - 8}V${chart.bottom}H${chart.right + 8}" class="structural penrose-axis"/>` +
      `<path d="M${coords(chartPoint(0, goldenRatio))}H${chart.right}" class="aux penrose-golden"/>` +
      text(pt(chart.right - 44, chartPoint(0, goldenRatio).y - 8), 'φ ≈ 1.618', 'graph-note penrose-phi') +
      [0, 2, 4, 6].map(d => text(pt(chartPoint(d, 0).x - 4, chart.bottom + 22), d, 'graph-note penrose-tick')).join('') +
      text(pt(chart.left + 30, chart.bottom + 44), '细分次数', 'graph-note penrose-tick') +
      (trail.length > 1 ? `<path d="M${trail.map(coords).join('L')}" class="result penrose-trail"/>` : '') +
      trail.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" class="penrose-mark fade-in"/>`).join(''));
    input.previousElementSibling.value = String(depth);
    controls.querySelector('[data-action="penrose-halves"]').setAttribute('aria-pressed', String(halves));
    stats.innerHTML = metric('胖三角形', fat) + metric('瘦三角形', thin) +
      metric('胖 ÷ 瘦', fat ? (fat / thin).toFixed(4) : '还没有胖的') + metric('黄金比 φ', goldenRatio.toFixed(4));
  }

  function show(depth, nextHalves) {
    input.value = depth;
    halves = nextHalves;
    draw();
    board.animate('.penrose-trail, .penrose-mark, .penrose-base, .penrose-edge');
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    if (event.target.closest('button')?.dataset.action === 'penrose-halves') show(input.value, !halves);
  }, { signal });
  draw();
  return (_, depth, nextHalves) => show(depth, nextHalves);
}
