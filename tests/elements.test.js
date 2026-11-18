import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { angleAt, angleCopy, dist, pt } from '../src/math.js';
import { halls } from '../src/catalog.js';
import { volumeOne, readingSections, originalProposition } from '../src/elements-data.js';
import { elementsTalks } from '../src/elements-talks.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);

test('both sides of an angle copy are available and preserve all three defining lengths', () => {
  const o = pt(0, 0), a = pt(5, 0), b = pt(-3, 4), p = pt(17, 21), ray = pt(23, 24);
  for (const side of [-1, 1]) {
    const { mark, end } = angleCopy(p, ray, 5, dist(a, b), side);
    near(dist(p, mark), 5); near(dist(p, end), 5);
    near(dist(mark, end), dist(a, b));
    near(angleAt(p, mark, end), angleAt(o, a, b));
  }
});

test('copying an alternate interior angle yields a line parallel to the base', () => {
  for (const a of [pt(334, 139), pt(257, 84), pt(429, 184)]) {
    for (const d of [pt(191, 271), pt(274, 271)]) {
      const length = 70, ratio = length / dist(a, d), u = pt(d.x + (a.x - d.x) * ratio, d.y + (a.y - d.y) * ratio);
      const v = pt(d.x + length, d.y);
      const { end } = angleCopy(a, d, length, dist(u, v), 1);
      near(end.x, a.x - length);
      near(end.y, a.y);
    }
  }
});

test('the Book I index distinguishes covered propositions, supports dependencies, and keeps route ids stable', () => {
  const euclid = halls.find(h => h.id === 'euclid').lessons;
  assert.deepEqual(readingSections.flatMap(s => s.numbers), volumeOne.map(p => p.n));
  assert.deepEqual(volumeOne.map(p => p.n), [1, 9, 10, 11, 12, 23, 31, 32, 47]);
  assert.deepEqual(volumeOne.filter(p => [1, 9, 10, 47].includes(p.n)).map(p => p.id), ['equilateral', 'bisect-angle', 'midpoint', 'pythagoras']);
  for (const p of volumeOne) {
    assert.ok(euclid.some(l => l.id === p.id));
    assert.ok(p.uses.every(n => n < p.n));
    assert.ok(originalProposition(p.n).endsWith(`/propI${p.n}.html`));
  }
});

test('all Book I propositions have three illustrated two-speaker turns and bundled audio', async () => {
  assert.deepEqual(Object.keys(elementsTalks).sort(), volumeOne.map(p => p.id).sort());
  for (const [id, turns] of Object.entries(elementsTalks)) {
    assert.equal(turns.length, 3);
    assert.equal(new Set(turns.map(turn => turn.scene.join(':'))).size, 3);
    for (const [index, turn] of turns.entries()) {
      for (const role of ['nian', 'dad']) {
        assert.ok(turn[role].length > 8);
        const path = new URL(`../public/voice/elements/${id}-${index + 1}-${role}.mp3`, import.meta.url);
        assert.ok((await stat(path)).size > 1024, `${id} turn ${index + 1} ${role} audio`);
      }
    }
  }
});
