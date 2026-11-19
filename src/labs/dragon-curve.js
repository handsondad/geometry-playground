import { add, dragonCurve, mul, pt } from '../math.js';
import { metric, polyline, slider, text } from '../board.js';

const box = { left: 30, right: 610, top: 54, bottom: 376 };
const key = (a, b) => [a, b].map(p => `${Math.round(p.x * 1e4)},${Math.round(p.y * 1e4)}`).sort().join('|');

export function dragonCurveLab({ board, controls, stats, signal }) {
  controls.innerHTML = slider('对折次数', 'dragon-folds', 4, 0, 12, 1) +
    slider('最后一折张开', 'dragon-open', 90, 0, 90, 1, '°') +
    '<p class="lab-note">把纸条一次次对折，再把每道折痕都张开成直角。张开角调小，可以看到最后一折是怎样转出来的。</p>';
  const [foldInput, openInput] = controls.querySelectorAll('input');

  function draw() {
    const folds = Number(foldInput.value), open = Number(openInput.value);
    const points = dragonCurve(folds, open * Math.PI / 180), settled = dragonCurve(folds);
    const all = [...points, ...settled], xs = all.map(p => p.x), ys = all.map(p => p.y);
    const scale = Math.min((box.right - box.left) / Math.max(1, Math.max(...xs) - Math.min(...xs)), (box.bottom - box.top) / Math.max(1, Math.max(...ys) - Math.min(...ys)), 180);
    const shift = pt((box.left + box.right) / 2 - scale * (Math.max(...xs) + Math.min(...xs)) / 2, (box.top + box.bottom) / 2 + scale * (Math.max(...ys) + Math.min(...ys)) / 2);
    const place = p => add(shift, mul(pt(p.x, -p.y), scale));
    const half = (points.length - 1) / 2;
    const seen = new Set();
    let overlaps = 0;
    for (let i = 1; i < points.length; i++) {
      const id = key(points[i - 1], points[i]);
      if (seen.has(id)) overlaps++;
      seen.add(id);
    }
    const width = Math.max(1.2, Math.min(5, scale / 6)).toFixed(1);
    board.draw((folds ? polyline(points.slice(0, half + 1).map(place), 'dragon-path is-first') + polyline(points.slice(half).map(place), 'dragon-path is-second')
      : polyline(points.map(place), 'dragon-path is-first')) +
      text(pt(30, 40), folds ? `${folds} 次对折：前一半不动，后一半绕着终点转 ${open}°` : '还没有对折的纸条', 'graph-note'));
    board.svg.style.setProperty('--dragon-width', `${width}px`);
    foldInput.previousElementSibling.value = String(folds);
    openInput.previousElementSibling.value = `${open}°`;
    openInput.disabled = folds === 0;
    stats.innerHTML = metric('对折次数', folds) + metric('小段', 2 ** folds) + metric('折痕', 2 ** folds - 1) + metric('重叠的小段', overlaps);
  }

  function show(folds, open) {
    foldInput.value = folds;
    openInput.value = open;
    draw();
    board.animate('.dragon-path');
  }

  controls.addEventListener('input', draw, { signal });
  draw();
  return (_, folds, open) => show(folds, open);
}
