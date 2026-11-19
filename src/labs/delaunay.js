import { angleAt, circumcircle, delaunay, dist, pt, voronoiCells } from '../math.js';
import { button, circle, dragPoints, metric, point, polygon } from '../board.js';

const start = [pt(118, 92), pt(262, 70), pt(452, 104), pt(560, 230), pt(430, 330), pt(236, 318), pt(96, 262), pt(300, 196), pt(420, 210)];
const frame = [pt(0, 0), pt(640, 0), pt(640, 400), pt(0, 400)];
const views = { mesh: '只看三角网', circles: '画出外接圆', dual: '叠上沃罗诺伊图' };

export function delaunayLab({ board, controls, stats, signal }) {
  let sites = start.map(p => ({ ...p })), view = 'mesh';
  controls.innerHTML = `<div class="control-row">${Object.entries(views).map(([id, label]) => button(label, id, 'aria-pressed="false"')).join('')}</div>
    <p class="lab-note">拖动任意一个站点。每个三角形的外接圆里，都找不到第四个站点。</p>`;

  function draw() {
    const triangles = delaunay(sites).map(t => t.map(i => sites[i]));
    const circles = triangles.map(t => circumcircle(...t)).filter(Boolean);
    const intruders = circles.reduce((n, { center, r }, k) =>
      n + sites.filter(p => !triangles[k].includes(p) && dist(p, center) < r - 1e-6).length, 0);
    const smallest = Math.min(...triangles.flatMap(([a, b, c]) => [angleAt(a, b, c), angleAt(b, c, a), angleAt(c, a, b)])) * 180 / Math.PI;
    const cells = view === 'dual' ? voronoiCells(sites, frame) : [];
    board.draw(triangles.map((t, k) => polygon(t, `shape delaunay-tri${k === 0 ? ' is-picked' : ''}`)).join('') +
      (view === 'circles' ? circles.map(({ center, r }, k) => circle(center, r, k === 0 ? 'result delaunay-circle is-picked' : 'aux delaunay-circle')).join('') : '') +
      (view === 'dual' ? cells.map(cell => polygon(cell, 'delaunay-cell')).join('') + circles.map(({ center }) => circle(center, 4.5, 'delaunay-center fade-in')).join('') : '') +
      sites.map((p, i) => point(p, String.fromCharCode(65 + i), { key: String(i), kind: 'draggable' })).join(''));
    for (const item of controls.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item.dataset.action === view));
    stats.innerHTML = metric('站点', sites.length) + metric('三角形', triangles.length) +
      metric('外接圆里的其他站点', intruders) + metric('最小的角', `${smallest.toFixed(1)}°`);
  }

  function show(nextView) {
    view = nextView;
    draw();
    board.animate(view === 'mesh' ? '.delaunay-tri' : view === 'circles' ? '.delaunay-circle.is-picked, .delaunay-circle' : '.delaunay-cell, .delaunay-center');
  }

  dragPoints(board, (key, p) => { sites[Number(key)] = p; draw(); });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (Object.hasOwn(views, action)) show(action);
  }, { signal });
  draw();
  return (_, nextView) => show(nextView);
}
