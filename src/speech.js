import { voiceClips } from './voice-manifest.js';
import { clipId } from './voice-key.js';

const soundKey = 'geometry-playground:sound:v1';
let soundEnabled = (() => {
  try { return localStorage.getItem(soundKey) !== 'false'; }
  catch { return true; }
})();

let audio = null;
let upcoming = null;
let tones = null;
let run = 0;
let currentLine = null;
const listeners = new Set();

export const getSound = () => soundEnabled;
export function setSound(on) {
  soundEnabled = Boolean(on);
  try { localStorage.setItem(soundKey, String(soundEnabled)); } catch { /* ignore */ }
  if (!soundEnabled) stopSpeaking();
  listeners.forEach(fn => fn(currentLine));
}

export function subscribeSpeaking(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getSpeaking = () => currentLine;
export const isSpeakingLine = (line, who, text) =>
  Boolean(line && line.who === who && line.text.trim() === String(text ?? '').trim());

function notifySpeaking(line) {
  currentLine = line;
  listeners.forEach(fn => fn(line));
}

const voiceUrl = path => `${import.meta.env.BASE_URL}voice/${path}`;

/** 《几何原本》卷 I 的问答单独录在 public/voice/elements/，round 从 1 数 */
export const elementsClipUrl = (id, round, who) => voiceUrl(`elements/${id}-${round}-${who}.mp3`);

export function clipUrlFor(who, rawText, explicitSrc) {
  if (explicitSrc) return explicitSrc;
  const id = clipId(who, rawText);
  return voiceClips.has(id) ? voiceUrl(`clips/${id}.mp3`) : null;
}

const canSynth = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function synth(who, text, token) {
  return new Promise(resolve => {
    if (!canSynth() || token !== run) return resolve(false);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      const list = window.speechSynthesis.getVoices();
      const preferred = who === 'nian'
        ? list.find(v => /Yunxia/i.test(v.name))
        : list.find(v => /Yunxi/i.test(v.name));
      const zh = preferred ?? list.find(v => /^zh[-_]CN/i.test(v.lang)) ?? list.find(v => /^zh/i.test(v.lang));
      if (zh) utterance.voice = zh;
      utterance.rate = preferred ? (who === 'dad' ? 0.95 : 1) : 0.98;
      utterance.pitch = preferred ? 1 : who === 'nian' ? 1.4 : 0.9;
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}

/** 上一句还在播时先把下一句的录音下载好，两句之间不再停顿等网络 */
function preload(line) {
  const src = line ? clipUrlFor(line.who, line.text, line.src) : null;
  if (!src || upcoming?.src === src) return;
  dropUpcoming();
  const el = new Audio();
  el.preload = 'auto';
  el.src = src;
  upcoming = { src, el };
}

function dropUpcoming() {
  if (!upcoming) return;
  upcoming.el.removeAttribute('src');
  upcoming = null;
}

function audioFor(src) {
  if (upcoming?.src !== src) return new Audio(src);
  const { el } = upcoming;
  upcoming = null;
  return el;
}

function playOne(line, token) {
  const text = String(line.text ?? '').trim();
  const src = clipUrlFor(line.who, text, line.src);
  if (!src) return synth(line.who, text, token);
  return new Promise(resolve => {
    if (token !== run) return resolve(false);
    const el = audioFor(src);
    audio = el;
    let settled = false;
    const finish = ok => {
      if (settled) return;
      settled = true;
      el.onended = null;
      el.onerror = null;
      el.onpause = null;
      if (audio === el) audio = null;
      resolve(ok);
    };
    el.onended = () => finish(true);
    el.onpause = () => { if (!el.ended) finish(false); };
    el.onerror = () => synth(line.who, text, token).then(finish);
    el.play().catch(error => {
      if (token !== run) return finish(false);
      console.warn('Audio playback blocked or failed:', error);
      finish(false);
    });
  });
}

export function stopSpeaking() {
  run += 1;
  dropUpcoming();
  if (audio) {
    const prev = audio;
    audio = null;
    prev.pause();
    prev.removeAttribute('src');
  }
  if (canSynth()) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
  if (currentLine) notifySpeaking(null);
}

export async function say(...lines) {
  stopSpeaking();
  const token = run;
  for (const [i, line] of lines.entries()) {
    if (token !== run) return false;
    notifySpeaking(line);
    const playing = playOne(line, token);
    preload(lines[i + 1]);
    const ok = await playing;
    if (!ok || token !== run) {
      if (token === run) notifySpeaking(null);
      return false;
    }
  }
  if (token === run) notifySpeaking(null);
  return true;
}

export function chime(right) {
  if (!soundEnabled) return;
  try {
    tones ??= new AudioContext();
    if (tones.state === 'suspended') tones.resume().catch(() => {});
    const now = tones.currentTime;
    const notes = right ? [523, 659, 784] : [196];
    notes.forEach((frequency, i) => {
      const osc = tones.createOscillator();
      const gain = tones.createGain();
      osc.type = right ? 'triangle' : 'sine';
      osc.frequency.value = frequency;
      const start = now + i * 0.085;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
      osc.connect(gain).connect(tones.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch { /* ignore when WebAudio unavailable */ }
}
