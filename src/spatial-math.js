export function hypercube(dimension) {
  const vertices = Array.from({ length: 2 ** dimension }, (_, i) =>
    Array.from({ length: dimension }, (_, axis) => (i & (1 << axis)) ? 1 : -1));
  const edges = vertices.flatMap((_, i) => Array.from({ length: dimension }, (_, axis) => [i, i ^ (1 << axis)]).filter(([, j]) => j > i));
  return { vertices, edges };
}

export const dotN = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const mixN = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
export const normalized = p => { const length = Math.hypot(...p); return p.map(value => value / length); };
export const cross3 = ([a, b, c], [x, y, z]) => [b * z - c * y, c * x - a * z, a * y - b * x];
const eps = 1e-8;

export function planeBasis(normal) {
  const n = normalized(normal);
  const u = normalized(cross3(n, Math.abs(n[0]) > .8 ? [0, 1, 0] : [1, 0, 0]));
  return [u, cross3(n, u)];
}

export function area3(points) {
  const sum = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const edge = cross3(points[i], points[(i + 1) % points.length]);
    edge.forEach((value, j) => { sum[j] += value; });
  }
  return Math.hypot(...sum) / 2;
}

export function spherePoint(lat, lon) {
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

// For a convex polygon bounded by minor great-circle arcs, the chord and arc cross the same plane.
export function visibleSphericalPolygon(points, eye) {
  return points.flatMap((b, i) => {
    const a = points[(i + points.length - 1) % points.length];
    const da = dotN(a, eye), db = dotN(b, eye);
    const crossing = (da < 0 && db > 0) || (da > 0 && db < 0)
      ? [normalized(mixN(a, b, da / (da - db)))] : [];
    return db >= 0 ? [...crossing, b] : crossing;
  });
}

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
      push(mixN(vertices[i], vertices[j], t));
    }
  }
  return result;
}

const cube = hypercube(3);

export function cubeSection(normal, level) {
  const points = planeIntersections(cube, normal, level);
  if (points.length < 3) return points;
  const center = normal.map((_, i) => points.reduce((sum, p) => sum + p[i], 0) / points.length);
  const [u, v] = planeBasis(normal);
  const angle = p => {
    const d = p.map((x, i) => x - center[i]);
    return Math.atan2(dotN(d, v), dotN(d, u));
  };
  return points.sort((a, b) => angle(a) - angle(b));
}

export const cubeDirections = { face: [0, 1, 0], edge: [1, 1, 0], diagonal: [1, 1, 1] };

export function cubeCut(mode, offset) {
  const normal = cubeDirections[mode], extent = normal.reduce((a, b) => a + b);
  const level = offset * extent / 100, section = cubeSection(normal, level);
  const [u, v] = planeBasis(normal);
  const center = normal.map((_, i) => section.reduce((sum, p) => sum + p[i], 0) / Math.max(1, section.length));
  const outline = section.map(p => {
    const d = p.map((x, i) => x - center[i]);
    return { x: dotN(d, u), y: -dotN(d, v) };
  });
  return { mode, offset, normal, level, section, outline, area: area3(section), u, v };
}

export function compareCubeCuts(a, b) {
  if (!a || !b) return 'waiting';
  if (a.section.length < 3 || b.section.length < 3) return 'empty';
  if (a.mode !== b.mode) return 'direction';
  if (a.section.length !== b.section.length) return 'edges';
  if (Math.abs(a.area - b.area) < .01) return 'area';
  return 'match';
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

/** Faces of the convex hull of points around the origin, each listed counter-clockwise as seen from outside. */
export function convexFaces(points) {
  const faces = new Map();
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) for (let k = j + 1; k < points.length; k++) {
    let normal = cross3(points[j].map((x, n) => x - points[i][n]), points[k].map((x, n) => x - points[i][n]));
    if (Math.hypot(...normal) < 1e-6) continue;
    normal = normalized(normal);
    if (dotN(normal, points[i]) < 0) normal = normal.map(x => -x);
    const level = dotN(normal, points[i]);
    if (points.some(p => dotN(normal, p) > level + 1e-6)) continue;
    const face = points.flatMap((p, n) => Math.abs(dotN(normal, p) - level) < 1e-6 ? [n] : []);
    const key = face.join(',');
    if (faces.has(key)) continue;
    const center = [0, 1, 2].map(axis => face.reduce((sum, n) => sum + points[n][axis], 0) / face.length);
    const u = normalized(points[face[0]].map((x, axis) => x - center[axis])), v = cross3(normal, u);
    const turn = n => { const d = points[n].map((x, axis) => x - center[axis]); return Math.atan2(dotN(d, v), dotN(d, u)); };
    faces.set(key, face.sort((a, b) => turn(a) - turn(b)));
  }
  return [...faces.values()];
}

const phi = (1 + Math.sqrt(5)) / 2;
const signed = (...values) => values.reduce((list, value) => list.flatMap(p => value ? [[...p, value], [...p, -value]] : [[...p, 0]]), [[]]);
const cyclic = list => list.flatMap(([a, b, c]) => [[a, b, c], [b, c, a], [c, a, b]]);

/** The five Platonic solids on the unit sphere, with faces and edges read off their convex hulls. */
export const platonicSolids = [
  ['tetrahedron', [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]],
  ['cube', signed(1, 1, 1)],
  ['octahedron', cyclic(signed(1, 0, 0))],
  ['dodecahedron', [...signed(1, 1, 1), ...cyclic(signed(0, 1 / phi, phi))]],
  ['icosahedron', cyclic(signed(0, 1, phi))],
].map(([id, raw]) => {
  const vertices = raw.map(normalized), faces = convexFaces(vertices);
  const edges = [...new Set(faces.flatMap(face => face.map((a, i) => {
    const b = face[(i + 1) % face.length];
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  })))].map(key => key.split('-').map(Number));
  return { id, vertices, faces, edges };
});

function axisTurn([x, y, z], angle) {
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}
const apply = (m, p) => m.map(row => dotN(row, p));
const compose = (m, n) => m.map(row => [0, 1, 2].map(j => row.reduce((sum, value, k) => sum + value * n[k][j], 0)));

/**
 * Folds a net of unit squares (grid cells [column, row], joined edge to edge) about every shared edge by `angle`,
 * all creases turning the same way. Faces hang off cell 0 as a breadth-first tree.
 */
export function foldNet(cells, angle) {
  const placed = [{ cell: 0, parent: -1, m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], t: [0, 0, 0] }];
  for (let i = 0; i < placed.length; i++) {
    const { cell, m, t } = placed[i], [pc, pr] = cells[cell];
    cells.forEach(([c, r], j) => {
      if (Math.abs(c - pc) + Math.abs(r - pr) !== 1 || placed.some(face => face.cell === j)) return;
      const w = [c - pc, r - pr, 0], axis = cross3(w, [0, 0, 1]), hinge = [(pc + c + 1) / 2, (pr + r + 1) / 2, 0];
      const turn = axisTurn(axis, angle), shift = hinge.map((x, k) => x - apply(turn, hinge)[k]);
      placed.push({ cell: j, parent: cell, m: compose(m, turn), t: apply(m, shift).map((x, k) => x + t[k]) });
    });
  }
  const faces = placed.map(({ cell, parent, m, t }) => {
    const [c, r] = cells[cell];
    const corners = [[c, r, 0], [c + 1, r, 0], [c + 1, r + 1, 0], [c, r + 1, 0]].map(p => apply(m, p).map((x, k) => x + t[k]));
    return { cell, parent, corners, center: [0, 1, 2].map(k => corners.reduce((sum, p) => sum + p[k], 0) / 4) };
  });
  const keys = new Set(faces.map(({ center }) => center.map(x => Math.round(x * 1e4)).join(',')));
  return { faces, connected: faces.length === cells.length, distinct: keys.size };
}

export function ribbonLap(turns, twisted, side = 1) {
  const laps = twisted ? 2 : 1;
  const lap = Math.min(Math.floor(turns), laps - 1);
  return [(turns - lap) * 2 * Math.PI, twisted && lap === 1 ? -side : side];
}
