import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { halls } from '../src/catalog.js';
import { plates, icon } from '../src/art.js';
import { dist, pt, ellipseString, voronoiCells } from '../src/math.js';
import { area3, compareCubeCuts, cubeCut, cubeSection, dotN, hypercube, rotateXW, tesseractSlice, ribbonLap, ribbonPoint, ribbonComponents, spherePoint, visibleSphericalPolygon } from '../src/spatial-math.js';
import { elementsTalks } from '../src/elements-talks.js';
import { labTalks } from '../src/lab-talks.js';
import { hallChats, geometryWiki, geometryTalks } from '../src/geometry-story-data.js';
import { voiceClips } from '../src/voice-manifest.js';
import { clipId } from '../src/voice-key.js';
import { comparisonInverse, comparisonPoint, comparisonTriangles } from '../src/curvature-math.js';
import { squareSlice } from '../src/labs/shear-stack.js';
import { rollingPoint } from '../src/labs/cycloid.js';
import { hexPatch } from '../src/labs/dual-tiling.js';
import { triangulatedSheet } from '../src/labs/euler-holes.js';
import { convexHull } from '../src/labs/convex-hull.js';
import { pinholePoint } from '../src/labs/perspective-rail.js';
import { conicSection } from '../src/labs/conic-slices.js';
import { chaosTrace } from '../src/labs/chaos-game.js';
import { challengeCheer, challengeHint, featuredQuestions, homeShowcase, questionTitle } from '../src/question-catalog.js';
import { loadLabMode } from '../src/lab-modes.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);

test('every lab id lazily resolves to its lab function', async () => {
  for (const { id } of halls.flatMap(h => h.lessons)) {
    assert.equal(typeof await loadLabMode(id), 'function', id);
  }
});

test('one triangle has excess on the sphere and deficit in the disk, shrinking toward the flat sum', () => {
  for (const x of [-.86, 0, .86]) {
    for (const y of [-1.24, -.17]) {
      const tip = pt(x, y), big = comparisonTriangles(tip, 1).totals, small = comparisonTriangles(tip, .15).totals;
      near(big.plane, 180);
      near(small.plane, 180);
      assert.ok(big.disk < small.disk && small.disk < 180);
      assert.ok(big.sphere > small.sphere && small.sphere > 180);
    }
  }
});

test('drag inversion preserves the shared bearing and distance across all three views', () => {
  const scale = .85, tip = pt(-.77, -1.18), world = pt(tip.x * scale, tip.y * scale);
  for (const kind of ['plane', 'sphere', 'disk']) {
    const restored = comparisonInverse(comparisonPoint(world, kind), kind, scale);
    near(restored.x, tip.x);
    near(restored.y, tip.y);
    assert.ok(Number.isFinite(comparisonInverse(pt(5, -12), kind, scale).y));
  }
});

test('all ten halls are illustrated, offer multiple labs, and have unique routes', () => {
  assert.equal(new Set(halls.map(h => h.id)).size, 10);
  const lessons = halls.flatMap(h => h.lessons);
  assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length);
  for (const hall of halls) {
    assert.ok(plates[hall.id]);
    assert.ok(!icon(hall.id).includes('undefined'));
    assert.ok(hall.lessons.length >= 2, hall.id);
  }
  assert.ok(halls.find(h => h.id === 'euclid').lessons.some(l => l.id === 'centers'));
  assert.ok(halls.find(h => h.id === 'mosaics').lessons.some(l => l.id === 'tiling'));
  for (const [hall, id] of Object.entries({
    solids: 'shear-stack', curves: 'cycloid', mosaics: 'dual-tiling',
    topology: 'euler-holes', computational: 'convex-hull', dimensions: 'cube-growth',
  })) assert.ok(halls.find(h => h.id === hall).lessons.some(l => l.id === id), id);
});

test('homepage questions belong to their topic and every topic has sourced geometry stories', () => {
  for (const hall of halls) {
    const featured = featuredQuestions(hall);
    assert.equal(new Set(featured).size, 2, hall.id);
    for (const lesson of featured) {
      assert.ok(hall.lessons.includes(lesson), hall.id);
      assert.match(questionTitle(lesson), /？$/);
    }
    const stories = geometryWiki.filter(story => story.hall === hall.id);
    assert.ok(stories.length >= 2, hall.id);
    assert.ok(stories.some(story => story.source?.[0] && new URL(story.source[1]).protocol === 'https:'), hall.id);
    for (const story of stories) assert.ok(hall.lessons.some(lesson => lesson.id === story.relatedLabId), story.id);
  }
});

test('shear displaces higher sections farther without changing their area or height', () => {
  for (const shear of [-4, 0, 4]) {
    for (const level of [0, 1.5, 6]) {
      const slice = squareSlice(level, shear);
      near(area3(slice), 16);
      assert.ok(slice.every(p => p[2] === level));
      near(slice[0][0], shear * level / 6);
    }
  }
});

test('rolling point follows center translation, a rim cusp, and a loop beyond the rim', () => {
  const radius = 2, turn = 2 * Math.PI;
  assert.deepEqual(rollingPoint(Math.PI, radius, 0), pt(Math.PI * radius, radius));
  const contact = rollingPoint(turn, radius, radius);
  near(contact.x, turn * radius);
  near(contact.y, 0);
  assert.ok(rollingPoint(turn + .1, radius, radius * 1.5).x < contact.x);
  const a = rollingPoint(turn - Math.PI / 2, radius, Math.PI);
  const b = rollingPoint(turn + Math.PI / 2, radius, Math.PI);
  near(dist(a, b), 0);
});

test('the hex tiling dual connects only nearest neighbors, forming an equilateral triangle', () => {
  const { cells, links } = hexPatch(3, 10);
  const center = cells.get('0,0');
  const neighbors = links.filter(pair => pair.includes(center)).map(pair => pair.find(cell => cell !== center));
  assert.equal(cells.size, 37);
  assert.equal(neighbors.length, 6);
  assert.equal(new Set(links.map(([a, b]) => [a, b].map(p => `${p.q},${p.r}`).sort().join('|'))).size, links.length);
  for (const [a, b] of links) near(dist(a.center, b.center), 10 * Math.sqrt(3));
  assert.ok(links.some(pair => pair.includes(cells.get('1,0')) && pair.includes(cells.get('0,1'))));
});

test('sheet triangulation counts shared edges once and only a hole changes the characteristic', () => {
  const counts = (n, hole) => {
    const sheet = triangulatedSheet(n, hole);
    return [sheet.vertices.size, sheet.edges.size, sheet.faces.length, sheet.characteristic];
  };
  assert.deepEqual(counts(4, false), [25, 56, 32, 1]);
  assert.deepEqual(counts(4, true), [24, 48, 24, 0]);
  for (const n of [8, 12]) {
    assert.equal(counts(n, false).at(-1), 1);
    assert.equal(counts(n, true).at(-1), 0);
  }
});

test('convex hull removes interior, collinear, and duplicate points until one moves outside', () => {
  const corners = [pt(0, 0), pt(4, 0), pt(4, 4), pt(0, 4)];
  assert.deepEqual(convexHull([...corners, pt(1, 1), pt(1, 0), pt(4, 4)]), corners);
  const outside = pt(2, -1);
  assert.deepEqual(convexHull([...corners, outside]), [corners[0], outside, ...corners.slice(1)]);
  assert.deepEqual(convexHull([pt(0, 0), pt(2, 0), pt(1, 0)]), [pt(0, 0), pt(2, 0)]);
});

test('pinhole projection halves apparent width at double depth and keeps each rail aimed at the vanishing point', () => {
  const width = (depth, focal) => dist(pinholePoint(-1, -1.65, depth, focal), pinholePoint(1, -1.65, depth, focal));
  near(width(6, 210), 70);
  near(width(12, 210) / width(6, 210), .5);
  for (const x of [-1, 1]) {
    for (const z of [3, 6, 12, 21]) {
      const p = pinholePoint(x, -1.65, z, 250);
      near(p.y / p.x, 1.65 / x);
    }
  }
});

test('the cone intersection is closed below the generator angle and visits both halves above it', () => {
  for (const [angle, label] of [[0, '圆'], [22, '椭圆'], [44, '椭圆'], [45, '抛物线'], [46, '双曲线'], [68, '双曲线'], [70, '双曲线']]) {
    const section = conicSection(angle);
    assert.equal(section.kind, label);
    for (const branch of section.branches) {
      for (const p of branch.points) {
        const [x, y, z] = section.world(p);
        near(x ** 2 + z ** 2, y ** 2);
        assert.ok(Math.abs(y) <= 2.5 + 1e-8);
        assert.equal(branch.side, y < 0 ? 'lower' : 'upper');
      }
    }
  }
  assert.ok(conicSection(0).branches[0].closed && conicSection(22).branches[0].closed);
  assert.deepEqual(conicSection(45).branches.map(b => [b.side, b.closed]), [['upper', false]]);
  assert.deepEqual(new Set(conicSection(68).branches.map(b => b.side)), new Set(['upper', 'lower']));
});

test('the reproducible chaos trace moves exactly half a step and leaves a triangle hole but visits the square center', () => {
  const triangle = [pt(0, 0), pt(1, 0), pt(0, 1)], square = [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)];
  const n = 1500, trace = chaosTrace(triangle, .5, n, 5);
  let prev = triangle[0];
  for (const { p, target } of trace) {
    const v = triangle[target];
    near(p.x, (prev.x + v.x) / 2);
    near(p.y, (prev.y + v.y) / 2);
    assert.ok(Math.max(p.x, p.y, 1 - p.x - p.y) >= .5);
    prev = p;
  }
  assert.deepEqual(trace.slice(0, 20), chaosTrace(triangle, .5, 20, 5));
  assert.ok(chaosTrace(square, .5, n, 5).some(({ p }) => dist(p, pt(.5, .5)) < .04));
  assert.ok(chaosTrace(square, .65, n, 5).every(({ p }) => Math.abs(p.x - .5) >= .15 - 1e-8));
});

test('cube sections are ordered on the cutting plane and change with offset', () => {
  const normal = [1, 1, 1], hex = cubeSection(normal, 0);
  assert.equal(hex.length, 6);
  for (const [i, p] of hex.entries()) {
    near(dotN(p, normal), 0);
    near(Math.hypot(...p.map((x, axis) => x - hex[(i + 1) % 6][axis])), Math.SQRT2);
  }
  assert.equal(cubeSection(normal, 2).length, 3);
  assert.equal(cubeSection(normal, 3).length, 1);
  assert.deepEqual(cubeSection(normal, 3.1), []);
  assert.equal(cubeSection([0, 1, 0], 1).length, 4);
  near(area3(hex), 3 * Math.sqrt(3));
  const shifted = cubeSection(normal, .75);
  assert.equal(shifted.length, 6);
  assert.ok(area3(shifted) < area3(hex));
  near(area3(cubeSection(normal, 2)), Math.sqrt(3) / 2);
  near(area3(cubeSection([1, 1, 0], 2)), 0);
});

test('cube notebook compares equivalent cut directions and rejects misleading evidence', () => {
  const diagonal = offset => cubeCut('diagonal', offset);
  const a = diagonal(0), b = diagonal(25);
  near(b.area, Math.sqrt(3) * (3 - .75 ** 2));
  assert.equal(compareCubeCuts(a, b), 'match');
  assert.equal(compareCubeCuts(null, b), 'waiting');
  assert.equal(compareCubeCuts(a, diagonal(110)), 'empty');
  assert.equal(compareCubeCuts(a, diagonal(75)), 'edges');
  assert.equal(compareCubeCuts(b, diagonal(-25)), 'area');
  assert.equal(compareCubeCuts(a, diagonal(1)), 'area');
  assert.equal(compareCubeCuts(a, cubeCut('face', 0)), 'direction');
  assert.equal(compareCubeCuts(cubeCut('face', 0), cubeCut('face', 25)), 'area');
  const planarArea = points => Math.abs(points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p.x * q.y - p.y * q.x;
  }, 0)) / 2;
  for (const cut of [a, b]) near(planarArea(cut.outline), cut.area);
});

test('a spherical triangle crossing the limb only fills the front hemisphere', () => {
  const a = spherePoint(0, -Math.PI / 4), b = spherePoint(0, Math.PI / 4), pole = [0, 1, 0];
  const triangle = [pole, a, b];
  assert.deepEqual(visibleSphericalPolygon(triangle, [0, 0, 1]), triangle);
  assert.deepEqual(visibleSphericalPolygon(triangle, [0, -1, -1]), []);
  const eye = [1, -.25, 0], visible = visibleSphericalPolygon(triangle, eye);
  assert.equal(visible.length, 3);
  assert.ok(visible.includes(b));
  for (const q of visible.filter(p => p !== b)) {
    near(Math.hypot(...q), 1);
    near(dotN(q, eye), 0);
  }
});

test('the taut string keeps its length when the pencil or foci move', () => {
  for (const c of [0, 4, 9.5]) {
    for (const angle of [0, .6, 2, 4]) {
      const { b, foci, pencil } = ellipseString(10, c, angle);
      near(dist(pencil, foci[0]) + dist(pencil, foci[1]), 20);
      if (!c) { near(b, 10); near(dist(pencil, pt(0, 0)), 10); }
    }
  }
});

test('Voronoi cells meet along the equal-distance boundary and update as stations move', () => {
  const bounds = [pt(0, 0), pt(10, 0), pt(10, 10), pt(0, 10)];
  for (const secondX of [7, 9]) {
    const sites = [pt(1, 5), pt(secondX, 5)];
    const [left, right] = voronoiCells(sites, bounds);
    const split = (1 + secondX) / 2;
    assert.equal(Math.max(...left.map(p => p.x)), split);
    assert.equal(Math.min(...right.map(p => p.x)), split);
    for (const p of left.filter(p => p.x === split)) near(dist(p, sites[0]), dist(p, sites[1]));
  }
});

test('opposite ribbon halves join across a twist but not across a plain seam', () => {
  for (const twisted of [false, true]) {
    const sign = twisted ? -1 : 1;
    for (const p of [-.2, .2]) {
      const seam = ribbonPoint(2 * Math.PI, p, twisted);
      seam.forEach((value, i) => near(value, ribbonPoint(0, sign * p, twisted)[i]));
    }
  }
  assert.deepEqual(ribbonComponents(true), [[-1, 1]]);
  assert.deepEqual(ribbonComponents(false), [[-1], [1]]);
  assert.deepEqual(ribbonLap(1, true), [0, -1]);
  const locate = (turn, twist) => {
    const [u, side] = ribbonLap(turn, twist);
    return ribbonPoint(u, side * .18, twist);
  };
  for (const twist of [false, true]) {
    const start = locate(0, twist);
    locate(twist ? 2 : 1, twist).forEach((value, i) => near(value, start[i]));
  }
  assert.ok(Math.hypot(...locate(0, true).map((value, i) => value - locate(1, true)[i])) > .3);
});

test('4D wireframe and rotated slices include the cube, box, and outside cases', () => {
  const { vertices, edges } = hypercube(4);
  assert.equal(vertices.length, 16);
  assert.equal(edges.length, 32);
  for (const [a, b] of edges) assert.equal(vertices[a].filter((x, i) => x !== vertices[b][i]).length, 1);
  assert.deepEqual(tesseractSlice(0, 0), [-1, 1]);
  const slice = tesseractSlice(Math.PI / 4, 1);
  near(slice[1] - slice[0], 2 * (Math.SQRT2 - 1));
  assert.equal(tesseractSlice(Math.PI / 4, 1.5), null);
  near(Math.hypot(...rotateXW(vertices[0], .8)), 2);
});

test('all labs, halls, wiki stories, and Q&As have dialogue coverage and bundled audio', async () => {
  const lessons = halls.flatMap(h => h.lessons);
  const lessonIds = new Set(lessons.map(l => l.id));
  const combinedTalkIds = [...Object.keys(elementsTalks), ...Object.keys(labTalks)].sort();
  assert.deepEqual(combinedTalkIds, [...lessonIds].sort());

  for (const [id, turns] of Object.entries(labTalks)) {
    assert.equal(turns.length, 3, `${id} turns`);
    assert.equal(new Set(turns.map(t => JSON.stringify(t.scene))).size, 3, `${id} distinct scenes`);
  }

  for (const hall of halls) {
    assert.ok(hallChats[hall.id]?.length === 2, `hallChat for ${hall.id}`);
    assert.ok(geometryWiki.some(w => w.hall === hall.id), `wiki for ${hall.id}`);
    assert.ok(geometryTalks.some(t => t.hall === hall.id), `talks for ${hall.id}`);
  }
  for (const w of geometryWiki) assert.ok(lessonIds.has(w.relatedLabId), `wiki relatedLabId ${w.relatedLabId}`);

  const lines = [];
  assert.deepEqual([...new Set(homeShowcase.map(star => star.hall))].sort(), halls.map(h => h.id).sort());
  for (const star of homeShowcase) assert.ok(lessonIds.has(star.play[0]), `home showcase ${star.id} → ${star.play[0]}`);
  for (const [n, d] of Object.values(hallChats)) { lines.push(['nian', n], ['dad', d]); }
  for (const w of geometryWiki) lines.push(['dad', `${w.scientist}的故事：${w.title}。${w.story} ${w.homeLab}`]);
  for (const t of geometryTalks) {
    for (const turn of t.turns) lines.push(['nian', turn.nian], ['dad', turn.dad]);
    lines.push(['nian', t.wrap]);
  }
  for (const turns of Object.values(labTalks)) {
    for (const turn of turns) lines.push(['nian', turn.nian], ['dad', turn.dad]);
  }
  for (const l of lessons) {
    lines.push(['nian', challengeCheer(l)], ['dad', l.idea]);
  }
  lines.push(['dad', challengeHint]);

  for (const [who, text] of lines) {
    const hash = clipId(who, text);
    assert.ok(voiceClips.has(hash), `missing voice clip entry for ${who}: ${text}`);
    const path = new URL(`../public/voice/clips/${hash}.mp3`, import.meta.url);
    assert.ok((await stat(path)).size > 1024, `clip ${hash}.mp3`);
  }
});
