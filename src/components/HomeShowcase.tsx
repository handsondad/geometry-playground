import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from "react";
import { homeShowcase } from "../question-catalog.js";
import { mountShowcaseFigure } from "../showcase-figures.js";
import { hallById, themeOf, type Hall, type Source } from "../lib/catalog";
import { href } from "../lib/route";

type Star = { id: string; hall: string; play: Source; name: string; en: string; hook: string; source: Source };

const SLIDE_MS = 8000;
const stars = (homeShowcase as unknown as readonly Star[]).map((star) => ({ ...star, hallInfo: hallById(star.hall) as Hall }));
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** 首页轮播：每张是一个会动的几何明星，配一句介绍和它所在展馆的入口 */
export function HomeShowcase() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const [hold, setHold] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const picture = useRef<HTMLDivElement>(null);
  const star = stars[index];
  const hall = star.hallInfo;
  const theme = themeOf(hall.id);
  const running = playing && !hold && !hidden;

  const go = (next: number) => {
    setIndex((next + stars.length) % stars.length);
    setProgress(0);
  };

  useEffect(() => {
    const box = picture.current;
    if (!box) return;
    const controller = new AbortController();
    mountShowcaseFigure(box, star.id, { signal: controller.signal, label: `${star.name}动态图` });
    return () => controller.abort();
  }, [star]);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(), step = (now - last) / SLIDE_MS;
      last = now;
      setProgress((value) => value + step);
    }, 100);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (progress >= 1) go(index + 1);
  }, [progress, index]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
    else return;
    event.preventDefault();
  };
  const onBlur = (event: FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHold(false);
  };

  return (
    <section
      className="show" aria-roledescription="轮播" aria-label="几何明星"
      style={{ "--bubble": theme.hex } as CSSProperties}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHold(true); }}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)} onBlur={onBlur}
    >
      <div className="show-viewport" aria-live={running ? "off" : "polite"}>
        <div className="show-slide" key={star.id} role="group" aria-roledescription="幻灯片" aria-label={`${index + 1} / ${stars.length}：${star.name}`}>
          <div className="show-copy">
            <a className="show-hall" href={href.hall(hall.id)}><span aria-hidden="true">{theme.emoji}</span> {hall.name}</a>
            <p className="show-en">{star.en}</p>
            <h2>{star.name}</h2>
            <p className="show-hook">{star.hook}</p>
            <div className="show-cta">
              <a className="primary-btn" href={href.hall(hall.id)}>走进「{hall.name}」展馆 →</a>
              <a className="pill-btn" href={href.play(star.play[0])}>{star.play[1]}</a>
            </div>
            <a className="show-source" href={star.source[1]} target="_blank" rel="noreferrer">
              📖 Wolfram MathWorld：{star.source[0]} ↗
            </a>
          </div>
          <div ref={picture} className="show-stage" onPointerDown={() => setPlaying(false)} />
        </div>
      </div>

      <div className="show-nav" onKeyDown={onKeyDown}>
        <button type="button" className="show-arrow" onClick={() => go(index - 1)} aria-label="上一个">←</button>
        <div className="show-dots">
          {stars.map((item, i) => (
            <button
              key={item.id} type="button" aria-current={i === index ? "true" : undefined} aria-label={`第 ${i + 1} 个：${item.name}`} onClick={() => go(i)}
              style={{ "--bubble": themeOf(item.hall).hex } as CSSProperties}
            >
              <span aria-hidden="true">{themeOf(item.hall).emoji}</span>
              {i === index && <b>{item.name}</b>}
              {i === index && <i className="show-progress" style={{ transform: `scaleX(${Math.min(1, progress)})` }} />}
            </button>
          ))}
        </div>
        <button type="button" className="show-arrow" onClick={() => go(index + 1)} aria-label="下一个">→</button>
        <button type="button" className="show-toggle" aria-pressed={playing} onClick={() => setPlaying(!playing)}>
          {playing ? "⏸ 暂停" : "▶ 自动播放"}
        </button>
      </div>
    </section>
  );
}
