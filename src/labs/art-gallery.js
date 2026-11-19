import { insidePolygon, pt, sees, visibilityPolygon } from '../math.js';
import { button, circle, dragPoints, metric, point, polygon, slider } from '../board.js';

const room = [[0, 10], [9, 10], [9, 0], [7, 0], [7, 6], [5.5, 6], [5.5, 0], [3.5, 0], [3.5, 6], [2, 6], [2, 0], [0, 0]]
  .map(([x, y]) => pt(52 + x * 59, 34 + y * 33));
const samples = [];
for (let x = 56; x < 588; x += 9) for (let y = 38; y < 366; y += 9) if (insidePolygon(pt(x, y), room)) samples.push(pt(x, y));
const layouts = {
  1: [pt(316, 300)],
  2: [pt(150, 300), pt(470, 300)],
  3: [pt(111, 290), pt(317, 290), pt(524, 290)],
  4: [pt(111, 290), pt(317, 290), pt(524, 290), pt(420, 340)],
};

export function artGalleryLab({ board, controls, stats, signal }) {
  let guards = layouts[1].map(p => ({ ...p }));
  controls.innerHTML = slider('保安人数', 'gallery-guards', 1, 1, 4, 1, ' 位') +
    `<div class="control-row">${button('摆回原位', 'gallery-reset')}</div>
    <p class="lab-note">拖动保安。彩色区域是他们能看到的地方，红点是谁都看不到的角落。</p>`;
  const input = controls.querySelector('input');

  function draw() {
    const blind = samples.filter(s => !guards.some(g => sees(g, s, room)));
    const seen = samples.length - blind.length;
    board.draw(polygon(room, 'gallery-room') +
      guards.map((g, i) => polygon(visibilityPolygon(g, room), `gallery-view is-${i}`)).join('') +
      polygon(room, 'gallery-wall') +
      blind.map(p => circle(p, 2.6, 'gallery-blind')).join('') +
      guards.map((g, i) => point(g, `保安 ${i + 1}`, { key: String(i), kind: 'draggable' })).join(''));
    input.previousElementSibling.value = `${guards.length} 位`;
    const share = Math.round(seen / samples.length * 1000) / 10;
    stats.innerHTML = metric('保安', `${guards.length} 位`) + metric('看到的地方', `${share}%`) +
      metric('展厅的拐角', `${room.length} 个`) + metric('拐角数 ÷ 3（一定够的人数）', Math.floor(room.length / 3));
  }

  function show(count) {
    input.value = count;
    guards = layouts[count].map(p => ({ ...p }));
    draw();
    board.animate('.gallery-view');
  }

  dragPoints(board, (key, p) => {
    if (!insidePolygon(p, room)) return;
    guards[Number(key)] = p;
    draw();
  });
  controls.addEventListener('input', () => show(Number(input.value)), { signal });
  controls.addEventListener('click', event => {
    if (event.target.closest('button')?.dataset.action === 'gallery-reset') show(guards.length);
  }, { signal });
  draw();
  return (_, count) => show(count);
}
