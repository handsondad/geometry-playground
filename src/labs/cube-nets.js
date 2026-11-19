import { pt } from '../math.js';
import { foldNet } from '../spatial-math.js';
import { button, metric, slider } from '../board.js';

const nets = {
  cross: { label: '十字形', cells: [[1, 1], [1, 0], [0, 1], [2, 1], [3, 1], [1, 2]] },
  stairs: { label: '楼梯形', cells: [[1, 1], [0, 0], [1, 0], [2, 1], [2, 2], [3, 2]] },
  zigzag: { label: '三三错开', cells: [[2, 0], [0, 0], [1, 0], [2, 1], [3, 1], [4, 1]] },
  row: { label: '一排五个', cells: [[2, 1], [0, 1], [1, 1], [3, 1], [4, 1], [2, 0]] },
};
const verdicts = Object.fromEntries(Object.entries(nets).map(([id, { cells }]) => [id, foldNet(cells, Math.PI / 2).distinct]));
const O = pt(320, 238), tilt = 56 * Math.PI / 180;
const coords = p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

export function cubeNetsLab({ board, controls, stats, signal }) {
  let net = 'cross';
  controls.innerHTML = `<div class="control-row">${Object.entries(nets).map(([id, { label }]) => button(label, id, 'aria-pressed="false"')).join('')}</div>` +
    slider('折起来的角度', 'net-fold', 0, 0, 90, 1, '°') + slider('转一转', 'net-yaw', 24, -180, 180, 1, '°') +
    '<p class="lab-note">中间那块平放在桌上，其余每条折痕都往上折同样的角度。折到 90°，看它能不能合成一个正方体。</p>';
  const [foldInput, yawInput] = controls.querySelectorAll('input');

  function draw() {
    const { cells } = nets[net], fold = Number(foldInput.value), yaw = Number(yawInput.value) * Math.PI / 180;
    const { faces, distinct } = foldNet(cells, fold * Math.PI / 180);
    const middle = [0, 1].map(k => cells.reduce((sum, c) => sum + c[k] + .5, 0) / cells.length);
    const scale = 78, c = Math.cos(yaw), s = Math.sin(yaw);
    const view = ([x, y, z]) => {
      const dx = x - middle[0], dy = y - middle[1], rx = c * dx - s * dy, ry = s * dx + c * dy;
      return { p: pt(O.x + scale * rx, O.y + scale * (ry * Math.cos(tilt) - z * Math.sin(tilt))), depth: ry * Math.sin(tilt) + z * Math.cos(tilt) };
    };
    const drawn = faces.map((face, i) => {
      const corners = face.corners.map(view);
      return { i, corners, depth: corners.reduce((sum, q) => sum + q.depth, 0) / 4 };
    }).sort((a, b) => a.depth - b.depth);
    board.draw(`<ellipse cx="${O.x}" cy="${O.y}" rx="${scale * 3.4}" ry="${(scale * 3.4 * Math.cos(tilt)).toFixed(1)}" class="net-table"/>` +
      drawn.map(({ i, corners }) => `<path d="M${corners.map(q => coords(q.p)).join('L')}Z" class="net-face is-${i}${i === 0 ? ' is-base' : ''}"/>`).join(''));
    foldInput.previousElementSibling.value = `${fold}°`;
    yawInput.previousElementSibling.value = `${yawInput.value}°`;
    for (const item of controls.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item.dataset.action === net));
    const closes = verdicts[net] === 6;
    stats.innerHTML = metric('折起来的角度', `${fold}°`) +
      metric('现在占了几个位置', fold === 90 ? `${distinct} 个（共 6 块）` : '还在折') +
      metric('折到 90° 的结果', closes ? '合成正方体' : `有 ${6 - verdicts[net]} 块撞在一起，缺 ${6 - verdicts[net]} 个面`);
  }

  function show(nextNet, fold) {
    net = nextNet;
    foldInput.value = fold;
    draw();
    board.animate('.net-face');
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (Object.hasOwn(nets, action)) show(action, foldInput.value);
  }, { signal });
  draw();
  return (_, nextNet, fold) => show(nextNet, fold);
}
