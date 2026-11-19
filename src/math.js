export const pt = (x, y) => ({ x, y });
export const add = (a, b) => pt(a.x + b.x, a.y + b.y);
export const sub = (a, b) => pt(a.x - b.x, a.y - b.y);
export const mul = (a, k) => pt(a.x * k, a.y * k);
export const mix = (a, b, t = .5) => add(a, mul(sub(b, a), t));
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const norm = a => Math.hypot(a.x, a.y);
export const dist = (a, b) => norm(sub(a, b));
export const perp = a => pt(-a.y, a.x);
export const rotate = (a, radians) => add(mul(a, Math.cos(radians)), mul(perp(a), Math.sin(radians)));
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const area = ([a, b, c]) => Math.abs(cross(sub(b, a), sub(c, a))) / 2;
export const polygonArea = points => Math.abs(points.reduce((sum, p, i) => sum + cross(p, points[(i + 1) % points.length]), 0)) / 2;
export const perimeter = points => points.reduce((sum, p, i) => sum + dist(p, points[(i + 1) % points.length]), 0);

export function intersections(a, b) {
  if (a.r !== undefined && b.r !== undefined) {
    const delta = sub(b.c, a.c), d = norm(delta);
    if (d < 1e-8 || d > a.r + b.r + 1e-8 || d < Math.abs(a.r - b.r) - 1e-8) return [];
    const u = mul(delta, 1 / d), t = (a.r ** 2 - b.r ** 2 + d ** 2) / (2 * d);
    const base = add(a.c, mul(u, t)), h = Math.sqrt(Math.max(0, a.r ** 2 - t ** 2));
    return h < 1e-7 ? [base] : [add(base, mul(perp(u), h)), add(base, mul(perp(u), -h))];
  }
  if (a.r !== undefined) return intersections(b, a);
  const u = sub(a.b, a.a);
  if (b.r !== undefined) {
    const v = sub(a.a, b.c), uu = dot(u, u);
    if (uu < 1e-12) return [];
    const t = -dot(u, v) / uu, base = add(a.a, mul(u, t));
    const h2 = (b.r ** 2 - dist(base, b.c) ** 2) / uu;
    if (h2 < -1e-10) return [];
    if (h2 < 1e-10) return [base];
    const h = Math.sqrt(h2);
    return [add(base, mul(u, h)), add(base, mul(u, -h))];
  }
  const v = sub(b.b, b.a), det = cross(u, v);
  return Math.abs(det) < 1e-8 ? [] : [add(a.a, mul(u, cross(sub(b.a, a.a), v) / det))];
}

export function triangleCenters([a, b, c]) {
  const u = sub(b, a), v = sub(c, a), det = 2 * cross(u, v);
  if (Math.abs(det) < 1e-7) return null;
  const [la, lb, lc] = [dist(b, c), dist(c, a), dist(a, b)];
  return {
    centroid: mul(add(add(a, b), c), 1 / 3),
    circumcenter: add(a, mul(sub(mul(perp(u), dot(v, v)), mul(perp(v), dot(u, u))), 1 / det)),
    incenter: mul(add(add(mul(a, la), mul(b, lb)), mul(c, lc)), 1 / (la + lb + lc)),
    inradius: Math.abs(det) / (2 * (la + lb + lc)),
  };
}

export function koch(points, depth) {
  for (let k = 0; k < depth; k++) {
    points = points.flatMap((a, i) => {
      const b = points[(i + 1) % points.length], u = mix(a, b, 1 / 3), v = mix(a, b, 2 / 3);
      return [a, u, add(u, rotate(sub(v, u), -Math.PI / 3)), v];
    });
  }
  return points;
}

export function sierpinski(triangle, depth) {
  let triangles = [triangle];
  for (let k = 0; k < depth; k++) {
    triangles = triangles.flatMap(([a, b, c]) => {
      const ab = mix(a, b), bc = mix(b, c), ca = mix(c, a);
      return [[a, ab, ca], [ab, b, bc], [ca, bc, c]];
    });
  }
  return triangles;
}

// Coordinates in the unit Poincare disk. Its boundary is not part of the plane.
export function geodesic(p, direction) {
  const n = perp(direction), w = dot(p, n);
  if (Math.abs(w) < 1e-8) {
    const u = mul(direction, 1 / norm(direction));
    return { ends: [mul(u, -1), u] };
  }
  const center = add(p, mul(n, (1 - dot(p, p)) / (2 * w)));
  const s = dot(center, center), base = mul(center, 1 / s);
  const offset = mul(perp(center), Math.sqrt(s - 1) / s);
  return { center, radius: Math.sqrt(s - 1), ends: [add(base, offset), sub(base, offset)] };
}

/** Angle at disk point a between the geodesics towards b and c. */
export function geodesicAngle(a, b, c) {
  const tangent = z => {
    // (z − a) / (1 − conjugate(a) z) sends a to the disk center.
    const u = sub(z, a), re = 1 - dot(a, z), im = cross(a, z);
    return pt(u.x * re - u.y * im, u.y * re + u.x * im);
  };
  const u = tangent(b), v = tangent(c);
  return Math.atan2(Math.abs(cross(u, v)), dot(u, v));
}

/** The circle through disk points u and v that meets the boundary at right angles; null when it is a diameter. */
export function geodesicThrough(u, v) {
  const det = cross(u, v);
  if (Math.abs(det) < 1e-9) return null;
  const ku = (dot(u, u) + 1) / 2, kv = (dot(v, v) + 1) / 2;
  const center = pt((ku * v.y - kv * u.y) / det, (kv * u.x - ku * v.x) / det);
  return { center, radius: Math.sqrt(dot(center, center) - 1) };
}

/** Hyperbolic reflection of z in the line through u and v: inversion in that circle, or a mirror in the diameter. */
export function geodesicReflect(z, u, v) {
  const circle = geodesicThrough(u, v);
  if (!circle) {
    const along = norm(u) > norm(v) ? u : v, w = mul(along, 1 / norm(along));
    return sub(mul(w, 2 * dot(z, w)), z);
  }
  const offset = sub(z, circle.center);
  return add(circle.center, mul(offset, circle.radius ** 2 / dot(offset, offset)));
}

/** Hyperbolic translation of the disk that carries the center to a: (z + a) / (1 + conjugate(a) z). */
export function diskTranslate(z, a) {
  const top = add(z, a), bottom = pt(1 + dot(a, z), cross(a, z)), size = dot(bottom, bottom);
  return pt((top.x * bottom.x + top.y * bottom.y) / size, (top.y * bottom.x - top.x * bottom.y) / size);
}

/**
 * Regular {p,q} tiling of the Poincaré disk: p-gons, q around each vertex, grown by reflecting tiles across their
 * edges. Tiles whose edges are shorter than minEdge (Euclidean) stop growing. A shift first carries the central tile
 * by that disk translation, so the tiling grows to the same on-screen detail wherever it is dragged.
 */
export function hyperbolicTiling(p, q, minEdge = .02, limit = 2000, shift = pt(0, 0)) {
  const r = Math.sqrt(Math.cos(Math.PI / p + Math.PI / q) / Math.cos(Math.PI / p - Math.PI / q));
  const first = { center: diskTranslate(pt(0, 0), shift), depth: 0,
    vertices: Array.from({ length: p }, (_, i) => diskTranslate(rotate(pt(0, -r), 2 * Math.PI * i / p), shift)) };
  const key = c => `${Math.round(c.x * 1e5)},${Math.round(c.y * 1e5)}`;
  const seen = new Set([key(first.center)]), tiles = [first];
  for (let i = 0; i < tiles.length && tiles.length < limit; i++) {
    const { center, vertices, depth } = tiles[i];
    vertices.forEach((u, k) => {
      const v = vertices[(k + 1) % p];
      if (dist(u, v) < minEdge) return;
      const image = geodesicReflect(center, u, v);
      if (seen.has(key(image))) return;
      seen.add(key(image));
      tiles.push({ center: image, depth: depth + 1, vertices: vertices.map(z => geodesicReflect(z, u, v)).reverse() });
    });
  }
  return tiles;
}

export function hyperbolicAngles(vertices) {
  const angles = vertices.map((a, i) => geodesicAngle(a, vertices[(i + 1) % 3], vertices[(i + 2) % 3]));
  if (angles.reduce((sum, angle) => sum + angle, 0) >= Math.PI - 1e-10 ||
      vertices.some((p, i) => dist(p, vertices[(i + 1) % 3]) < 1e-8)) return null;
  return angles;
}

export function treeLevels(depth, ratio, angle) {
  const levels = [[{ start: pt(0, 0), end: pt(0, -1) }]];
  for (let i = 0; i < depth; i++) {
    levels.push(levels[i].flatMap(({ start, end }) => {
      const direction = mul(sub(end, start), ratio);
      return [-angle, angle].map(turn => ({ start: end, end: add(end, rotate(direction, turn)) }));
    }));
  }
  return levels;
}

export const interiorAngle = sides => 180 - 360 / sides;

export function cornerTile(center, radius, sides, heading) {
  const points = [center];
  for (let i = 0; i < sides - 1; i++) {
    points.push(add(points[i], rotate(pt(radius, 0), heading + i * 2 * Math.PI / sides)));
  }
  return points;
}

export function pythagorasDissection(side, angle) {
  const a = side / (1 + Math.tan(angle)), b = side - a;
  const offsets = [
    [pt(0, 0), pt(a, 0), pt(0, b)],
    [pt(0, 0), pt(0, a), pt(-b, 0)],
    [pt(0, 0), pt(-a, 0), pt(0, -b)],
    [pt(0, 0), pt(0, -a), pt(b, 0)],
  ];
  const sources = [pt(0, 0), pt(side, 0), pt(side, side), pt(0, side)];
  const targets = [pt(0, a), pt(side, 0), pt(a, side), pt(a, a)];
  const pieces = offsets.map((piece, i) => ({
    from: piece.map(p => add(sources[i], p)),
    to: piece.map(p => add(targets[i], p)),
  }));
  const square = (lo, hi) => [pt(lo, lo), pt(hi, lo), pt(hi, hi), pt(lo, hi)];
  return { pieces, center: pieces.map(({ from }) => from[1]), corners: [square(0, a), square(a, side)] };
}

export function pythagorasFigure(b, c, angle) {
  const dx = dist(b, c), direction = mul(sub(c, b), 1 / dx);
  const along = dx * Math.cos(angle) ** 2;
  const d = add(b, mul(direction, along));
  const a = add(d, mul(perp(direction), -dx * Math.cos(angle) * Math.sin(angle)));
  const square = (u, v) => {
    const off = perp(sub(v, u));
    return [u, v, add(v, off), add(u, off)];
  };
  const left = square(a, b), right = square(c, a), hypotenuse = square(b, c);
  const [e, f] = hypotenuse.slice(2), g = add(d, sub(f, b));
  return { a, b, c, d, g, left, right, hypotenuse, rectangles: [[b, d, g, f], [d, c, e, g]],
    leftBridge: [[left[2], b, c], [a, b, f]], rightBridge: [[right[3], c, b], [a, c, e]] };
}

export function reflectionShot(start, target, railY) {
  const image = pt(target.x, 2 * railY - target.y);
  return { image, bounce: mix(start, image, (railY - start.y) / (image.y - start.y)) };
}

export function symmetryImages(p, center, order, mirror) {
  const offset = sub(p, center);
  return Array.from({ length: order }, (_, i) => {
    const angle = 2 * Math.PI * i / order;
    const image = add(center, rotate(offset, angle));
    return mirror ? [image, add(center, rotate(pt(-offset.x, offset.y), angle))] : [image];
  }).flat();
}

export function sangaku(side) {
  const r = 4 * side / 33;
  return { r, center: pt(3 * r, 5 * r), arcs: [
    { center: pt(side, 0), r: side, internal: true },
    { center: pt(0, side / 2), r: side / 2, internal: true },
    { center: pt(side / 2, 0), r: side / 2, internal: false },
  ] };
}

export function ellipseString(a, c, angle) {
  const b = Math.sqrt((a - c) * (a + c));
  return { b, foci: [pt(-c, 0), pt(c, 0)], pencil: pt(a * Math.cos(angle), b * Math.sin(angle)) };
}

export function voronoiCells(sites, bounds) {
  return sites.map((site, i) => sites.reduce((cell, other, j) => {
    if (j === i || !cell.length) return cell;
    const normal = sub(other, site), mid = mix(site, other);
    if (dot(normal, normal) < 1e-12) return j < i ? [] : cell;
    const signed = p => dot(sub(p, mid), normal);
    return cell.flatMap((a, k) => {
      const b = cell[(k + 1) % cell.length], va = signed(a), vb = signed(b);
      const crossing = (va <= 0) !== (vb <= 0) ? [mix(a, b, va / (va - vb))] : [];
      return va <= 0 ? [a, ...crossing] : crossing;
    });
  }, bounds));
}

export function angleCopy(origin, ray, radius, chord, side) {
  const direction = sub(ray, origin);
  const mark = add(origin, mul(direction, radius / norm(direction)));
  const end = intersections({ c: origin, r: radius }, { c: mark, r: chord })
    .find(p => Math.sign(cross(direction, sub(p, origin))) === side);
  return { mark, end };
}

export const angleAt = (origin, a, b) => {
  const u = sub(a, origin), v = sub(b, origin);
  return Math.atan2(Math.abs(cross(u, v)), dot(u, v));
};

export const goldenRatio = (1 + Math.sqrt(5)) / 2;
export const goldenAngle = Math.PI * (3 - Math.sqrt(5));

/** Vogel's sunflower model: seed n turns n golden angles and sits √n from the middle. */
export const vogelSpiral = (count, angle = goldenAngle) =>
  Array.from({ length: count }, (_, n) => rotate(pt(Math.sqrt(n), 0), n * angle));

/** The two spiral families the eye picks out among the outer seeds: their most common nearest-neighbour index gaps. */
export function spiralFamilies(points) {
  const counts = new Map();
  for (let n = Math.floor(points.length * .75); n < points.length; n++) {
    const near = points.map((p, k) => [dist(p, points[n]), k]).filter(([, k]) => k !== n).sort((a, b) => a[0] - b[0]).slice(0, 2);
    for (const [, k] of near) counts.set(Math.abs(k - n), (counts.get(Math.abs(k - n)) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([gap]) => gap).sort((a, b) => a - b);
}

/**
 * Robinson half-tiles of the rhomb Penrose tiling, deflated `depth` times from a sun of ten triangles in the unit
 * circle. Kind 0 is half a thin rhomb (36° at a), kind 1 half a fat rhomb (108° at a); ab and ac are rhomb sides.
 */
export function penroseTriangles(depth) {
  let tiles = Array.from({ length: 10 }, (_, i) => {
    let b = rotate(pt(1, 0), (2 * i - 1) * Math.PI / 10), c = rotate(pt(1, 0), (2 * i + 1) * Math.PI / 10);
    if (i % 2 === 0) [b, c] = [c, b];
    return { kind: 0, a: pt(0, 0), b, c };
  });
  for (let n = 0; n < depth; n++) {
    tiles = tiles.flatMap(({ kind, a, b, c }) => {
      if (kind === 0) {
        const p = mix(a, b, 1 / goldenRatio);
        return [{ kind: 0, a: c, b: p, c: b }, { kind: 1, a: p, b: c, c: a }];
      }
      const q = mix(b, a, 1 / goldenRatio), r = mix(b, c, 1 / goldenRatio);
      return [{ kind: 1, a: r, b: c, c: a }, { kind: 1, a: q, b: r, c: b }, { kind: 0, a: r, b: q, c: a }];
    });
  }
  return tiles;
}

/** Where the chord from angle θ to mθ on the unit circle touches its envelope, an epicycloid with m − 1 cusps. */
export const timesTableEnvelope = (theta, m) =>
  pt((m * Math.cos(theta) + Math.cos(m * theta)) / (m + 1), (m * Math.sin(theta) + Math.sin(m * theta)) / (m + 1));

const orient = (a, b, c) => cross(sub(b, a), sub(c, a));
const onSegment = (p, a, b) => Math.abs(orient(a, b, p)) < 1e-9 && dot(sub(p, a), sub(p, b)) <= 1e-9;

/** True when the open segments ab and cd cross at a single interior point. */
export function segmentsCross(a, b, c, d) {
  const d1 = orient(c, d, a), d2 = orient(c, d, b), d3 = orient(a, b, c), d4 = orient(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** No repeated vertices, no edge touching a non-adjacent edge, no edge folding back over its neighbour. */
export function isSimplePolygon(polygon) {
  const n = polygon.length;
  if (n < 3 || polygonArea(polygon) < 1e-9) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (dist(polygon[i], polygon[j]) < 1e-9) return false;
      const a = polygon[i], b = polygon[(i + 1) % n], c = polygon[j], d = polygon[(j + 1) % n];
      if (j === i + 1) { if (onSegment(d, a, b) || onSegment(a, c, d)) return false; }
      else if (i === 0 && j === n - 1) { if (onSegment(c, a, b) || onSegment(b, c, d)) return false; }
      else if (segmentsCross(a, b, c, d) || onSegment(c, a, b) || onSegment(d, a, b) || onSegment(a, c, d) || onSegment(b, c, d)) return false;
    }
  }
  return true;
}

/** Points where the ray from p at `angle` crosses the polygon; a vertex on the ray counts as just above it. */
export function rayCrossings(p, angle, polygon) {
  const local = polygon.map(q => rotate(sub(q, p), -angle)), hits = [];
  local.forEach((a, i) => {
    const b = local[(i + 1) % local.length];
    if ((a.y > 0) === (b.y > 0)) return;
    const x = a.x + (b.x - a.x) * a.y / (a.y - b.y);
    if (x > 0) hits.push(add(p, rotate(pt(x, 0), angle)));
  });
  return hits.sort((u, v) => dist(p, u) - dist(p, v));
}

export const insidePolygon = (p, polygon) => rayCrossings(p, 0, polygon).length % 2 === 1;

const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);

/** Counts the lattice points of a polygon with integer vertices: inside it by testing every point, on it edge by edge. */
export function latticeCount(polygon) {
  const boundaryPoints = polygon.flatMap((a, i) => {
    const b = polygon[(i + 1) % polygon.length], steps = gcd(b.x - a.x, b.y - a.y);
    return Array.from({ length: steps }, (_, k) => mix(a, b, k / steps));
  });
  const xs = polygon.map(p => p.x), ys = polygon.map(p => p.y), interiorPoints = [];
  for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const p = pt(x, y);
      if (!polygon.some((a, i) => onSegment(p, a, polygon[(i + 1) % polygon.length])) && insidePolygon(p, polygon)) interiorPoints.push(p);
    }
  }
  return { area: polygonArea(polygon), interiorPoints, boundaryPoints, interior: interiorPoints.length, boundary: boundaryPoints.length };
}

export function circumcircle(a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), d = 2 * cross(ab, ac);
  if (Math.abs(d) < 1e-12) return null;
  const b2 = dot(ab, ab), c2 = dot(ac, ac);
  const center = add(a, pt((ac.y * b2 - ab.y * c2) / d, (ab.x * c2 - ac.x * b2) / d));
  return { center, r: dist(center, a) };
}

/** Bowyer–Watson Delaunay triangulation; returns index triples into `points`, skipping repeated points. */
export function delaunay(points) {
  const n = points.length;
  if (n < 3) return [];
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
  const mx = (Math.max(...xs) + Math.min(...xs)) / 2, my = (Math.max(...ys) + Math.min(...ys)) / 2;
  const all = [...points, pt(mx - 60 * span, my - 40 * span), pt(mx + 60 * span, my - 40 * span), pt(mx, my + 60 * span)];
  const make = t => ({ t, c: circumcircle(...t.map(i => all[i])) });
  let triangles = [make([n, n + 1, n + 2])];
  points.forEach((p, i) => {
    if (points.slice(0, i).some(q => dist(p, q) < 1e-9)) return;
    const bad = triangles.filter(({ c }) => c && dist(c.center, p) < c.r - 1e-9);
    const edges = new Map();
    for (const { t } of bad) {
      for (let k = 0; k < 3; k++) {
        const a = t[k], b = t[(k + 1) % 3], key = a < b ? `${a},${b}` : `${b},${a}`;
        edges.set(key, edges.has(key) ? null : [a, b]);
      }
    }
    triangles = triangles.filter(item => !bad.includes(item));
    for (const edge of edges.values()) if (edge) triangles.push(make([edge[0], edge[1], i]));
  });
  return triangles.map(({ t }) => t).filter(t => t.every(i => i < n));
}

const rayHit = (p, d, polygon) => polygon.reduce((best, u, i) => {
  const e = sub(polygon[(i + 1) % polygon.length], u), denom = cross(d, e);
  if (Math.abs(denom) < 1e-12) return best;
  const w = sub(u, p), t = cross(w, e) / denom, s = cross(w, d) / denom;
  return t > 1e-9 && s >= -1e-9 && s <= 1 + 1e-9 ? Math.min(best, t) : best;
}, Infinity);

/** The region of a simple polygon seen from p inside it, swept by rays towards every corner and just past it. */
export function visibilityPolygon(p, polygon) {
  return polygon.flatMap(v => {
    const a = Math.atan2(v.y - p.y, v.x - p.x);
    return [a - 1e-5, a, a + 1e-5];
  }).sort((a, b) => a - b).map(a => {
    const d = pt(Math.cos(a), Math.sin(a));
    return add(p, mul(d, rayHit(p, d, polygon)));
  });
}

export const sees = (p, q, polygon) =>
  !polygon.some((a, i) => segmentsCross(p, q, a, polygon[(i + 1) % polygon.length]));

/** Degrees, odd vertices and, when every edge can be walked exactly once, one such trail (Hierholzer). */
export function eulerTrail(count, edges) {
  const degree = Array(count).fill(0);
  for (const [u, v] of edges) { degree[u]++; degree[v]++; }
  const odd = degree.flatMap((d, i) => d % 2 ? [i] : []);
  const reach = new Set([edges[0]?.[0]]);
  for (let grew = true; grew;) {
    grew = false;
    for (const [u, v] of edges) {
      if (reach.has(u) !== reach.has(v)) { reach.add(u); reach.add(v); grew = true; }
    }
  }
  const connected = edges.every(([u]) => reach.has(u));
  if (!edges.length || !connected || (odd.length !== 0 && odd.length !== 2)) return { degree, odd, connected, trail: null };
  const used = edges.map(() => false), stack = [{ v: odd[0] ?? edges[0][0], e: -1 }], done = [];
  while (stack.length) {
    const top = stack.at(-1), next = edges.findIndex((edge, i) => !used[i] && edge.includes(top.v));
    if (next < 0) { done.push(stack.pop()); continue; }
    used[next] = true;
    const [a, b] = edges[next];
    stack.push({ v: a === top.v ? b : a, e: next });
  }
  done.reverse();
  return { degree, odd, connected, trail: { vertices: done.map(s => s.v), edges: done.slice(1).map(s => s.e) } };
}

/**
 * A strip folded in half `folds` times, each crease opened to a right angle except the last, which opens to `unfold`:
 * every fold doubles the strip, the second half being the first half reversed and turned about the end.
 */
export function dragonCurve(folds, unfold = Math.PI / 2) {
  let points = [pt(0, 0), pt(1, 0)];
  for (let k = 0; k < folds; k++) {
    const end = points.at(-1), angle = k === folds - 1 ? unfold : Math.PI / 2;
    points = [...points, ...points.slice(0, -1).reverse().map(p => add(end, rotate(sub(p, end), angle)))];
  }
  return points;
}

/** Spiral of Theodorus: right triangles with legs √k and 1, so the k-th spoke has length √k. */
export function theodorus(count) {
  const points = [pt(1, 0)];
  while (points.length < count) {
    const p = points.at(-1);
    points.push(add(p, mul(perp(p), 1 / norm(p))));
  }
  return points;
}
