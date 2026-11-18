import { portrait, speakButtonHtml } from './components.js';
import { getSound, getSpeaking, isSpeakingLine, say, stopSpeaking, subscribeSpeaking } from './speech.js';

const names = { nian: '小念', dad: '爸爸' };
const phases = ['先问个为什么', '再追问一步', '自己动手验证'];

export function mountStory(container, id, turns, demo, board, signal, { bundledElements = false, accent = '#ff9f43' } = {}) {
  let step = 0, playback = 0;

  container.innerHTML = `<div class="story-top">
      <nav class="stage-strip" aria-label="探索轮次">${turns.map((_, i) =>
        `<button type="button" class="stage-pill${i === 0 ? ' is-active' : ''}" style="--bubble:${accent}" data-round="${i}">
          <span class="stage-pill-title">${i + 1}. ${phases[i]}</span>
        </button>`).join('')}
      </nav>
      <div class="story-actions">
        <button type="button" class="pill-btn" data-action="listen" aria-pressed="false">▶ 听这一轮</button>
        <button type="button" class="pill-btn" data-action="demo">✨ 演示这轮动画</button>
        <button type="button" class="pill-btn" data-action="prev">← 上一轮</button>
        <button type="button" class="primary-btn" data-action="next">下一轮 →</button>
        <button type="button" class="pill-btn" data-action="board">👀 看画板</button>
      </div>
    </div>
    <div class="story-chat" aria-live="polite">${Object.entries(names).map(([role, name]) =>
      `<div class="says is-${role} story-${role}">
        <span class="says-avatar">${portrait(role)}</span>
        <div class="says-bubble"><b>${name}说 <span class="story-speak-slot"></span></b><p></p></div>
      </div>`).join('')}
    </div>
    <p class="story-status" role="status"></p>`;

  const $ = selector => container.querySelector(selector);
  const listen = $('[data-action="listen"]'), status = $('.story-status');

  const lineSrc = role => bundledElements
    ? new URL(`../public/voice/elements/${id}-${step + 1}-${role}.mp3`, import.meta.url)
    : undefined;

  function syncUi(activeLine) {
    const turn = turns[step];
    const listening = Object.keys(names).some(role => isSpeakingLine(activeLine, role, turn[role]));
    for (const role of Object.keys(names)) {
      const active = isSpeakingLine(activeLine, role, turn[role]);
      $(`.story-${role}`).classList.toggle('is-speaking', active);
      const btn = $(`.story-${role} .speak-btn`);
      if (btn) btn.classList.toggle('is-speaking', active);
    }
    listen.textContent = listening ? '⏹ 停止朗读' : '▶ 听这一轮';
    listen.setAttribute('aria-pressed', String(listening));
  }

  function stop() {
    playback++;
    stopSpeaking();
    syncUi(null);
  }

  async function play({ silentOnBlock = false } = {}) {
    stop();
    const token = playback;
    const turn = turns[step];
    listen.textContent = '⏹ 停止朗读';
    listen.setAttribute('aria-pressed', 'true');
    status.textContent = '';
    const ok = await say(
      { who: 'nian', text: turn.nian, src: lineSrc('nian') },
      { who: 'dad', text: turn.dad, src: lineSrc('dad') },
    );
    if (token !== playback) return;
    syncUi(null);
    if (!ok && !silentOnBlock) status.textContent = '暂时无法播放语音，可以继续读对话和操作画板。';
  }

  function render() {
    for (const pill of container.querySelectorAll('[data-round]')) {
      const idx = Number(pill.dataset.round);
      pill.classList.toggle('is-active', idx === step);
      pill.setAttribute('aria-current', idx === step ? 'step' : 'false');
    }
    for (const key of Object.keys(names)) {
      const text = turns[step][key];
      $(`.story-${key} p`).textContent = text;
      $(`.story-${key} .story-speak-slot`).innerHTML = speakButtonHtml(key, text, `听${names[key]}说`);
    }
    $('[data-action="prev"]').disabled = step === 0;
    $('[data-action="next"]').disabled = step === turns.length - 1;
    status.textContent = '';
    syncUi(getSpeaking());
  }

  const show = () => demo?.(...turns[step].scene);

  function goToRound(nextIndex) {
    stop();
    step = nextIndex;
    render();
    show();
    if (getSound()) play({ silentOnBlock: true });
  }

  container.addEventListener('click', event => {
    const speakBtn = event.target.closest('[data-speak-who]');
    if (speakBtn) {
      event.stopPropagation();
      const role = speakBtn.dataset.speakWho;
      const text = turns[step][role];
      if (isSpeakingLine(getSpeaking(), role, text)) stop();
      else {
        stop();
        say({ who: role, text, src: lineSrc(role) });
      }
      return;
    }

    const roundBtn = event.target.closest('[data-round]');
    if (roundBtn) {
      goToRound(Number(roundBtn.dataset.round));
      return;
    }

    const item = event.target.closest('button');
    const action = item?.dataset.action;
    if (action === 'listen') {
      if (listen.getAttribute('aria-pressed') === 'true') stop();
      else { show(); play(); }
    } else if (action === 'demo') {
      show();
      status.textContent = '画板已重新演示这轮动画，可以继续拖动点或调节滑块！';
    } else if (action === 'prev' || action === 'next') {
      goToRound(step + (action === 'next' ? 1 : -1));
    } else if (action === 'board') {
      board.svg.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, { signal });

  const unsub = subscribeSpeaking(syncUi);
  signal.addEventListener('abort', () => { unsub(); stop(); }, { once: true });
  render();
}

