import { useMemo, useState, type CSSProperties } from "react";
import { stopSpeaking } from "../speech.js";
import { hallHooks } from "../question-catalog.js";
import { SoundToggle } from "../components/PageTop";
import { TopicCard } from "../components/TopicCard";
import { HomeShowcase } from "../components/HomeShowcase";
import { halls, themeOf, topics } from "../lib/catalog";
import { useProgress } from "../lib/progress";
import { href } from "../lib/route";

const hooks = hallHooks as Record<string, string>;
const quickWords = ["尺规", "雪花", "四维", "椭圆"];

export function HomePage() {
  const { lit, heard } = useProgress();
  const [query, setQuery] = useState("");
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    const hit = (text: string) => text.toLowerCase().includes(q);
    return topics.filter((t) => [t.title, t.trigger, t.name, t.tag, t.intro, t.hall.name].some(hit));
  }, [query]);

  const random = () => {
    const fresh = topics.filter((t) => !heard.has(t.id));
    const pool = fresh.length ? fresh : topics;
    stopSpeaking();
    window.location.hash = href.question(pool[Math.floor(Math.random() * pool.length)].id);
  };

  return (
    <div className="page home">
      <header className="home-title">
        <h1><span aria-hidden="true">📐</span> 几何游乐场</h1>
        <p>小念一问，爸爸一答，用圆规和图形看个明白</p>
      </header>

      <HomeShowcase />

      <section className="home-finder" aria-label="找一个几何问题">
        <div className="home-finder-bar">
          <label className="home-search">
            <span aria-hidden="true">🔍</span>
            <input
              type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="搜一搜小念的问题：比如 雪花、地砖、台球、四维……" aria-label="搜索几何问题"
              onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }}
            />
            {query && <button type="button" className="home-search-clear" onClick={() => setQuery("")} aria-label="清空搜索">✕</button>}
          </label>
          <button type="button" className="home-random" onClick={random}>🎲 随便问一题</button>
        </div>
        {found && (
          <div className="home-results" role="status">
            <p className="home-results-meta">
              {found.length ? `找到 ${found.length} 个问题` : "没有找到，换个词试试："}
              {!found.length && quickWords.map((word) => (
                <button key={word} type="button" className="chip" onClick={() => setQuery(word)}>{word}</button>
              ))}
            </p>
            <div className="qlist-grid">{found.map((t) => <TopicCard key={t.id} topic={t} showHall />)}</div>
          </div>
        )}
      </section>

      <section aria-labelledby="home-halls">
        <div className="home-section-head">
          <h2 id="home-halls" className="home-section-title">十座几何展馆</h2>
          <span className="home-total">共 {topics.length} 个问题 · ⭐ 看过 {heard.size}</span>
        </div>
        <div className="home-halls">
          {halls.map((hall) => {
            const theme = themeOf(hall.id);
            const seen = hall.lessons.filter((lesson) => heard.has(lesson.id)).length;
            return (
              <a key={hall.id} className="hall-card" href={href.hall(hall.id)} style={{ "--bubble": theme.hex } as CSSProperties}>
                <span className="hall-emoji" aria-hidden="true">{theme.emoji}</span>
                <strong>{hall.name}</strong>
                <small>{hooks[hall.id]}</small>
                <span className="hall-count">{hall.lessons.length} 个问题{seen ? ` · ⭐ 看过 ${seen}` : ""} →</span>
              </a>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="home-more">
        <h2 id="home-more" className="home-section-title">还可以这样玩</h2>
        <div className="home-more">
          <a className="more-card is-play" href={href.play()}>
            <span aria-hidden="true">🧪</span><strong>动手游乐场</strong>
            <small>{topics.length} 块画板，拖点、切片、迭代，自己验证 · 已点亮 {lit.size}</small>
          </a>
          <a className="more-card" href={href.compare}>
            <span aria-hidden="true">🌐</span><strong>曲率对照台</strong>
            <small>同一个三角形，放到平面、球面和双曲面上比一比</small>
          </a>
          <a className="more-card" href={href.stories}>
            <span aria-hidden="true">📚</span><strong>几何故事</strong>
            <small>数学家的真事，加上今晚就能做的家庭小实验</small>
          </a>
          <a className="more-card" href={href.progress}>
            <span aria-hidden="true">🏆</span><strong>我的进度</strong>
            <small>看过的问题和点亮的游乐场都记在这里</small>
          </a>
        </div>
      </section>

      <footer className="home-footer"><SoundToggle /><span>声音开关：小念和爸爸会开口说话</span></footer>
    </div>
  );
}
