import { pt } from '../math.js';
import { line, metric, polygon, slider, text } from '../board.js';

const side = 4, height = 6;

export function squareSlice(z, offset) {
  const shift = offset * z / height;
  return [[0, 0], [side, 0], [side, side], [0, side]].map(([x, y]) => [x + shift, y, z]);
}

export function shearStackLab({ board, controls, stats, signal }) {
  controls.innerHTML = slider('顶面水平位移', 'stack-offset', 65, -100, 100, 1, '%') +
    slider('切片高度', 'stack-height', 50, 0, 100, 1, '%') +
    '<p class="lab-note">位移以底边长为基准。沿虚线比较同一高度的两张金色切片。</p>';
  const offset = controls.querySelector('#stack-offset'), level = controls.querySelector('#stack-height');
  const project = (origin, [x, y, z]) => pt(origin + 25 * x + 12 * y, 317 - 10 * y - 34 * z);

  function draw() {
    const z = height * level.value / 100, shear = side * offset.value / 100;
    for (const input of [offset, level]) input.previousElementSibling.value = `${input.value}%`;
    const render = (origin, displacement) => {
      const slice = at => squareSlice(at, displacement).map(p => project(origin, p));
      const base = slice(0), top = slice(height), cut = slice(z);
      return polygon(base, 'shape') + polygon([base[1], base[2], top[2], top[1]], 'shape') +
        polygon([base[3], base[2], top[2], top[3]], 'shape') +
        [1, 2, 3, 4, 5].map(layer => polygon(slice(layer), 'aux')).join('') +
        polygon(top, 'shape') + line(base[0], top[0], 'structural') +
        polygon(cut, 'image-shape stack-slice');
    };
    const y = project(0, [0, 0, z]).y;
    board.draw(line(pt(24, y), pt(616, y), 'aux alt') +
      render(96, 0) + render(385, shear) +
      text(pt(137, 362), '直方柱') + text(pt(422, 362), '剪切方柱'));
    stats.innerHTML = metric('同高截面面积', `${side ** 2} = ${side ** 2}`) +
      metric('当前切片高度', z.toFixed(2)) +
      metric('两座方柱体积', `${side ** 2 * height} = ${side ** 2 * height}`);
  }

  controls.addEventListener('input', draw, { signal });
  draw();
  return (_, shear, slice) => {
    offset.value = shear;
    level.value = slice;
    draw();
    board.animate('.stack-slice');
  };
}
