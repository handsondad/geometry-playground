import { voiceManifest } from './voice-manifest.js';

const soundKey = 'geometry-playground:sound:v1';
let soundEnabled = (() => {
  try { return localStorage.getItem(soundKey) !== 'false'; }
  catch { return true; }
})();

let audio = null;
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

export function clipUrlFor(who, rawText, explicitSrc) {
  if (explicitSrc) return explicitSrc;
  const key = `${who}|${String(rawText ?? '').trim()}`;
  const hash = voiceManifest[key];
  return hash ? new URL(`../public/voice/clips/${hash}.mp3`, import.meta.url) : null;
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

function playOne(line, token) {
  const text = String(line.text ?? '').trim();
  const src = clipUrlFor(line.who, text, line.src);
  if (!src) return synth(line.who, text, token);
  return new Promise(resolve => {
    if (token !== run) return resolve(false);
    const el = new Audio(src);
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
  for (const line of lines) {
    if (token !== run) return false;
    notifySpeaking(line);
    const ok = await playOne(line, token);
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
