import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { halls } from '../src/catalog.js';
import { plates, icon } from '../src/art.js';
import { dist, pt, ellipseString, voronoiCells } from '../src/math.js';
import { cubeSection, dotN, hypercube, rotateXW, tesseractSlice, ribbonPoint, ribbonComponents } from '../src/spatial-math.js';
import { elementsTalks } from '../src/elements-talks.js';
import { labTalks } from '../src/lab-talks.js';
import { hubChats, hallChats, geometryWiki, geometryTalks } from '../src/geometry-story-data.js';
import { voiceManifest } from '../src/voice-manifest.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);

test('all ten halls are illustrated, contain labs, and have unique routes', () => {
  assert.equal(new Set(halls.map(h => h.id)).size, 10);
  const lessons = halls.flatMap(h => h.lessons);
  assert.equal(new Set(lessons.map(l => l.id)).size, 26);
  for (const hall of halls) {
    assert.ok(plates[hall.id]);
    assert.ok(!icon(hall.id).includes('undefined'));
    assert.ok(hall.lessons.length > 0);
  }
  assert.ok(halls.find(h => h.id === 'euclid').lessons.some(l => l.id === 'centers'));
  assert.ok(halls.find(h => h.id === 'mosaics').lessons.some(l => l.id === 'tiling'));
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

test('all 26 labs, 10 halls, wiki stories, and Q&As have dialogue coverage and bundled audio', async () => {
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
  for (const [n, d] of hubChats) { lines.push(['nian', n], ['dad', d]); }
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
    lines.push(['nian', `太棒啦！我搞懂「${l.name}」的秘密啦！`], ['dad', l.idea]);
  }
  lines.push(['dad', '先别急着选，再看看画板或点「演示这轮」试试看！']);

  for (const [who, text] of lines) {
    const hash = voiceManifest[`${who}|${text.trim()}`];
    assert.ok(hash, `missing voiceManifest entry for ${who}: ${text}`);
    const path = new URL(`../public/voice/clips/${hash}.mp3`, import.meta.url);
    assert.ok((await stat(path)).size > 1024, `clip ${hash}.mp3`);
  }
});
