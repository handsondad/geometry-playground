import test from 'node:test';
import assert from 'node:assert/strict';
import { pt, sub, dist, dot, norm, area, polygonArea, perimeter, intersections, triangleCenters, koch, sierpinski, geodesic,
  hyperbolicAngles, treeLevels, interiorAngle, cornerTile, pythagorasFigure, pythagorasDissection,
  reflectionShot, symmetryImages, sangaku, angleAt, geodesicAngle, geodesicThrough, diskTranslate, hyperbolicTiling,
  goldenRatio, goldenAngle, vogelSpiral, spiralFamilies, penroseTriangles, timesTableEnvelope, cross, mul } from '../src/math.js';
import { cross3, dotN, platonicSolids } from '../src/spatial-math.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);
const triangle = [pt(0, 0), pt(1, 0), pt(.5, Math.sqrt(3) / 2)];

test('equal compass circles yield both equilateral vertices and a midpoint', () => {
  const [a, b] = triangle;
  const [c, p] = intersections({ c: a, r: 1 }, { c: b, r: 1 });
  for (const q of [c, p]) { near(dist(a, q), 1); near(dist(b, q), 1); }
  const [m] = intersections({ a, b }, { a: c, b: p });
  near(dist(a, m), .5);
  near(dist(b, m), .5);
});

test('free constructions handle tangent, disjoint, and parallel lines', () => {
  const unit = { c: pt(0, 0), r: 1 };
  assert.deepEqual(intersections(unit, { a: pt(0, 1), b: pt(1, 1) }), [pt(0, 1)]);
  assert.deepEqual(intersections(unit, { a: pt(0, 2), b: pt(1, 2) }), []);
  assert.deepEqual(intersections(unit, { c: pt(2, 0), r: 1 }), [pt(1, 0)]);
  assert.deepEqual(intersections({ a: pt(0, 0), b: pt(1, 0) }, { a: pt(0, 1), b: pt(1, 1) }), []);
});

test('triangle centers match a right triangle and reject a collinear triangle', () => {
  const a = pt(0, 0), b = pt(4, 0), c = pt(0, 3);
  const centers = triangleCenters([a, b, c]);
  assert.deepEqual(centers.centroid, pt(4 / 3, 1));
  assert.deepEqual(centers.circumcenter, pt(2, 1.5));
  assert.deepEqual(centers.incenter, pt(1, 1));
  assert.equal(centers.inradius, 1);
  assert.equal(triangleCenters([a, b, pt(8, 0)]), null);
});

test('fractal recursion yields the actual counts, perimeter and areas', () => {
  for (const n of [0, 1, 4]) {
    const points = koch(triangle, n), pieces = sierpinski(triangle, n);
    assert.equal(points.length, 3 * 4 ** n);
    assert.equal(pieces.length, 3 ** n);
    near(points.reduce((sum, p, i) => sum + dist(p, points[(i + 1) % points.length]), 0), 3 * (4 / 3) ** n);
    near(pieces.reduce((sum, p) => sum + area(p), 0), area(triangle) * (.75 ** n));
  }
});

test('Koch snowflake perimeter grows without bound while its area approaches 8/5 inside the circumcircle', () => {
  const center = pt(.5, Math.sqrt(3) / 6), radius = dist(center, triangle[0]);
  for (const n of [0, 1, 2, 5]) {
    const points = koch(triangle, n);
    near(perimeter(points), 3 * (4 / 3) ** n);
    near(polygonArea(points) / area(triangle), 1 + .6 * (1 - (4 / 9) ** n));
    assert.ok(Math.max(...points.map(p => dist(p, center))) <= radius + 1e-9);
  }
});

test('Poincare geodesics pass through P and meet the boundary orthogonally', () => {
  const p = pt(0, -.45);
  for (const direction of [pt(1, 0), pt(1, .6), pt(-1, 2)]) {
    const { center, radius, ends } = geodesic(p, direction);
    near(dist(p, center), radius);
    for (const e of ends) {
      near(norm(e), 1);
      near(dist(e, center), radius);
      near(dot(e, e) - dot(e, center), 0);
    }
  }
  const diameter = geodesic(p, pt(0, 1));
  assert.equal(diameter.center, undefined);
  near(dist(...diameter.ends), 2);
});

test('a symmetric hyperbolic right triangle has positive and increasing angle deficit', () => {
  const sum = r => {
    const [a, b, c] = hyperbolicAngles([pt(0, 0), pt(r, 0), pt(0, r)]);
    near(a, Math.PI / 2);
    near(b, Math.atan((1 - r ** 2) / (1 + r ** 2)));
    near(b, c);
    return a + b + c;
  };
  assert.ok(sum(.7) < sum(.15) && sum(.15) < Math.PI);
  assert.equal(hyperbolicAngles([pt(0, 0), pt(.4, 0), pt(-.5, 0)]), null);
  assert.equal(hyperbolicAngles([pt(0, 0), pt(.4, 0), pt(.4, 0)]), null);
});

test('tree branch ratios and attachment hold for each generated level', () => {
  const levels = treeLevels(3, .7, Math.PI / 6);
  assert.deepEqual(levels.map(branches => branches.length), [1, 2, 4, 8]);
  for (let i = 1; i < levels.length; i++) {
    for (const [j, { start, end }] of levels[i].entries()) {
      assert.deepEqual(start, levels[i - 1][Math.floor(j / 2)].end);
      near(dist(start, end), .7 ** i);
    }
  }
});

test('tiles with mixed side counts share complete edges at a filled vertex', () => {
  const pattern = [6, 3, 6, 3], n = 8;
  let heading = 0;
  const tiles = pattern.map(sides => {
    const tile = cornerTile(pt(0, 0), n, sides, heading);
    heading += interiorAngle(sides) * Math.PI / 180;
    for (const [i, p] of tile.entries()) near(dist(p, tile[(i + 1) % sides]), n);
    return tile;
  });
  near(heading, 2 * Math.PI);
  for (const [i, tile] of tiles.entries()) near(dist(tile.at(-1), tiles[(i + 1) % tiles.length][1]), 0);
});

test('Euclid’s two pairs of congruent triangles connect each square to its rectangle', () => {
  const quadArea = ([a, b, c, d]) => area([a, b, c]) + area([a, c, d]);
  const sides = tri => tri.map((p, i) => dist(p, tri[(i + 1) % 3])).sort((a, b) => a - b);
  for (const degrees of [27, 42, 63]) {
    const f = pythagorasFigure(pt(0, 0), pt(8, 0), degrees * Math.PI / 180);
    near(dot(sub(f.b, f.a), sub(f.c, f.a)), 0);
    for (const [i, square, [u, v]] of [[0, f.left, f.leftBridge], [1, f.right, f.rightBridge]]) {
      sides(u).forEach((len, j) => near(len, sides(v)[j]));
      near(quadArea(square), 2 * area(u));
      near(quadArea(f.rectangles[i]), 2 * area(v));
    }
    near(quadArea(f.left) + quadArea(f.right), quadArea(f.hypotenuse));
  }
});

test('four rigidly translated triangles leave the same area in both arrangements', () => {
  const quadArea = ([a, b, c, d]) => area([a, b, c]) + area([a, c, d]);
  for (const degrees of [27, 37, 45, 63]) {
    const side = 252, { pieces, center, corners } = pythagorasDissection(side, degrees * Math.PI / 180);
    for (const { from, to } of pieces) {
      const shift = sub(to[0], from[0]);
      to.forEach((p, i) => { near(p.x - from[i].x, shift.x); near(p.y - from[i].y, shift.y); });
    }
    const [p, q, r] = center;
    near(dot(sub(q, p), sub(r, q)), 0);
    const c = dist(...pieces[0].from.slice(1));
    for (const [i, p] of center.entries()) near(dist(p, center[(i + 1) % 4]), c);
    near(quadArea(center), corners.reduce((sum, square) => sum + quadArea(square), 0));
    near(quadArea(center) + pieces.reduce((sum, piece) => sum + area(piece.from), 0), side ** 2);
  }
});

test('a bank shot aims through the mirror image with equal incident and reflected angles', () => {
  const start = pt(0, 3), target = pt(10, 2), rail = 0;
  const { image, bounce } = reflectionShot(start, target, rail);
  assert.deepEqual(image, pt(10, -2));
  assert.deepEqual(bounce, pt(6, 0));
  near((bounce.x - start.x) / (start.y - rail), (target.x - bounce.x) / (target.y - rail));
});

test('rotation and reflection preserve radius and give eight distinct generic images', () => {
  const center = pt(4, 5), vertex = pt(5, 7);
  const images = symmetryImages(vertex, center, 4, true);
  assert.deepEqual(images[0], vertex);
  assert.deepEqual(images[1], pt(3, 7));
  assert.deepEqual(images[2], pt(2, 6));
  assert.equal(new Set(images.map(p => `${p.x.toFixed(5)},${p.y.toFixed(5)}`)).size, 8);
  for (const p of images) near(dist(p, center), dist(vertex, center));
});

test('the Sangaku small circle satisfies all three actual tangencies as the square scales', () => {
  for (const side of [1, 132, 330]) {
    const f = sangaku(side);
    for (const arc of f.arcs) near(dist(arc.center, f.center), arc.r + (arc.internal ? -f.r : f.r));
    near(f.r / side, 4 / 33);
  }
});

test('the five Platonic solids have regular faces and satisfy V − E + F = 2', () => {
  const expected = { tetrahedron: [4, 6, 4, 3], cube: [8, 12, 6, 4], octahedron: [6, 12, 8, 3], dodecahedron: [20, 30, 12, 5], icosahedron: [12, 30, 20, 3] };
  assert.deepEqual(platonicSolids.map(s => s.id), Object.keys(expected));
  for (const { id, vertices, edges, faces } of platonicSolids) {
    assert.deepEqual([vertices.length, edges.length, faces.length, faces[0].length], expected[id], id);
    assert.equal(vertices.length - edges.length + faces.length, 2);
    const length = ([a, b]) => Math.hypot(...vertices[a].map((x, i) => x - vertices[b][i]));
    for (const edge of edges) near(length(edge), length(edges[0]));
    for (const face of faces) {
      assert.equal(face.length, expected[id][3]);
      const [a, b, c] = face.map(n => vertices[n]);
      const normal = cross3(b.map((x, j) => x - a[j]), c.map((x, j) => x - b[j]));
      assert.ok(dotN(normal, a) > 0, `${id} face winds outward`);
    }
  }
});

test('Penrose deflation keeps every half-rhomb exact and the fat-to-thin ratio approaches the golden ratio', () => {
  let ratio = 0;
  for (let depth = 0; depth <= 6; depth++) {
    const tiles = penroseTriangles(depth), thin = tiles.filter(t => t.kind === 0).length, fat = tiles.length - thin;
    for (const { kind, a, b, c } of tiles) {
      near(angleAt(a, b, c) * 180 / Math.PI, kind ? 108 : 36);
      near(dist(a, b), goldenRatio ** -depth);
      near(dist(a, c), goldenRatio ** -depth);
    }
    if (depth > 1) assert.ok(Math.abs(fat / thin - goldenRatio) < Math.abs(ratio - goldenRatio));
    ratio = fat / thin;
  }
  assert.ok(Math.abs(ratio - goldenRatio) < 1e-4);
});

test('the {7,3} tiling puts three 120° corners at every vertex and translations keep its angles', () => {
  const tiles = hyperbolicTiling(7, 3, .02);
  assert.ok(tiles.length > 200);
  const shift = pt(.3, -.15);
  for (const tile of [tiles[0], tiles[40], tiles.at(-1)]) {
    assert.ok(tile.vertices.every(v => norm(v) < 1));
    for (const vertices of [tile.vertices, tile.vertices.map(v => diskTranslate(v, shift))]) {
      vertices.forEach((v, i) => near(geodesicAngle(v, vertices[(i + 1) % 7], vertices[(i + 6) % 7]), 2 * Math.PI / 3));
    }
  }
  const edges = tiles.slice(1, 30).flatMap(({ vertices }) => vertices.map((v, i) => geodesicThrough(v, vertices[(i + 1) % 7])));
  assert.ok(edges.some(edge => edge === null), 'some edges lie on diameters');
  for (const edge of edges.filter(Boolean)) near(dot(edge.center, edge.center), edge.radius ** 2 + 1);
  near(norm(diskTranslate(pt(0, 0), shift)), norm(shift));
});

test('golden-angle seeds form consecutive Fibonacci spiral families', () => {
  near(goldenAngle * 180 / Math.PI, 137.50776405003785);
  const fibonacci = [8, 13, 21, 34, 55, 89];
  for (const count of [120, 420]) {
    const [a, b] = spiralFamilies(vogelSpiral(count));
    assert.equal(fibonacci.indexOf(b) - fibonacci.indexOf(a), 1, `${count}: ${a}, ${b}`);
  }
  assert.deepEqual(spiralFamilies(vogelSpiral(420)), [34, 55]);
});

test('each times-table chord touches its epicycloid envelope', () => {
  for (const m of [2, 3, 4.5]) {
    for (const theta of [.3, 1.4, 2.9]) {
      const a = pt(Math.cos(theta), Math.sin(theta)), b = pt(Math.cos(m * theta), Math.sin(m * theta));
      const touch = timesTableEnvelope(theta, m), slope = sub(timesTableEnvelope(theta + 1e-6, m), timesTableEnvelope(theta - 1e-6, m));
      near(cross(sub(touch, a), sub(b, a)), 0);
      assert.ok(Math.abs(cross(mul(slope, 1e6), sub(b, a))) < 1e-5);
    }
  }
});
