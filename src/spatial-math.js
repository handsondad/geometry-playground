export function hypercube(dimension) {
  const vertices = Array.from({ length: 2 ** dimension }, (_, i) =>
    Array.from({ length: dimension }, (_, axis) => (i & (1 << axis)) ? 1 : -1));
  const edges = vertices.flatMap((_, i) => Array.from({ length: dimension }, (_, axis) => [i, i ^ (1 << axis)]).filter(([, j]) => j > i));
  return { vertices, edges };
}

export const dotN = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const normalized = p => { const length = Math.hypot(...p); return p.map(value => value / length); };
const cross3 = ([a, b, c], [x, y, z]) => [b * z - c * y, c * x - a * z, a * y - b * x];
const eps = 1e-8;

function planeIntersections({ vertices, edges }, normal, level) {
  const values = vertices.map(p => dotN(p, normal) - level), result = [];
  function push(p) {
    if (!result.some(q => Math.hypot(...p.map((x, i) => x - q[i])) < eps)) result.push(p);
  }
  for (const [i, j] of edges) {
    const [a, b] = [values[i], values[j]];
    if (Math.abs(a) < eps) push(vertices[i]);
    if (Math.abs(b) < eps) push(vertices[j]);
    if ((a < -eps && b > eps) || (a > eps && b < -eps)) {
      const t = a / (a - b);
      push(vertices[i].map((x, k) => x + (vertices[j][k] - x) * t));
    }
  }
  return result;
}

const cube = hypercube(3);

export function cubeSection(normal, level) {
  const points = planeIntersections(cube, normal, level);
  if (points.length < 3) return points;
  const center = normal.map((_, i) => points.reduce((sum, p) => sum + p[i], 0) / points.length);
  const u = normalized(cross3(normal, Math.abs(normal[0]) > .8 ? [0, 1, 0] : [1, 0, 0]));
  const v = cross3(normalized(normal), u);
  const angle = p => {
    const d = p.map((x, i) => x - center[i]);
    return Math.atan2(dotN(d, v), dotN(d, u));
  };
  return points.sort((a, b) => angle(a) - angle(b));
}

export function rotateXW([x, y, z, w], angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [x * c - w * s, y, z, x * s + w * c];
}

export function tesseractSlice(angle, level) {
  const square = hypercube(2);
  square.vertices = square.vertices.map(([x, w]) => {
    const [a, , , b] = rotateXW([x, 0, 0, w], angle);
    return [a, b];
  });
  const cut = planeIntersections(square, [0, 1], level);
  if (!cut.length) return null;
  const xs = cut.map(([x]) => x);
  return [Math.min(...xs), Math.max(...xs)];
}

export function ribbonComponents(twisted) {
  return twisted ? [[-1, 1]] : [[-1], [1]];
}

export function ribbonPoint(u, v, twisted) {
  const half = twisted ? u / 2 : 0;
  const r = 1 + v * Math.cos(half);
  return [r * Math.cos(u), r * Math.sin(u), v * Math.sin(half)];
}
