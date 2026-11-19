import test from 'node:test';
import assert from 'node:assert/strict';
import { pt, dist, norm, polygonArea, segmentsCross, isSimplePolygon, rayCrossings, insidePolygon, latticeCount,
  circumcircle, delaunay, visibilityPolygon, sees, eulerTrail, dragonCurve, theodorus, interiorAngle,
  hyperbolicTiling, geodesicAngle, diskTranslate } from '../src/math.js';
import { foldNet, platonicSolids } from '../src/spatial-math.js';
import { convexHull } from '../src/labs/convex-hull.js';

const near = (a, b, eps = 1e-8) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

function random(seed) {
  return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
}

test('simple polygons reject bow ties, repeated corners and vertices resting on another edge', () => {
  assert.ok(isSimplePolygon([pt(0, 0), pt(4, 0), pt(4, 3), pt(0, 3)]));
  assert.ok(!isSimplePolygon([pt(0, 0), pt(4, 3), pt(4, 0), pt(0, 3)]));
  assert.ok(!isSimplePolygon([pt(0, 0), pt(4, 0), pt(2, 0), pt(2, 3)]));
  assert.ok(!isSimplePolygon([pt(0, 0), pt(4, 0), pt(4, 4), pt(2, 0), pt(0, 4)]));
  assert.ok(segmentsCross(pt(0, 0), pt(2, 2), pt(0, 2), pt(2, 0)));
  assert.ok(!segmentsCross(pt(0, 0), pt(2, 0), pt(2, 0), pt(3, 1)));
});

test('Pick: counted lattice points always give I + B/2 − 1 = area', () => {
  const square = latticeCount([pt(0, 0), pt(3, 0), pt(3, 3), pt(0, 3)]);
  assert.deepEqual([square.interior, square.boundary, square.area], [4, 12, 9]);
  const rand = random(7);
  let checked = 0;
  for (let trial = 0; trial < 300; trial++) {
    const n = 3 + Math.floor(rand() * 5);
    const polygon = Array.from({ length: n }, (_, i) => {
      const angle = 2 * Math.PI * (i + rand() * .8) / n, r = 2 + rand() * 6;
      return pt(Math.round(8 + r * Math.cos(angle)), Math.round(8 + r * Math.sin(angle)));
    });
    if (!isSimplePolygon(polygon)) continue;
    const { interior, boundary, area } = latticeCount(polygon);
    near(interior + boundary / 2 - 1, area);
    checked++;
  }
  assert.ok(checked > 150, `${checked} random lattice polygons`);
});

test('every ray from a point crosses a closed curve an odd number of times exactly when the point is inside', () => {
  const band = [];
  for (let i = 0; i <= 160; i++) band.push(pt((40 + 26 * i / 40 * 2 + 14) * Math.cos(i / 40 * 2 * Math.PI), (40 + 26 * i / 40 * 2 + 14) * Math.sin(i / 40 * 2 * Math.PI)));
  for (let i = 160; i >= 0; i--) band.push(pt((40 + 26 * i / 40 * 2 - 14) * Math.cos(i / 40 * 2 * Math.PI), (40 + 26 * i / 40 * 2 - 14) * Math.sin(i / 40 * 2 * Math.PI)));
  assert.ok(isSimplePolygon(band));
  const rand = random(3);
  for (let k = 0; k < 200; k++) {
    const p = pt(rand() * 500 - 250, rand() * 500 - 250);
    const parities = [0, .7, 2.1, 3.5, 5].map(angle => rayCrossings(p, angle, band).length % 2);
    assert.ok(parities.every(x => x === parities[0]), 'parity does not depend on the direction');
    assert.equal(parities[0] === 1, insidePolygon(p, band));
  }
  const square = [pt(0, 0), pt(10, 0), pt(10, 10), pt(0, 10)];
  assert.equal(rayCrossings(pt(5, 5), 0, square).length, 1);
  assert.equal(rayCrossings(pt(5, 5), Math.PI / 4, square).length, 1, 'a ray through a corner counts once');
  assert.equal(rayCrossings(pt(-5, 0), 0, square).length % 2, 0, 'a ray along an edge keeps an outside point outside');
});

test('Delaunay triangles have empty circumcircles and number 2n − 2 − hull', () => {
  const rand = random(11);
  for (let trial = 0; trial < 20; trial++) {
    const points = Array.from({ length: 6 + trial % 7 }, () => pt(40 + rand() * 560, 40 + rand() * 320));
    const triangles = delaunay(points);
    assert.equal(triangles.length, 2 * points.length - 2 - convexHull(points).length);
    for (const t of triangles) {
      const { center, r } = circumcircle(...t.map(i => points[i]));
      points.forEach((p, i) => { if (!t.includes(i)) assert.ok(dist(p, center) > r - 1e-6); });
    }
    const area = triangles.reduce((sum, t) => sum + polygonArea(t.map(i => points[i])), 0);
    near(area, polygonArea(convexHull(points)), 1e-6);
  }
});

test('a guard sees all of a convex room but not around the teeth of a comb', () => {
  const room = [pt(0, 0), pt(10, 0), pt(12, 6), pt(5, 9), pt(-2, 5)];
  near(polygonArea(visibilityPolygon(pt(4, 4), room)), polygonArea(room), 1e-6);
  const comb = [pt(0, 10), pt(9, 10), pt(9, 0), pt(7, 0), pt(7, 6), pt(5.5, 6), pt(5.5, 0), pt(3.5, 0), pt(3.5, 6), pt(2, 6), pt(2, 0), pt(0, 0)];
  assert.ok(isSimplePolygon(comb));
  const guard = pt(1, 8);
  assert.ok(sees(guard, pt(1, 1), comb));
  assert.ok(!sees(guard, pt(8, 1), comb));
  const seen = polygonArea(visibilityPolygon(guard, comb));
  assert.ok(seen > 10 && seen < polygonArea(comb));
});

test('Königsberg has four odd shores; one more bridge makes a walk over every bridge exactly once', () => {
  const bridges = [[0, 1], [0, 1], [0, 2], [0, 2], [0, 3], [1, 3], [2, 3]];
  const city = eulerTrail(4, bridges);
  assert.deepEqual(city.degree, [5, 3, 3, 3]);
  assert.equal(city.odd.length, 4);
  assert.equal(city.trail, null);
  const more = [...bridges, [1, 2]];
  const { odd, trail } = eulerTrail(4, more);
  assert.deepEqual(odd, [0, 3]);
  assert.deepEqual([...trail.edges].sort((a, b) => a - b), more.map((_, i) => i));
  trail.edges.forEach((e, i) => assert.deepEqual([...more[e]].sort(), [trail.vertices[i], trail.vertices[i + 1]].sort()));
});

test('the paper-folding dragon doubles every fold and never walks a segment twice', () => {
  for (let n = 0; n <= 12; n++) {
    const points = dragonCurve(n);
    assert.equal(points.length - 1, 2 ** n);
    const seen = new Set();
    points.slice(1).forEach((p, i) => {
      near(dist(p, points[i]), 1, 1e-6);
      const [a, b] = [points[i], p].map(q => `${Math.round(q.x)},${Math.round(q.y)}`).sort();
      seen.add(`${a}|${b}`);
    });
    assert.equal(seen.size, 2 ** n, `${n} folds`);
  }
  const folded = dragonCurve(4, 0), half = 2 ** 3;
  for (let i = 0; i <= half; i++) near(dist(folded[i], folded[2 * half - i]), 0, 1e-9);
});

test('the spiral of Theodorus puts √k on the k-th spoke', () => {
  theodorus(16).forEach((p, i) => near(norm(p), Math.sqrt(i + 1), 1e-9));
});

function freeHexominoes() {
  const key = cells => {
    const xs = cells.map(([x]) => x), ys = cells.map(([, y]) => y), mx = Math.min(...xs), my = Math.min(...ys);
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(c => c.join(',')).join(' ');
  };
  const transforms = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x],
    ([x, y]) => [-x, y], ([x, y]) => [y, x], ([x, y]) => [x, -y], ([x, y]) => [-y, -x]];
  const canonical = cells => transforms.map(f => key(cells.map(f))).sort()[0];
  let shapes = new Map([[canonical([[0, 0]]), [[0, 0]]]]);
  for (let size = 2; size <= 6; size++) {
    const next = new Map();
    for (const cells of shapes.values()) {
      for (const [x, y] of cells) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (cells.some(([a, b]) => a === x + dx && b === y + dy)) continue;
          const grown = [...cells, [x + dx, y + dy]];
          next.set(canonical(grown), grown);
        }
      }
    }
    shapes = next;
  }
  return [...shapes.values()];
}

test('exactly 11 of the 35 hexominoes fold into a closed cube', () => {
  const hexominoes = freeHexominoes();
  assert.equal(hexominoes.length, 35);
  const closing = hexominoes.filter(cells => {
    const folded = foldNet(cells, Math.PI / 2);
    assert.ok(folded.connected);
    return folded.distinct === 6;
  });
  assert.equal(closing.length, 11);
  for (const cells of closing) {
    const corners = foldNet(cells, Math.PI / 2).faces.flatMap(face => face.corners);
    for (const axis of [0, 1, 2]) {
      const values = corners.map(p => p[axis]);
      near(Math.max(...values) - Math.min(...values), 1, 1e-9);
    }
  }
  const flat = foldNet(closing[0], 0).faces.flatMap(face => face.corners);
  assert.ok(flat.every(p => Math.abs(p[2]) < 1e-12));
});

test('a Platonic vertex leaves a gap, and 720° shared out over those gaps counts the vertices', () => {
  const solids = { tetrahedron: [3, 3], cube: [4, 3], octahedron: [3, 4], dodecahedron: [5, 3], icosahedron: [3, 5] };
  for (const { id, vertices, faces } of platonicSolids) {
    const [sides, around] = solids[id];
    assert.ok(faces.every(face => face.length === sides));
    near(720 / (360 - around * interiorAngle(sides)), vertices.length);
  }
  for (const [sides, around] of [[3, 6], [4, 4], [6, 3]]) near(around * interiorAngle(sides), 360);
});

test('a dragged hyperbolic tiling is the translated tiling, grown to the same detail on screen', () => {
  const shift = pt(.5, -.36), moved = hyperbolicTiling(7, 3, .022, 900, shift), still = hyperbolicTiling(7, 3, .022, 900);
  const first = moved[0].vertices;
  near(geodesicAngle(first[0], first[1], first[6]) * 3, 2 * Math.PI, 1e-9);
  const centers = new Set(moved.map(t => `,`));
  for (const tile of still.slice(0, 60)) {
    const c = diskTranslate(tile.center, shift);
    assert.ok(centers.has(`,`), 'every nearby original tile reappears after the translation');
  }
  assert.ok(moved.every(t => t.vertices.every(z => norm(z) < 1)));
});
