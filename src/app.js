import { halls } from './catalog.js';
import { makeBoard } from './board.js';
import { construction } from './construction.js';
import { sphere, disk, fractals, centers, transform } from './experiments.js';
import { fractalTree, tiling, hyperbolicTriangle, pythagoras } from './discovery.js';
import { billiards, symmetryInk, sangakuPuzzle } from './puzzles.js';
import { cubeLab, mobiusLab, tesseractLab } from './spatial.js';
import { ellipseLab, voronoiLab } from './plane-labs.js';
import { originalProposition, readingSections, readingSources, volumeOne } from './elements-data.js';
import { elementsAngles } from './elements-angles.js';
import { elementsTalks } from './elements-talks.js';
import { labTalks } from './lab-talks.js';
import { customLabs } from './custom-labs.js';
import { hubChats, hallChats, geometryWiki, geometryTalks } from './geometry-story-data.js';
import { mountStory } from './story-stage.js';
import { chime, getSound, say, stopSpeaking } from './speech.js';
import {
  bindInteractiveStoryWidgets, burstHtml, chatHtml, duoStageHtml,
  hallTheme, meterHtml, saysHtml, soundToggleHtml, talksSectionHtml, topBarHtml, wikiSectionHtml
} from './components.js';

const main = document.querySelector('main');
const lessons = halls.flatMap(h => h.lessons.map(l => ({ ...l, hall: h })));
const lessonById = new Map(lessons.map(l => [l.id, l]));
const propositions = new Map(volumeOne.map((p, index) => [p.n, { ...p, index, lesson: lessons.find(l => l.id === p.id) }]));
const propositionById = new Map([...propositions.values()].map(p => [p.id, p]));
const key = 'geometry-playground:completed:v1';
let storageNotice = '';

function savedProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!Array.isArray(raw)) throw new TypeError('Invalid progress data');
    return new Set(raw.filter(id => lessons.some(l => l.id === id)));
  } catch (error) {
    console.warn('Could not read geometry progress:', error);
    storageNotice = '无法读取本地进度，本次探索仍可继续。';
    return new Set();
  }
}

const progress = savedProgress();
let active;
const count = h => h.lessons.filter(l => progress.has(l.id)).length;
const href = l => `#lab/${l.id}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const modes = { sphere, disk, koch: fractals, sierpinski: fractals, centers, transform,
  'fractal-tree': fractalTree, 'hyperbolic-triangle': hyperbolicTriangle, tiling, pythagoras,
  billiards, 'symmetry-ink': symmetryInk, sangaku: sangakuPuzzle, 'cube-section': cubeLab,
  ellipse: ellipseLab, mobius: mobiusLab, voronoi: voronoiLab, tesseract: tesseractLab,
  'copy-angle': elementsAngles, 'draw-parallel': elementsAngles, 'triangle-sum': elementsAngles,
  ...Object.fromEntries(customLabs.map(entry => [entry.lesson.id, entry.mode])) };

function pickRandomLesson() {
  const unplayed = lessons.filter(l => !progress.has(l.id));
  const pool = unplayed.length ? unplayed : lessons;
  return pool[Math.floor(Math.random() * pool.length)];
}

const quickKeywords = ['尺规', '椭圆', '莫比乌斯', '分形', '双曲', '四维'];

function lessonCardHtml(l, { prefix = '', showHall = false } = {}) {
  const full = l.hall ? l : lessonById.get(l.id);
  const theme = hallTheme[full.hall.id];
  const done = progress.has(full.id);
  return `<a class="mode-card" style="--bubble:${theme.hex}" href="${href(full)}">
    <span class="mode-emoji" aria-hidden="true">${theme.emoji}</span>
    <strong>${prefix ? `<span class="prop-badge">${esc(prefix)}</span> ` : ''}${esc(full.name)}<span class="mode-tag">${esc(showHall ? `${full.hall.name} · ${full.tag}` : full.tag)}</span></strong>
    <small>${esc(full.intro)}</small>
    <span class="mode-count"><span>${done ? '⭐ 已点亮' : '💬 3 轮问答'}</span><span>${done ? '再玩一次 →' : '去动手 →'}</span></span>
  </a>`;
}

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  if (!q) return '';
  const hit = text => String(text ?? '').toLowerCase().includes(q);
  const matchedLessons = lessons.filter(l => hit(l.name) || hit(l.tag) || hit(l.intro) || hit(l.idea) || hit(l.hall.name));
  const matchedWiki = geometryWiki.filter(w => hit(w.title) || hit(w.scientist) || hit(w.story) || hit(w.homeLab) || hit(w.relatedLabTitle));
  const matchedTalks = geometryTalks.filter(t => hit(t.title) || hit(t.wrap) || t.turns.some(turn => hit(turn.nian) || hit(turn.dad)));
  const total = matchedLessons.length + matchedWiki.length + matchedTalks.length;

  return `<div class="hub-search-results" aria-live="polite">
    <div class="hub-results-head">
      <strong>${total > 0 ? `找到 ${matchedLessons.length} 个实验、${matchedWiki.length} 段故事、${matchedTalks.length} 个问答` : '没搜到这个词呢，试试下面这几个热门词？'}</strong>
      <div class="hub-quick-tags">${quickKeywords.map(kw => `<button type="button" class="pill-btn hub-kw-chip" data-quick-kw="${kw}">${kw}</button>`).join('')}</div>
    </div>
    ${matchedLessons.length ? `<div class="modes hub-results-grid">${matchedLessons.map(l => lessonCardHtml(l, { showHall: true })).join('')}</div>` : ''}
    ${matchedWiki.length ? wikiSectionHtml(matchedWiki, '📚 匹配的大师故事与家庭小实验', '') : ''}
    ${matchedTalks.length ? talksSectionHtml(matchedTalks, '💬 匹配的小念问爸爸') : ''}
  </div>`;
}

function mapPage() {
  const pct = Math.round((progress.size / lessons.length) * 100);
  const featuredTalks = geometryTalks.slice(0, 4);
  const featuredWiki = geometryWiki.slice(0, 4);

  return `<div class="page home">
    <header class="home-title">
      <h1><span aria-hidden="true">📐</span> 几何游乐场大冒险</h1>
      <p>小念和爸爸的动手几何馆 · 推开十扇大门，从欧几里得圆规玩到四维超立方体</p>
    </header>

    <div class="hub-progress">
      <div class="hub-progress-info">
        <span aria-hidden="true">🏆</span>
        <span>几何探索勋章</span>
        <strong>⭐ ${progress.size} / ${lessons.length}</strong>
      </div>
      ${meterHtml(pct, '点亮进度', `${pct}%`)}
      <div class="hub-progress-actions">
        <a class="pill-btn" href="#progress">📋 进度册</a>
        ${soundToggleHtml()}
      </div>
    </div>

    ${duoStageHtml(hubChats)}

    <section class="hub-finder" aria-label="快速寻找实验或随便玩一个">
      <div class="hub-finder-bar">
        <label class="hub-search">
          <span class="hub-search-icon" aria-hidden="true">🔍</span>
          <input id="hub-search-input" type="search" placeholder="搜一搜实验、几何概念或大师：如 勾股定理、椭圆、莫比乌斯、对称、四维……" aria-label="搜索几何实验、大师故事或问答">
          <button type="button" id="hub-search-clear" class="hub-search-clear" aria-label="清空搜索" hidden>✕</button>
        </label>
        <a class="pill-btn" href="#hall/euclid">📜 从《几何原本》出发</a>
        <button type="button" class="primary-btn hub-random-btn" id="hero-random-btn">🎲 随便玩一个</button>
      </div>
      <div class="hub-quick-bar">
        <span>热门词：</span>
        ${quickKeywords.map(kw => `<button type="button" class="pill-btn hub-kw-chip" data-quick-kw="${kw}">${kw}</button>`).join('')}
      </div>
      <div id="hub-search-output"></div>
    </section>

    <section id="halls" aria-labelledby="hub-halls-title">
      <div class="section-head">
        <h2 id="hub-halls-title" class="section-title">十大几何探索展厅</h2>
        <span class="section-sub">共 ${lessons.length} 个动手实验 · ${geometryWiki.length} 篇百宝箱故事 · ${geometryTalks.length} 组父子问答</span>
      </div>
      <div class="modes">
        ${halls.map(h => {
          const theme = hallTheme[h.id];
          const hallWikiCount = geometryWiki.filter(w => w.hall === h.id).length;
          const hallTalkCount = geometryTalks.filter(t => t.hall === h.id).length;
          return `<a class="mode-card hall-card" style="--bubble:${theme.hex}" href="#hall/${h.id}">
            <span class="mode-emoji" aria-hidden="true">${theme.emoji}</span>
            <strong>${esc(h.name)}<span class="mode-tag">${h.lessons.length} 个实验</span></strong>
            <small>${esc(h.summary)}</small>
            <span class="hall-preview" aria-hidden="true">${h.lessons.slice(0, 4).map(l => `<span class="hall-chip">${progress.has(l.id) ? '✓ ' : ''}${esc(l.name)}</span>`).join('')}${h.lessons.length > 4 ? `<span class="hall-chip">+${h.lessons.length - 4}</span>` : ''}</span>
            <span class="mode-count"><span>📚 ${hallWikiCount} 故事 · 💬 ${hallTalkCount} 问答</span><span>⭐ ${count(h)} / ${h.lessons.length} →</span></span>
          </a>`;
        }).join('')}
      </div>
    </section>

    ${talksSectionHtml(featuredTalks, '小念问爸爸')}
    ${wikiSectionHtml(featuredWiki, '📚 几何百宝箱 · 大师故事与家庭小实验', '推开每一座展厅的门，都能读到对应的大师故事与餐桌小实验')}

    <p class="home-credit">选一座展厅推门进去，就能玩遍馆内实验、读几何史真事、听小念和爸爸一问一答</p>
  </div>`;
}

function elementsIndex(h) {
  const completed = volumeOne.filter(p => progress.has(p.id)).length;
  const extras = h.lessons.filter(l => !propositionById.has(l.id));
  return `<section class="elements-book" id="hall-labs">
    <div class="section-head">
      <h2 class="section-title">📜 《几何原本》第一卷 · 互动选读 (${volumeOne.length} / 48)</h2>
      <span class="section-sub">已完成 ${completed} / ${volumeOne.length}</span>
    </div>
    <details class="elements-primer"><summary>📖 开卷：欧几里得允许我们先做什么？</summary>
      <div><p>《几何原本》从定义、公设和共同概念开始。工作台用直尺和圆规画出图形，但一张看起来正确的图不能代替证明。</p>
        <ol><li>可以连接任意两点。</li><li>有限直线可以继续延长。</li><li>给定圆心、半径，可以画圆。</li>
        <li>所有直角彼此相等。</li><li>若截线一侧的同旁内角之和小于两个直角，两条直线延长后会在这一侧相交。</li></ol>
        <p>共同概念例如「等于同一个量的量彼此相等」。定义例如「一条直线立在另一条直线上，若两侧相邻角相等，则各是直角」。</p></div>
    </details>
    ${readingSections.map(section => `<section class="elements-chapter">
      <h3>${esc(section.name)}</h3><p class="note">${esc(section.intro)}</p>
      <div class="modes">${section.numbers.map(n => lessonCardHtml(propositions.get(n).lesson, { prefix: `I.${n}` })).join('')}</div>
    </section>`).join('')}
    <section class="elements-chapter">
      <h3>✨ 同馆延伸实验</h3>
      <div class="modes">${extras.map(l => lessonCardHtml(l)).join('')}</div>
    </section>
    <div class="elements-sources"><strong>编排参考：</strong> ${readingSources.map(([label, url]) => `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`).join(' · ')}</div>
  </section>`;
}

function propositionLinks(p) {
  if (!p) return '';
  return `<section class="card">
    <h3 class="side-title">🔗 命题之间怎样连起来</h3>
    ${p.uses.length ? `<p class="note">这条命题用到了：</p><ul class="ref-list">${p.uses.map(n => {
      const related = propositions.get(n)?.lesson;
      return `<li><a href="${related ? href(related) : originalProposition(n)}"${related ? '' : ' target="_blank" rel="noreferrer"'}>I.${n} · ${related ? related.name : '读原文（英文）'}</a></li>`;
    }).join('')}</ul>` : '<p class="note">从构造公设起步，不需引用前面的命题。</p>'}
    <a class="pill-btn" style="margin-top:8px" href="${originalProposition(p.n)}" target="_blank" rel="noreferrer">对照命题 I.${p.n} 原文 ↗</a>
  </section>`;
}

function hallPage(h) {
  const theme = hallTheme[h.id];
  const hallPair = hallChats[h.id];
  const hallWiki = geometryWiki.filter(w => w.hall === h.id);
  const hallTalks = geometryTalks.filter(t => t.hall === h.id);
  const layoutClass = h.lessons.length === 4 ? ' is-four' : h.lessons.length === 5 ? ' is-five' : '';

  return `<div class="page home">
    ${topBarHtml({ emoji: theme.emoji, title: h.name, backHref: '#', backLabel: '几何馆首页', doneCount: count(h), totalCount: h.lessons.length })}
    ${hallPair ? chatHtml([{ who: 'nian', text: hallPair[0] }, { who: 'dad', text: hallPair[1] }], { playLabel: '听小念和爸爸导览', id: 'hall-guide-chat' }) : ''}
    <nav class="hall-anchors" aria-label="展厅分区跳转">
      <button type="button" class="pill-btn" data-jump="#hall-labs">🎮 动手实验 (${h.lessons.length})</button>
      ${hallWiki.length ? `<button type="button" class="pill-btn" data-jump="#hall-wiki">📚 大师与居家实验 (${hallWiki.length})</button>` : ''}
      ${hallTalks.length ? `<button type="button" class="pill-btn" data-jump="#hall-talks">💬 小念问爸爸 (${hallTalks.length})</button>` : ''}
    </nav>
    ${h.id === 'euclid' ? elementsIndex(h) : `
      <section id="hall-labs">
        <h2 class="section-title">玩一玩 · 本馆实验 (${h.lessons.length})</h2>
        <div class="modes${layoutClass}">${h.lessons.map(l => lessonCardHtml(l)).join('')}</div>
      </section>`}
    <div id="hall-wiki">${wikiSectionHtml(hallWiki, `📚 大师故事与家庭小实验 · ${h.name}`, '听爸爸讲几何发现背后的趣事，在家用身边纸笔就能亲手复现')}</div>
    <div id="hall-talks">${talksSectionHtml(hallTalks, `小念问爸爸 · ${h.name}`)}</div>
  </div>`;
}

function explorerRank(done, total) {
  if (done >= total) return '🏆 全馆几何大师';
  if (done >= Math.ceil(total * 0.6)) return '🧭 空间探险家';
  if (done >= Math.ceil(total * 0.25)) return '📐 尺规小工匠';
  return '🌱 几何好奇宝宝';
}

function progressPage() {
  const pct = Math.round((progress.size / lessons.length) * 100);
  return `<div class="page home">
    ${topBarHtml({ emoji: '🏆', title: `我的探索进度 · ${explorerRank(progress.size, lessons.length)}`, backHref: '#', backLabel: '几何馆首页', doneCount: progress.size, totalCount: lessons.length })}
    <div class="card">
      <p>答对实验的小挑战，就会点亮该实验。进度只保存在当前浏览器。</p>
      ${storageNotice ? `<p class="banner is-warn" role="status">${storageNotice}</p>` : ''}
      <div style="margin-top:12px">${meterHtml(pct, `总完成度 ${progress.size} / ${lessons.length}`, `${pct}%`)}</div>
    </div>
    <div class="progress-grid">
      ${halls.map(h => {
        const theme = hallTheme[h.id];
        return `<div class="card" style="border-top: 5px solid ${theme.hex}">
          <h2 class="side-title">${theme.emoji} ${h.name} (${count(h)} / ${h.lessons.length})</h2>
          <div class="progress-list">${h.lessons.map(l => `<a class="progress-row${progress.has(l.id) ? ' is-done' : ''}" href="${href(l)}"><span>${progress.has(l.id) ? '⭐' : '○'} ${l.name}</span><small>${l.tag}</small></a>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function labPage(l) {
  const index = lessons.indexOf(l), p = propositionById.get(l.id), h = l.hall, theme = hallTheme[h.id];
  const next = p ? propositions.get(volumeOne[p.index + 1]?.n)?.lesson : lessons[index + 1];
  const hasStory = Boolean(elementsTalks[l.id] || labTalks[l.id]);
  const done = progress.has(l.id);

  return `<div class="page lab-page" style="--bubble:${theme.hex}">
    ${topBarHtml({ emoji: theme.emoji, title: l.name, backHref: `#hall/${h.id}`, backLabel: h.name, doneCount: done ? 1 : 0, totalCount: 1 })}
    <p class="banner">${esc(l.intro)}</p>
    ${hasStory ? '<section id="story" class="story-card" aria-label="小念问爸爸"></section>' : ''}
    <div class="workbench">
      <div class="card board-card">
        <div id="canvas"></div>
        <div id="stats" class="readout-grid" style="margin-top:12px"></div>
      </div>
      <div class="workbench-side">
        <div class="card">
          <div id="controls" class="controls"></div>
          <p class="status lab-status" id="notice" role="status"></p>
        </div>
        <div class="card">
          <h3 class="side-title">${p ? '📜 爸爸的证明笔记' : '💡 爸爸的观察笔记'}</h3>
          <div id="lab-dad-note">${saysHtml('dad', l.idea)}</div>
          <div id="lab-guide"></div>
        </div>
        ${propositionLinks(p)}
        <div class="card challenge">
          <h3 class="side-title">🎯 小挑战 <span id="lab-completion">${done ? '<span class="complete-mark">⭐ 已过关</span>' : ''}</span></h3>
          <p class="challenge-q">${esc(l.question)}</p>
          <div id="choices" aria-label="挑战选项">${l.choices.map((choice, n) => `<button type="button" class="choice" data-choice="${n}"><span>${'ABC'[n]}</span>${esc(choice)}</button>`).join('')}</div>
          <div id="feedback" role="status"></div>
        </div>
        ${l.sources ? `<div class="card"><h3 class="side-title">📚 参考来源</h3><ul class="ref-list">${l.sources.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noreferrer">${label}</a></li>`).join('')}</ul></div>` : ''}
      </div>
    </div>
    <div class="lab-footer">
      <a class="pill-btn" href="#hall/${h.id}">${p ? '← 返回卷 I 目录' : `← 回${h.name}`}</a>
      <a class="primary-btn" href="${next ? href(next) : p ? '#hall/euclid' : '#progress'}">${next ? `下一站：${next.name}` : p ? '回到卷 I 目录' : '查看我的进度'} →</a>
    </div>
  </div>`;
}

function mountLab(lesson, signal) {
  const $ = id => main.querySelector(`#${id}`);
  const board = makeBoard($('canvas'), lesson.name);
  const notify = message => { $('notice').textContent = message; };
  const demo = (modes[lesson.id] ?? construction)({ board, controls: $('controls'), stats: $('stats'), guide: $('lab-guide'), lesson, signal, notify });
  const isElement = Boolean(elementsTalks[lesson.id]);
  const turns = elementsTalks[lesson.id] ?? labTalks[lesson.id];
  const h = lesson.hall, theme = hallTheme[h.id];
  const p = propositionById.get(lesson.id);
  const index = lessons.indexOf(lesson);
  const next = p ? propositions.get(volumeOne[p.index + 1]?.n)?.lesson : lessons[index + 1];

  if ($('story') && turns) {
    mountStory($('story'), lesson.id, turns, demo, board, signal, { bundledElements: isElement, accent: theme.hex });
  }

  $('choices').addEventListener('click', event => {
    const target = event.target.closest('[data-choice]');
    if (!target) return;
    for (const choice of $('choices').children) choice.classList.remove('correct', 'incorrect');
    if (Number(target.dataset.choice) !== lesson.answer) {
      target.classList.add('incorrect');
      chime(false);
      const hintLine = '先别急着选，再看看画板或点「演示这轮」试试看！';
      $('feedback').innerHTML = saysHtml('dad', hintLine);
      if (getSound()) say({ who: 'dad', text: hintLine });
      return;
    }
    progress.add(lesson.id);
    try { localStorage.setItem(key, JSON.stringify([...progress])); storageNotice = ''; }
    catch (error) {
      console.warn('Could not save geometry progress:', error);
      storageNotice = '无法保存到浏览器，进度只在本次访问中有效。';
    }
    target.classList.add('correct');
    chime(true);
    const topProg = main.querySelector('#topbar-progress');
    if (topProg) topProg.textContent = '⭐ 1 / 1';
    $('lab-completion').innerHTML = '<span class="complete-mark">⭐ 已过关</span>';
    const cheerLine = `太棒啦！我搞懂「${lesson.name}」的秘密啦！`;
    $('feedback').innerHTML = `<section class="card win-card" aria-live="polite">${burstHtml()}
      <p class="done-stars" aria-hidden="true">⭐⭐⭐</p>
      <p class="verdict is-right">🎉 答对啦！已点亮「${esc(lesson.name)}」</p>
      ${saysHtml('nian', cheerLine)}
      ${saysHtml('dad', lesson.idea)}
      ${storageNotice ? `<p class="note">${esc(storageNotice)}</p>` : ''}
      <div class="done-actions">
        <a class="primary-btn" href="${next ? href(next) : p ? '#hall/euclid' : '#progress'}">${next ? `下一站：${next.name} →` : '回到目录 →'}</a>
      </div>
    </section>`;
    if (getSound()) say({ who: 'nian', text: cheerLine }, { who: 'dad', text: lesson.idea });
  }, { signal });
}

function mountMapInteractions(signal) {
  const searchInput = main.querySelector('#hub-search-input');
  const clearBtn = main.querySelector('#hub-search-clear');
  const output = main.querySelector('#hub-search-output');
  const randomBtn = main.querySelector('#hero-random-btn');

  const updateSearch = value => {
    if (clearBtn) clearBtn.hidden = !value;
    if (output) output.innerHTML = renderSearchResults(value);
  };

  searchInput?.addEventListener('input', () => updateSearch(searchInput.value), { signal });
  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    updateSearch('');
    searchInput.focus();
  }, { signal });

  main.addEventListener('click', event => {
    const kwBtn = event.target.closest('[data-quick-kw]');
    if (kwBtn && searchInput) {
      searchInput.value = kwBtn.dataset.quickKw;
      updateSearch(searchInput.value);
      searchInput.focus();
    }
  }, { signal });

  randomBtn?.addEventListener('click', () => {
    stopSpeaking();
    location.hash = href(pickRandomLesson());
  }, { signal });
}

function mountHallInteractions(hall, signal) {
  main.addEventListener('click', event => {
    const jump = event.target.closest('[data-jump]');
    if (!jump) return;
    const target = main.querySelector(jump.dataset.jump);
    target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }, { signal });

  const hallPair = hallChats[hall.id];
  if (getSound() && hallPair) {
    say({ who: 'nian', text: hallPair[0] }, { who: 'dad', text: hallPair[1] }).catch(() => {});
  }
}

function render(fromNavigation = false) {
  active?.abort();
  stopSpeaking();
  active = new AbortController();
  const route = location.hash.slice(1), [page, id] = route.split('/');
  const lesson = page === 'lab' && lessons.find(l => l.id === id);
  const hall = page === 'hall' && halls.find(h => h.id === (id === 'dynamic' ? 'transforms' : id));
  const onProgress = page === 'progress';
  document.title = `${lesson?.name ?? hall?.name ?? (onProgress ? '我的进度' : '几何游乐场大冒险')} · 小念和爸爸的动手几何馆`;
  main.innerHTML = lesson ? labPage(lesson) : hall ? hallPage(hall) : onProgress ? progressPage() : mapPage();

  if (lesson) {
    mountLab(lesson, active.signal);
    bindInteractiveStoryWidgets(main, { signal: active.signal });
  } else {
    bindInteractiveStoryWidgets(main, { hubChats, signal: active.signal });
    if (hall) mountHallInteractions(hall, active.signal);
    else if (!onProgress) mountMapInteractions(active.signal);
  }

  if (page === 'halls') {
    const section = document.getElementById(`wing-${id}`) ?? document.querySelector('#halls');
    if (fromNavigation) section.focus({ preventScroll: true });
    section.scrollIntoView();
  } else if (fromNavigation) {
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

window.addEventListener('hashchange', () => render(true));
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); main.focus(); });
render();
