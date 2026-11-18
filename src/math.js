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

export function hyperbolicAngles(vertices) {
  const angles = vertices.map((a, i) => {
    const tangent = b => {
      // (b − a) / (1 − conjugate(a) b) sends a to the disk center.
      const u = sub(b, a), re = 1 - dot(a, b), im = cross(a, b);
      return pt(u.x * re - u.y * im, u.y * re + u.x * im);
    };
    const u = tangent(vertices[(i + 1) % 3]), v = tangent(vertices[(i + 2) % 3]);
    return Math.atan2(Math.abs(cross(u, v)), dot(u, v));
  });
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
