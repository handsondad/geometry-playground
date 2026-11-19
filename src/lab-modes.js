import { construction } from './construction.js';
import { disk, fractals, centers, transform } from './experiments.js';
import { sphere } from './sphere.js';
import { fractalTree, tiling, hyperbolicTriangle } from './discovery.js';
import { pythagoras } from './pythagoras.js';
import { billiards, symmetryInk, sangakuPuzzle } from './puzzles.js';
import { cubeLab, mobiusLab, tesseractLab } from './spatial.js';
import { ellipseLab, voronoiLab } from './plane-labs.js';
import { elementsAngles } from './elements-angles.js';
import { customLabs } from './custom-labs.js';

const modes = {
  sphere, disk, koch: fractals, sierpinski: fractals, centers, transform,
  'fractal-tree': fractalTree, 'hyperbolic-triangle': hyperbolicTriangle, tiling, pythagoras,
  billiards, 'symmetry-ink': symmetryInk, sangaku: sangakuPuzzle, 'cube-section': cubeLab,
  ellipse: ellipseLab, mobius: mobiusLab, voronoi: voronoiLab, tesseract: tesseractLab,
  'copy-angle': elementsAngles, 'draw-parallel': elementsAngles, 'triangle-sum': elementsAngles,
  ...Object.fromEntries(customLabs.map(entry => [entry.lesson.id, entry.mode])),
};

/** 未单独登记的实验都是《几何原本》尺规作图，走 construction 工作台 */
export const labMode = id => modes[id] ?? construction;
