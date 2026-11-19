import { eulerTrail, pt } from '../math.js';
import { button, metric, text } from '../board.js';

const lands = [
  { name: '小岛', at: pt(250, 200) },
  { name: '北岸', at: pt(320, 58) },
  { name: '南岸', at: pt(320, 342) },
  { name: '东岛', at: pt(540, 200) },
];
const bridges = [
  { ends: [0, 1], from: pt(200, 152), to: pt(200, 104) },
  { ends: [0, 1], from: pt(300, 152), to: pt(300, 104) },
  { ends: [0, 2], from: pt(200, 248), to: pt(200, 296) },
  { ends: [0, 2], from: pt(300, 248), to: pt(300, 296) },
  { ends: [0, 3], from: pt(360, 200), to: pt(468, 200) },
  { ends: [1, 3], from: pt(540, 104), to: pt(540, 140) },
  { ends: [2, 3], from: pt(540, 296), to: pt(540, 260) },
  { ends: [1, 2], from: pt(92, 104), to: pt(92, 296) },
];
const stuckWalk = { start: 1, bridges: [0, 2, 3, 1, 5, 4] };

export function sevenBridgesLab({ board, controls, stats, signal }) {
  let count = 7, walk = { start: null, bridges: [] }, degrees = false;
  controls.innerHTML = `<div class="control-row">${button('七座桥', 'bridges-7', 'aria-pressed="false"')}${button('再修一座桥', 'bridges-8', 'aria-pressed="false"')}</div>
    <div class="control-row">${button('数每块陆地连着几座桥', 'bridges-degrees', 'aria-pressed="false"')}${button('重新走', 'bridges-reset')}${button('演示一条走法', 'bridges-trail')}</div>
    <p class="lab-note">先点一块陆地当起点，再一座一座点桥。每座桥只能走一次，你能把桥全走完吗？</p>`;

  const active = () => bridges.slice(0, count);
  const here = () => {
    if (walk.start === null) return null;
    return walk.bridges.reduce((land, b) => bridges[b].ends.find(end => end !== land) ?? land, walk.start);
  };

  function draw() {
    const edges = active().map(b => b.ends), { degree, odd, trail } = eulerTrail(4, edges), current = here();
    const open = current === null ? [] : active().flatMap((b, i) => !walk.bridges.includes(i) && b.ends.includes(current) ? [i] : []);
    const route = [];
    if (walk.start !== null) {
      let land = walk.start;
      route.push(lands[land].at);
      for (const b of walk.bridges) {
        const { ends, from, to } = bridges[b];
        route.push(...(ends[0] === land ? [from, to] : [to, from]));
        land = ends.find(end => end !== land);
        route.push(lands[land].at);
      }
    }
    board.draw(`<rect x="0" y="0" width="640" height="400" class="bridges-water"/>` +
      `<rect x="0" y="0" width="640" height="104" class="bridges-land" data-land="1"/><rect x="0" y="296" width="640" height="104" class="bridges-land" data-land="2"/>` +
      `<ellipse cx="250" cy="200" rx="112" ry="48" class="bridges-land" data-land="0"/><ellipse cx="540" cy="200" rx="74" ry="60" class="bridges-land" data-land="3"/>` +
      active().map((b, i) => `<g class="bridges-bridge${walk.bridges.includes(i) ? ' is-used' : ''}${open.includes(i) ? ' is-open' : ''}" data-bridge="${i}" tabindex="0" role="button" aria-label="第 ${i + 1} 座桥：${b.ends.map(e => lands[e].name).join('—')}">` +
        `<line x1="${b.from.x}" y1="${b.from.y}" x2="${b.to.x}" y2="${b.to.y}" class="bridges-deck"/><line x1="${b.from.x}" y1="${b.from.y}" x2="${b.to.x}" y2="${b.to.y}" class="bridges-hit"/></g>`).join('') +
      (route.length > 1 ? `<polyline points="${route.map(p => `${p.x},${p.y}`).join(' ')}" class="result bridges-walk"/>` : '') +
      lands.map((land, i) => `<g class="bridges-stop${i === current ? ' is-here' : ''}" data-land="${i}" tabindex="0" role="button" aria-label="${land.name}，连着 ${degree[i]} 座桥">` +
        `<circle cx="${land.at.x}" cy="${land.at.y}" r="20" class="bridges-dot"/>` +
        (degrees ? `<circle cx="${land.at.x}" cy="${land.at.y}" r="27" class="bridges-ring${degree[i] % 2 ? ' is-odd' : ''}"/>` : '') +
        text(pt(land.at.x, land.at.y + 6), degrees ? degree[i] : land.name.slice(0, 1), 'bridges-label') + '</g>').join(''));
    for (const item of controls.querySelectorAll('button')) {
      const name = item.dataset.action;
      if (name === 'bridges-7' || name === 'bridges-8') item.setAttribute('aria-pressed', String(name === `bridges-${count}`));
      if (name === 'bridges-degrees') item.setAttribute('aria-pressed', String(degrees));
      if (name === 'bridges-trail') item.disabled = !trail;
    }
    const done = walk.bridges.length;
    stats.innerHTML = metric('走过的桥', `${done} / ${count}`) +
      metric('现在的位置', current === null ? '先选起点' : done === count ? '全部走完！' : open.length ? lands[current].name : `${lands[current].name}，没桥可走了`) +
      metric('连着奇数座桥的陆地', `${odd.length} 块`) + metric('一次走完所有桥', trail ? '可以' : '不可能');
  }

  function show(nextCount, mode) {
    count = nextCount;
    degrees = mode === 'degrees';
    if (mode === 'stuck') walk = { start: stuckWalk.start, bridges: [...stuckWalk.bridges] };
    else if (mode === 'trail') {
      const { trail } = eulerTrail(4, active().map(b => b.ends));
      walk = trail ? { start: trail.vertices[0], bridges: trail.edges } : { start: null, bridges: [] };
    } else walk = { start: null, bridges: [] };
    draw();
    board.animate('.bridges-walk, .bridges-ring');
  }

  function choose(target) {
    const bridge = target.closest('[data-bridge]'), land = target.closest('[data-land]');
    if (bridge) {
      const i = Number(bridge.dataset.bridge), current = here();
      if (current === null || walk.bridges.includes(i) || !bridges[i].ends.includes(current)) return;
      walk.bridges.push(i);
    } else if (land && walk.start === null) walk.start = Number(land.dataset.land);
    else return;
    draw();
    board.animate('.bridges-walk');
    const again = board.svg.querySelector(bridge ? `[data-bridge="${bridge.dataset.bridge}"]` : `g[data-land="${land.dataset.land}"]`);
    again?.focus();
  }

  board.svg.addEventListener('click', event => choose(event.target), { signal });
  board.svg.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!event.target.closest('[data-bridge], [data-land]')) return;
    event.preventDefault();
    choose(event.target);
  }, { signal });
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action === 'bridges-7' || action === 'bridges-8') show(Number(action.slice(-1)), degrees ? 'degrees' : '');
    else if (action === 'bridges-degrees') { degrees = !degrees; draw(); board.animate('.bridges-ring'); }
    else if (action === 'bridges-reset') { walk = { start: null, bridges: [] }; draw(); }
    else if (action === 'bridges-trail') show(count, 'trail');
  }, { signal });
  draw();
  return (_, nextCount, mode) => show(nextCount, mode);
}
