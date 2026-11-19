import { button, polygon } from './board.js';
import { pt } from './math.js';
import { compareCubeCuts, cubeCut, cubeDirections } from './spatial-math.js';

const key = 'geometry-playground:cube-cuts:v1';
const marks = ['A', 'B'];
export const cutDirectionLabels = { face: '平行于面', edge: '斜切两组棱', diagonal: '垂直体对角线' };

export function mountCubeNotebook(node, { signal, sample, onChange, revisit }) {
  let cuts = [null, null], storageMessage = '';
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[null,null]');
    if (!Array.isArray(saved) || saved.length !== 2) throw new TypeError('Invalid slice notebook');
    cuts = saved.map(entry => {
      if (entry === null) return null;
      if (!entry || !Object.hasOwn(cubeDirections, entry.mode) || !Number.isInteger(entry.offset) || Math.abs(entry.offset) > 110) {
        throw new TypeError('Invalid slice position');
      }
      const cut = cubeCut(entry.mode, entry.offset);
      if (cut.section.length < 3) throw new TypeError('Saved slice is not a polygon');
      return cut;
    });
  } catch (error) {
    console.warn('Could not load cube slice notebook:', error);
    storageMessage = '未能读取上次的记录，仍然可以继续实验。';
  }
  node.innerHTML = `<section class="cut-notebook" aria-labelledby="cuts-title">
    <header><h2 id="cuts-title">截面观察簿</h2>${button('清空', 'clear-cuts', 'class="pill-btn"')}</header>
    <p>不换切面方向，找两个<strong>边数一样、面积不同</strong>的截面。先记下一个，再移动切面找另一个。</p>
    <div class="cut-pair">${marks.map((mark, i) => `<article class="cut-note cut-mark-${mark}">
      <h3>记录 ${mark}</h3>
      <div class="cut-snapshot"></div>
      <div class="cut-actions">${button(`记录为 ${mark}`, `record-${i}`, 'class="pill-btn"')}${button('回看', `revisit-${i}`, `class="pill-btn" aria-label="回看记录 ${mark}"`)}</div>
    </article>`).join('')}</div>
    <p class="cut-verdict" role="status"></p>
    <details class="cut-why" hidden>
      <summary>为什么边数没变，面积却变了？</summary>
      <p>平移切面时，只要没越过正方体顶点，仍是同一组棱被切到，截面的边数就不变。但交点会沿棱滑动，截面围起来的大小可以改变。</p>
    </details>
    <p class="cut-storage" role="status"></p>
  </section>`;
  const cards = [...node.querySelectorAll('.cut-note')], verdict = node.querySelector('.cut-verdict');
  const storage = node.querySelector('.cut-storage');
  const why = node.querySelector('.cut-why');
  storage.textContent = storageMessage;
  const clear = node.querySelector('[data-action="clear-cuts"]');

  function draw() {
    for (const [i, card] of cards.entries()) {
      const cut = cuts[i], snapshot = card.querySelector('.cut-snapshot');
      snapshot.innerHTML = cut ? `<svg viewBox="0 0 116 96" aria-hidden="true">
        ${polygon(cut.outline.map(p => pt(58 + p.x * 26, 48 + p.y * 26)), 'cut-silhouette')}
      </svg><div><b>${cut.section.length} 边 · 面积 ${cut.area.toFixed(2)}</b><small>${cutDirectionLabels[cut.mode]} · ${cut.offset > 0 ? '+' : ''}${cut.offset}%</small></div>`
        : '<p class="cut-empty">还没有记录</p>';
      card.querySelector(`[data-action="record-${i}"]`).textContent = cut ? `替换 ${marks[i]}` : `记录为 ${marks[i]}`;
      card.querySelector(`[data-action="revisit-${i}"]`).disabled = !cut;
    }
    clear.disabled = cuts.every(cut => cut === null);
    const [a, b] = cuts, outcome = compareCubeCuts(a, b);
    const gap = outcome === 'match' ? Math.abs(Math.round(a.area * 100) - Math.round(b.area * 100)) / 100 : 0;
    node.dataset.result = outcome;
    why.hidden = outcome !== 'match';
    verdict.textContent = {
      waiting: a || b ? `已记下 ${a ? 'A' : 'B'}。移动切面，再记下另一个截面。` : '先保存任意一个有面积的截面。',
      direction: '两次切面的方向不同。回看其中一次，只移动位置再记录。',
      edges: '两次的边数不同。试着把切面往刚才的方向挪回一点。',
      area: a?.mode === 'face' ? '平行于面时，每个截面都是同样大的正方形。换成斜切方向，再记两次。'
        : a?.offset === -b?.offset && a?.offset !== 0 ? '关于中心对称的两个位置，面积相同。试试离中心远近不同的两个位置。'
        : '面积读数太接近。试着往同一侧再挪一点，先别让边数变掉。',
      match: outcome === 'match' ? `找到证据了：都是 ${a.section.length} 边，面积读数相差 ${gap.toFixed(2)}。` : '',
    }[outcome];
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(cuts.map(cut => cut && { mode: cut.mode, offset: cut.offset })));
      storage.textContent = '';
    } catch (error) {
      console.warn('Could not save cube slice notebook:', error);
      storage.textContent = '浏览器无法保存记录；这次打开页面时仍可对照。';
    }
    draw();
    onChange();
  }
  node.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    const [kind, slot] = action.split('-');
    if (kind === 'record') {
      const cut = sample();
      if (cut.section.length < 3) {
        verdict.textContent = '这里切不出有面积的多边形。把切面向里移，再记一次。';
        return;
      }
      cuts[Number(slot)] = cut;
      save();
    } else if (kind === 'revisit' && cuts[Number(slot)]) {
      revisit(cuts[Number(slot)]);
    } else if (action === 'clear-cuts') {
      cuts = [null, null];
      save();
    }
  }, { signal });
  draw();
  return mode => cuts.flatMap((cut, i) => cut?.mode === mode ? [{ ...cut, mark: marks[i] }] : []);
}
