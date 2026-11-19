import { cross, dot, hyperbolicAngles, mul, norm, pt, sub } from './math.js';
import { cross3, dotN } from './spatial-math.js';

const radial = (p, fn) => {
  const r = norm(p);
  return r ? mul(p, fn(r) / r) : p;
};

const flat = r => r;
const projections = { plane: flat, sphere: Math.sin, disk: r => Math.tanh(r / 2) };
const inverses = { plane: flat, sphere: Math.asin, disk: r => 2 * Math.atanh(r) };

export function comparisonPoint(world, kind) {
  return radial(world, projections[kind]);
}

export function comparisonInverse(projected, kind, scale) {
  const r = norm(projected);
  if (!r) return projected;
  const bound = projections[kind](1.52);
  return mul(projected, inverses[kind](Math.min(r, bound)) / (r * scale));
}

export function comparisonTriangles(tip, scale) {
  // The same bearing and radial distance define each point in all three intrinsic metrics.
  const world = [tip, pt(-.77, .60), pt(.77, .60)].map(p => mul(p, scale));
  const plane = world.map((a, i) => {
    const u = sub(world[(i + 1) % 3], a), v = sub(world[(i + 2) % 3], a);
    return Math.atan2(Math.abs(cross(u, v)), dot(u, v));
  });
  const sphere = world.map(p => {
    const { x, y } = comparisonPoint(p, 'sphere');
    return [x, y, Math.cos(norm(p))];
  });
  const sphericalAngles = sphere.map((a, i) => {
    const u = cross3(a, sphere[(i + 1) % 3]), v = cross3(a, sphere[(i + 2) % 3]);
    return Math.atan2(Math.hypot(...cross3(u, v)), dotN(u, v));
  });
  const disk = world.map(p => comparisonPoint(p, 'disk'));
  const angles = { plane, sphere: sphericalAngles, disk: hyperbolicAngles(disk) };
  return {
    world, sphere, disk,
    totals: Object.fromEntries(Object.entries(angles).map(([kind, values]) =>
      [kind, values.reduce((sum, angle) => sum + angle, 0) * 180 / Math.PI])),
  };
}
