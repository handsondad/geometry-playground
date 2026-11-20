import { customLabs } from './custom-labs.js';

// 实验模块按需加载：首页和展馆页不再把 40 多个实验的代码一起下载
const pick = name => module => module[name];
const experiments = name => () => import('./experiments.js').then(pick(name));
const discovery = name => () => import('./discovery.js').then(pick(name));
const puzzles = name => () => import('./puzzles.js').then(pick(name));
const spatial = name => () => import('./spatial.js').then(pick(name));
const planeLabs = name => () => import('./plane-labs.js').then(pick(name));
const elementsAngles = () => import('./elements-angles.js').then(pick('elementsAngles'));
const construction = () => import('./construction.js').then(pick('construction'));

const loaders = {
  sphere: () => import('./sphere.js').then(pick('sphere')),
  disk: experiments('disk'), koch: experiments('fractals'), sierpinski: experiments('fractals'),
  centers: experiments('centers'), transform: experiments('transform'),
  'fractal-tree': discovery('fractalTree'), 'hyperbolic-triangle': discovery('hyperbolicTriangle'), tiling: discovery('tiling'),
  pythagoras: () => import('./pythagoras.js').then(pick('pythagoras')),
  billiards: puzzles('billiards'), 'symmetry-ink': puzzles('symmetryInk'), sangaku: puzzles('sangakuPuzzle'),
  'cube-section': spatial('cubeLab'), mobius: spatial('mobiusLab'), tesseract: spatial('tesseractLab'),
  ellipse: planeLabs('ellipseLab'), voronoi: planeLabs('voronoiLab'),
  'copy-angle': elementsAngles, 'draw-parallel': elementsAngles, 'triangle-sum': elementsAngles,
  ...Object.fromEntries(customLabs.map(entry => [entry.lesson.id, entry.load])),
};

const ready = new Map();
const pending = new Map();
const failed = new Map();

/** 预先下载实验模块；未单独登记的实验都是《几何原本》尺规作图，走 construction 工作台 */
export function loadLabMode(id) {
  if (ready.has(id)) return Promise.resolve(ready.get(id));
  if (!pending.has(id)) {
    const promise = (loaders[id] ?? construction)().then(
      mode => { ready.set(id, mode); pending.delete(id); return mode; },
      error => { pending.delete(id); failed.set(id, error); throw error; },
    );
    pending.set(id, promise);
  }
  return pending.get(id);
}

/** 渲染时取实验函数：已下载就直接返回，否则抛出加载中的 Promise 交给 React Suspense 等待 */
export function requireLabMode(id) {
  if (ready.has(id)) return ready.get(id);
  if (failed.has(id)) {
    const error = failed.get(id);
    failed.delete(id);
    throw error;
  }
  throw loadLabMode(id);
}