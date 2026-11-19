import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { difficultyLabel } from "../question-catalog.js";
import { Avatar } from "../components/Avatar";
import { Bubble } from "../components/Bubble";
import { PageTop } from "../components/PageTop";
import { QuestionFilm, type FilmHandle } from "../components/QuestionFilm";
import { neighbors, themeOf, topicById, turnsFor, type Topic } from "../lib/catalog";
import { markHeard, useProgress } from "../lib/progress";
import { href } from "../lib/route";
import type { Speaker } from "../lib/speech";
const labels = difficultyLabel as Record<number, string>;

export function QuestionPage({ topic }: { topic: Topic }) {
  const theme = themeOf(topic.hall.id);
  const turns = turnsFor(topic.id);
  const { heard } = useProgress();
  const film = useRef<FilmHandle>(null);
  const filmBox = useRef<HTMLDivElement>(null);
  const turnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [playing, setPlaying] = useState<{ turn: number; who?: Speaker }>({ turn: 0 });
  const endRef = useRef<HTMLDivElement>(null);
  const onTurn = useCallback((turn: number, who?: Speaker) => setPlaying({ turn, who }), []);
  const onFinish = useCallback(() => markHeard(topic.id), [topic.id]);
  const spokenTurn = playing.who ? playing.turn : undefined;

  useEffect(() => {
    if (spokenTurn === undefined || !window.matchMedia("(min-width: 901px)").matches) return;
    turnRefs.current[spokenTurn]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [spokenTurn]);

  // 宽屏上整段对话可能一进页面就看得见，所以要真的往下读到底（或者动画播完）才算看过
  useEffect(() => {
    const check = () => {
      const end = endRef.current?.getBoundingClientRect();
      if (window.scrollY > 0 && end && end.top < window.innerHeight) markHeard(topic.id);
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [topic.id]);

  const watch = (turn: number) => {
    film.current?.playTurn(turn);
    filmBox.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const { next } = neighbors(topic);
  const more = [next, neighbors(next).next].filter((item) => item.id !== topic.id);

  return (
    <div className="page qa" style={{ "--bubble": theme.hex } as CSSProperties}>
      <PageTop
        backHref={href.hall(topic.hall.id)} backLabel={`${theme.emoji} ${topic.hall.name}`}
        kicker={<>{labels[topic.difficulty]} · {topic.tag}{heard.has(topic.id) && " · ⭐ 看过"}</>}
        title={topic.title} sound={false}
      />

      <main className="qa-main has-film">
        <div ref={filmBox} className="qa-film">
          <QuestionFilm ref={film} topic={topic} turns={turns} onTurn={onTurn} onFinish={onFinish} />
        </div>

        <section className="qa-chat" aria-label="小念和爸爸的问答">
          <p className="qa-scene"><span aria-hidden="true">📍</span>{topic.trigger}</p>
          {turns.map((turn, index) => (
            <div
              key={index} ref={(node) => { turnRefs.current[index] = node; }}
              className={playing.turn === index ? "qa-turn is-playing" : "qa-turn"}
            >
              <Bubble who="nian" index={index * 2} speaking={playing.turn === index && playing.who === "nian"}>
                <p>{turn.nian}</p>
              </Bubble>
              <Bubble who="dad" index={index * 2 + 1} speaking={playing.turn === index && playing.who === "dad"}>
                <p>{turn.dad}</p>
                <button type="button" className="qa-watch" onClick={() => watch(index)}>🎬 看这一幕</button>
              </Bubble>
            </div>
          ))}
        </section>
        <div ref={endRef} className="qa-end" />

        <section className="qa-wrap" aria-label="看完以后">
          <a className="qa-play" href={href.play(topic.id)}>
            <span aria-hidden="true">🧪</span>
            <span><strong>换我动手：{topic.name}</strong><small>到游乐场里拖一拖、调一调，自己验证爸爸说的对不对</small></span>
            <span aria-hidden="true">→</span>
          </a>
          <div className="qa-related">
            <h3><Avatar who="nian" /> 小念还想问</h3>
            {more.map((item) => (
              <a key={item.id} href={href.question(item.id)}>{item.title}{heard.has(item.id) ? " ⭐" : ""}</a>
            ))}
          </div>
          <details className="parent-tip">
            <summary>👨‍👩‍👧 给大人：爸爸的笔记</summary>
            <p>{topic.idea}</p>
            {topic.sources && (
              <ul className="ref-list">
                {topic.sources.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>)}
              </ul>
            )}
          </details>
        </section>
      </main>
    </div>
  );
}

export function QuestionRoute({ id }: { id: string }) {
  const topic = topicById(id);
  if (!topic) return <MissingPage />;
  return <QuestionPage key={topic.id} topic={topic} />;
}

export function MissingPage() {
  return (
    <div className="page missing">
      <p>这一页找不到了，可能换了地方。</p>
      <a className="primary-btn" href={href.home}>回到首页</a>
    </div>
  );
}
