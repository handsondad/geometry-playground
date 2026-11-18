import { getSound, getSpeaking, isSpeakingLine, say, setSound, stopSpeaking, subscribeSpeaking } from './speech.js';

export const hallTheme = {
  euclid: { emoji: '📐', hex: '#7c6cf0' },
  solids: { emoji: '🧊', hex: '#4d96ff' },
  curves: { emoji: '🪐', hex: '#38b6ff' },
  transforms: { emoji: '🪞', hex: '#ff6b6b' },
  mosaics: { emoji: '🧩', hex: '#ff9f43' },
  'non-euclid': { emoji: '🌍', hex: '#2bb6a8' },
  fractal: { emoji: '❄️', hex: '#f59f00' },
  topology: { emoji: '♾️', hex: '#e668a7' },
  computational: { emoji: '📍', hex: '#3bb273' },
  dimensions: { emoji: '🔮', hex: '#6c5ce7' },
};

const names = { nian: '小念', dad: '爸爸' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Exact Avatar from sci-playground & fourier-puzzle-game */
export function portrait(who, cls = 'avatar') {
  const dad = who === 'dad';
  const skin = dad ? '#eab892' : '#f5c9a6';
  const hair = dad ? '#2a1c14' : '#5a3a22';
  const shirt = dad ? '#3f78c9' : '#ff8a5c';
  const face = dad ? '#2e1d14' : '#3a2418';
  return `<svg class="${cls}" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M5 40c1-8 7-11 15-11s14 3 15 11z" fill="${shirt}"/>
    <rect x="${dad ? 10 : 8.5}" y="${dad ? 7 : 8}" width="${dad ? 20 : 23}" height="${dad ? 23 : 22}" rx="${dad ? 7 : 9}" fill="${skin}"/>
    <path d="${dad ? 'M9 16c-1-8 4-12 11-12s12 4 11 12c-2-4-5-6-10-6-3 0-6 1-8 3z' : 'M7.5 17c0-8 5-12 12.5-12s12.5 4 12.5 12c-3-3-6-5-10-5 0 2-4 3-7 3-3 0-5 0-8 2z'}" fill="${hair}"/>
    <circle cx="15.5" cy="19.5" r="1.5" fill="${face}"/>
    <circle cx="24.5" cy="19.5" r="1.5" fill="${face}"/>
    <ellipse cx="${dad ? 13.5 : 12.5}" cy="23.5" rx="2" ry="1.2" fill="#ff8fa0" opacity="0.55"/>
    <ellipse cx="${dad ? 26.5 : 27.5}" cy="23.5" rx="2" ry="1.2" fill="#ff8fa0" opacity="0.55"/>
    <path d="M17.5 25c1.5 1.2 3.5 1.2 5 0" stroke="${face}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    ${dad ? '<g fill="none" stroke="#24242c" stroke-width="1.3"><circle cx="15.5" cy="19.5" r="3.4"/><circle cx="24.5" cy="19.5" r="3.4"/><path d="M18.9 19.2h2.2"/></g>' : ''}
  </svg>`;
}

export function soundToggleHtml(extraClass = '') {
  const on = getSound();
  return `<button type="button" class="pill-btn sound-btn ${extraClass}" data-sound-toggle aria-pressed="${on}" aria-label="${on ? '音效与自动朗读：开' : '音效与自动朗读：关'}" title="${on ? '小念和爸爸会自动说话，带过关音效' : '静音模式（点气泡上的 🔊 仍可单句听）'}">${on ? '🔊 声音：开' : '🔇 声音：关'}</button>`;
}

export function topBarHtml({ emoji, title, backHref, backLabel = '几何馆首页', doneCount, totalCount }) {
  const hasCount = typeof doneCount === 'number' && typeof totalCount === 'number' && totalCount > 0;
  return `<header class="topbar">
    <a class="pill-btn" href="${esc(backHref)}">← ${esc(backLabel)}</a>
    <h1><span aria-hidden="true">${emoji}</span> ${esc(title)}</h1>
    <div class="topbar-tools">
      ${hasCount ? `<span class="star-chip" id="topbar-progress" aria-label="已点亮 ${doneCount} 个，共 ${totalCount} 个">⭐ ${doneCount} / ${totalCount}</span>` : ''}
      ${soundToggleHtml()}
    </div>
  </header>`;
}

export function speakButtonHtml(who, text, label, explicitSrc = '') {
  const name = names[who] ?? '爸爸';
  const aria = esc(label ?? `听${name}读：${text}`);
  return `<button type="button" class="speak-btn" data-speak-who="${who}" data-speak-text="${esc(text)}"${explicitSrc ? ` data-speak-src="${esc(explicitSrc)}"` : ''} aria-label="${aria}">🔊</button>`;
}

export function saysHtml(who, text, { showSpeak = true, explicitSrc = '' } = {}) {
  const name = names[who] ?? '爸爸';
  return `<div class="says is-${who}" data-say-who="${who}" data-say-text="${esc(text)}">
    <span class="says-avatar">${portrait(who, 'avatar')}</span>
    <div class="says-bubble">
      <b>${name}说 ${showSpeak ? speakButtonHtml(who, text, `听${name}说`, explicitSrc) : ''}</b>
      <p>${esc(text)}</p>
    </div>
  </div>`;
}

export function chatHtml(lines, { playLabel = '', id = '' } = {}) {
  const payload = esc(JSON.stringify(lines.map(({ who, text, src }) => ({ who, text, ...(src ? { src } : {}) }))));
  return `<div class="chat" ${id ? `id="${esc(id)}"` : ''}>
    ${playLabel ? `<button type="button" class="pill-btn chat-play" data-chat-lines="${payload}">▶ ${esc(playLabel)}</button>` : ''}
    ${lines.map(line => saysHtml(line.who, line.text, { explicitSrc: line.src ?? '' })).join('')}
  </div>`;
}

export function meterHtml(pct, label = '点亮进度', valueText = `${pct}%`) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const done = clamped >= 100;
  return `<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${clamped}" aria-label="${esc(label)} ${esc(valueText)}">
    <span class="meter-label">${esc(label)}</span>
    <span class="meter-track"><span class="meter-fill${done ? ' is-done' : ''}" style="width: ${clamped}%"></span></span>
    <b>${esc(valueText)}</b>
  </div>`;
}

export function burstHtml() {
  const emojis = ['🎉', '⭐', '✨', '🌟', '🎊', '💛', '⭐', '✨'];
  return `<div class="burst" aria-hidden="true">${emojis.map((e, i) => `<span style="--a:${i * 45}deg">${e}</span>`).join('')}</div>`;
}

export function duoStageHtml(chats, title = '小念和爸爸') {
  const [nianLine, dadLine] = chats[0];
  return `<section aria-label="${esc(title)}">
    <h2 class="section-title">${esc(title)}</h2>
    <div class="duo" id="duo-stage">
      <svg class="duo-waves" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 212 Q 100 152 200 212 T 400 212 T 600 212 T 800 212" />
        <path d="M0 234 Q 50 202 100 234 T 200 234 T 300 234 T 400 234 T 500 234 T 600 234 T 700 234 T 800 234" />
      </svg>
      <div class="duo-sparkles" aria-hidden="true">
        <span>✦</span><span>📐</span><span>✦</span><span>🧭</span>
      </div>
      <button type="button" class="duo-bubble is-nian" data-duo-role="nian" data-say-who="nian" data-say-text="${esc(nianLine)}">
        <b>小念</b><span>${esc(nianLine)}</span>
      </button>
      <button type="button" class="duo-bubble is-dad" data-duo-role="dad" data-say-who="dad" data-say-text="${esc(dadLine)}">
        <b>爸爸</b><span>${esc(dadLine)}</span>
      </button>
      <button type="button" class="duo-people" aria-label="点一下，小念和爸爸接着聊">
        <span class="duo-dad">${portrait('dad', 'avatar')}</span>
        <span class="duo-nian">${portrait('nian', 'avatar')}</span>
      </button>
      <span class="duo-hint" aria-hidden="true">点他们，接着聊 👆 <i class="duo-index">1 / ${chats.length}</i></span>
    </div>
  </section>`;
}

export function talksSectionHtml(talks, title = '小念问爸爸') {
  if (!talks.length) return '';
  return `<section aria-label="${esc(title)}">
    <h2 class="section-title">${esc(title)}</h2>
    <div class="talks">
      ${talks.map((item, i) => {
        const lines = [];
        for (const t of item.turns) {
          lines.push({ who: 'nian', text: t.nian });
          lines.push({ who: 'dad', text: t.dad });
        }
        lines.push({ who: 'nian', text: item.wrap });
        const payload = esc(JSON.stringify(lines));
        return `<article class="talk-card" style="--i:${i}">
          <button type="button" class="talk-head" aria-expanded="false" data-talk-toggle="${i}" data-talk-lines="${payload}">
            <span class="talk-emoji" aria-hidden="true">${item.emoji}</span>
            <span class="talk-title">
              <span class="talk-asker">${portrait('nian', 'avatar')}</span>
              <strong>${esc(item.title)}</strong>
            </span>
            <small>听他们聊 ▶</small>
          </button>
          <div class="talk-body" hidden>${chatHtml(lines, { playLabel: '从头再听一遍' })}</div>
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

export function wikiSectionHtml(items, title = '📚 几何百宝箱 · 大师故事与家庭小实验', subtitle = '读一段几何发现背后的真事，今晚就能在餐桌旁亲手试一试') {
  if (!items.length) return '';
  return `<section aria-label="${esc(title)}">
    <div class="section-head">
      <h2 class="section-title">${esc(title)}</h2>
      ${subtitle ? `<span class="section-sub">${esc(subtitle)}</span>` : ''}
    </div>
    <div class="wiki-grid">
      ${items.map(item => {
        const accent = hallTheme[item.hall]?.hex ?? '#ff9f43';
        const spoken = `${item.scientist}的故事：${item.title}。${item.story} ${item.homeLab}`;
        return `<article class="wiki-card" style="--wiki-accent:${accent}">
          <header class="wiki-head">
            <span class="wiki-emoji" aria-hidden="true">${item.emoji}</span>
            <div class="wiki-meta">
              <small>${esc(item.era)} · ${esc(item.scientist)}</small>
              <h3>${esc(item.title)}</h3>
            </div>
            ${speakButtonHtml('dad', spoken, `听爸爸讲：${item.title}`)}
          </header>
          <p class="wiki-story">${esc(item.story)}</p>
          <div class="wiki-lab">${esc(item.homeLab)}</div>
          <footer class="wiki-foot">
            <a class="pill-btn wiki-jump" href="#lab/${esc(item.relatedLabId)}">🔬 去玩「${esc(item.relatedLabTitle)}」 →</a>
          </footer>
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

export function bindInteractiveStoryWidgets(root, { hubChats = [], signal } = {}) {
  function syncSpeakingUi(line) {
    for (const el of root.querySelectorAll('[data-say-who]')) {
      const active = isSpeakingLine(line, el.dataset.sayWho, el.dataset.sayText);
      el.classList.toggle('is-speaking', active);
    }
    for (const btn of root.querySelectorAll('[data-speak-who]')) {
      const active = isSpeakingLine(line, btn.dataset.speakWho, btn.dataset.speakText);
      btn.classList.toggle('is-speaking', active);
    }
    for (const btn of root.querySelectorAll('.chat-play[data-chat-lines]')) {
      try {
        const list = JSON.parse(btn.dataset.chatLines);
        const active = list.some(item => isSpeakingLine(line, item.who, item.text));
        btn.classList.toggle('is-speaking', active);
      } catch { /* ignore */ }
    }
  }

  function syncSoundButtons() {
    const on = getSound();
    for (const btn of root.querySelectorAll('[data-sound-toggle]')) {
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? '🔊 声音：开' : '🔇 声音：关';
      btn.setAttribute('aria-label', on ? '音效与自动朗读：开' : '音效与自动朗读：关');
    }
  }

  const unsub = subscribeSpeaking(line => {
    syncSpeakingUi(line);
    syncSoundButtons();
  });
  signal.addEventListener('abort', unsub, { once: true });
  syncSpeakingUi(getSpeaking());
  syncSoundButtons();

  const stage = root.querySelector('#duo-stage');
  if (stage && hubChats.length) {
    let index = 0;
    let heard = false;
    const nianBtn = stage.querySelector('[data-duo-role="nian"]');
    const dadBtn = stage.querySelector('[data-duo-role="dad"]');
    const counter = stage.querySelector('.duo-index');
    const advance = () => {
      const next = heard ? (index + 1) % hubChats.length : index;
      heard = true;
      index = next;
      const [nianText, dadText] = hubChats[next];
      nianBtn.dataset.sayText = nianText;
      nianBtn.querySelector('span').textContent = nianText;
      dadBtn.dataset.sayText = dadText;
      dadBtn.querySelector('span').textContent = dadText;
      if (counter) counter.textContent = `${next + 1} / ${hubChats.length}`;
      say({ who: 'nian', text: nianText }, { who: 'dad', text: dadText });
    };
    stage.addEventListener('click', event => {
      if (event.target.closest('button')) advance();
    }, { signal });
  }

  root.addEventListener('click', event => {
    const soundBtn = event.target.closest('[data-sound-toggle]');
    if (soundBtn) {
      setSound(!getSound());
      syncSoundButtons();
      return;
    }

    const speakBtn = event.target.closest('[data-speak-who]');
    if (speakBtn) {
      const { speakWho: who, speakText: text, speakSrc: src } = speakBtn.dataset;
      if (isSpeakingLine(getSpeaking(), who, text)) stopSpeaking();
      else say({ who, text, ...(src ? { src } : {}) });
      return;
    }

    const playBtn = event.target.closest('.chat-play[data-chat-lines]');
    if (playBtn) {
      const lines = JSON.parse(playBtn.dataset.chatLines);
      if (lines.some(item => isSpeakingLine(getSpeaking(), item.who, item.text))) stopSpeaking();
      else say(...lines);
      return;
    }

    const talkBtn = event.target.closest('[data-talk-toggle]');
    if (talkBtn) {
      const card = talkBtn.closest('.talk-card');
      const body = card.querySelector('.talk-body');
      const isOpen = card.classList.contains('is-open');
      for (const other of root.querySelectorAll('.talk-card.is-open')) {
        if (other !== card) {
          other.classList.remove('is-open');
          other.querySelector('[data-talk-toggle]').setAttribute('aria-expanded', 'false');
          other.querySelector('[data-talk-toggle] small').textContent = '听他们聊 ▶';
          other.querySelector('.talk-body').hidden = true;
        }
      }
      if (isOpen) {
        card.classList.remove('is-open');
        talkBtn.setAttribute('aria-expanded', 'false');
        talkBtn.querySelector('small').textContent = '听他们聊 ▶';
        body.hidden = true;
        stopSpeaking();
      } else {
        card.classList.add('is-open');
        talkBtn.setAttribute('aria-expanded', 'true');
        talkBtn.querySelector('small').textContent = '收起 ▲';
        body.hidden = false;
        const lines = JSON.parse(talkBtn.dataset.talkLines);
        say(...lines);
      }
    }
  }, { signal });
}
