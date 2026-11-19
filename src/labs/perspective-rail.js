import { button, circle, line, metric, polygon, slider, text } from '../board.js';
import { dist, pt } from '../math.js';

export function pinholePoint(x, y, depth, focal) {
  return pt(focal * x / depth, -focal * y / depth);
}

export function perspectiveRailLab({ board, controls, stats, signal }) {
  const depths = Array.from({ length: 10 }, (_, i) => 3 + 2 * i);
  const reference = 6, trackWidth = 2, eyeHeight = 1.65;
  let rays = false;
  controls.innerHTML = slider('枕木深度', 'rail-depth', 8, 3, 21, 1, ' m') +
    slider('焦距（画板像素）', 'rail-focal', 210, 150, 250, 1, ' px') +
    `<div class="control-row">${button('试试放到 12 米处', 'rail-double')}${button('延长铁轨', 'rail-rays', 'aria-pressed="false"')}</div>
    <p class="lab-note">左边从上往下看；右边从小孔相机看。青色固定在 6 米，金色可以移动。</p>`;
  const [depthInput, focalInput] = controls.querySelectorAll('input');
  const rayButton = controls.querySelector('[data-action="rail-rays"]');
  const top = (x, z) => pt(131 + 44 * x, 341 - 12.35 * z);
  const vanishing = pt(427, 145);

  function draw() {
    const z = Number(depthInput.value), focal = Number(focalInput.value);
    const image = (x, depth) => {
      const p = pinholePoint(x, -eyeHeight, depth, focal);
      return pt(vanishing.x + p.x, vanishing.y + p.y);
    };
    const sleepers = (project, depth, cls) => line(project(-1, depth), project(1, depth), cls);
    const rails = project => [-1, 1].map(x => line(project(x, 3), project(x, 21), 'rail-track')).join('');
    const bed = project => polygon([project(-1.11, 3), project(1.11, 3), project(1.11, 21), project(-1.11, 21)], 'rail-bed');
    const sleepersAll = project => depths.map(n => sleepers(project, n, 'rail-sleeper')).join('');
    const marks = project => sleepers(project, reference, 'rail-reference') + sleepers(project, z, 'rail-selected');
    const y = top(0, z).y;
    board.draw(`${text(pt(39, 43), '俯视 · 实际轨道', 'rail-heading')}${text(pt(278, 43), '小孔相机 · 照片', 'rail-heading')}
      ${line(pt(251, 24), pt(251, 366), 'rail-rule')}
      ${bed(top)}${sleepersAll(top)}${rails(top)}${marks(top)}
      ${text(pt(188, y + 5), `${z} m`, 'rail-note')}${circle(top(0, 0), 5, 'rail-camera')}
      ${text(pt(148, 347), '相机', 'rail-note')}
      ${line(pt(279, vanishing.y), pt(604, vanishing.y), 'rail-rule')}${text(pt(549, 137), '地平线', 'rail-note')}
      ${bed(image)}${sleepersAll(image)}${rails(image)}${marks(image)}
      ${rays ? [-1, 1].map(x => line(image(x, 21), vanishing, 'rail-ray')).join('') +
        circle(vanishing, 4, 'rail-camera') + text(pt(vanishing.x + 10, vanishing.y - 9), '消失点', 'rail-note') : ''}`);
    depthInput.previousElementSibling.value = `${z} m`;
    focalInput.previousElementSibling.value = `${focal} px`;
    rayButton.setAttribute('aria-pressed', String(rays));
    const width = depth => dist(image(-1, depth), image(1, depth));
    stats.innerHTML = metric('实际轨距', `${trackWidth} m`) + metric('金色枕木影像', `${width(z).toFixed(1)} px`) +
      metric('青色枕木影像', `${width(reference).toFixed(1)} px`) +
      metric('金色 / 青色', `${(width(z) / width(reference)).toFixed(2)} 倍`);
  }

  controls.addEventListener('input', draw, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'rail-double') depthInput.value = 12;
    else if (action === 'rail-rays') rays = !rays;
    else return;
    draw();
    board.animate('.rail-selected, .rail-ray');
  }, { signal });
  draw();
  return (_, depth, focal, showRays) => {
    depthInput.value = depth;
    focalInput.value = focal;
    rays = showRays;
    draw();
    board.animate('.rail-selected, .rail-ray');
  };
}
