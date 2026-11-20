import { useState, type CSSProperties } from "react";
import { chime, getSound, say } from "../speech.js";
import { originalProposition, readingSections, readingSources } from "../elements-data.js";
import { challengeCheer, challengeHint } from "../question-catalog.js";
import { Bubble } from "../components/Bubble";
import { PageTop } from "../components/PageTop";
import { actTitle } from "../components/QuestionFilm";
import { MissingPage } from "../components/MissingPage";
import { propositionByNumber, propositionOf, themeOf, topicById, topics, turnsFor, type Topic } from "../lib/catalog";
import { markLit, storageNotice, useProgress } from "../lib/progress";
import { href } from "../lib/route";
import { useLab } from "../lib/useLab";

function Challenge({ topic }: { topic: Topic }) {
  const { lit } = useProgress();
  const [picked, setPicked] = useState<number>();
  const right = picked === topic.answer;
  const pick = (index: number) => {
    setPicked(index);
    if (index !== topic.answer) {
      chime(false);
      if (getSound()) void say({ who: "dad", text: challengeHint });
      return;
    }
    markLit(topic.id);
    chime(true);
    if (getSound()) void say({ who: "nian", text: challengeCheer(topic) }, { who: "dad", text: topic.idea });
  };
  return (
    <section id="lab-challenge" className="card challenge" aria-labelledby="challenge-title">
      <h2 id="challenge-title" className="side-title">
        🎯 小挑战 {lit.has(topic.id) && <span className="complete-mark">⭐ 已点亮</span>}
      </h2>
      <p className="challenge-q">{topic.question}</p>
      <div id="choices" aria-label="挑战选项">
        {topic.choices.map((choice, index) => (
          <button
            key={index} type="button" data-choice={index} onClick={() => pick(index)}
            className={picked === index ? (right ? "choice correct" : "choice incorrect") : "choice"}
          >
            <span>{"ABC"[index]}</span>{choice}
          </button>
        ))}
      </div>
      <div id="feedback" role="status">
        {picked !== undefined && !right && <Bubble who="dad"><p>{challengeHint}</p></Bubble>}
        {right && (
          <div className="win-card">
            <p className="done-stars" aria-hidden="true">⭐⭐⭐</p>
            <p className="verdict is-right">🎉 答对啦！已点亮「{topic.name}」</p>
            <Bubble who="nian"><p>{challengeCheer(topic)}</p></Bubble>
            {storageNotice() && <p className="note">{storageNotice()}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function DadNotes({ topic }: { topic: Topic }) {
  const proposition = propositionOf(topic.id);
  return (
    <section className="card play-notes" aria-labelledby="notes-title">
      <h2 id="notes-title" className="side-title">📝 {proposition ? "爸爸的证明笔记" : "爸爸的观察笔记"}</h2>
      <Bubble who="dad"><p>{topic.idea}</p></Bubble>
      {proposition && (
        <div className="play-links">
          <p className="note">{proposition.uses.length ? "这条命题用到了：" : "从构造公设起步，不需要引用前面的命题。"}</p>
          <ul className="ref-list">
            {proposition.uses.map((n) => {
              const used = propositionByNumber(n);
              const lesson = used && topicById(used.id);
              return (
                <li key={n}>
                  {lesson
                    ? <a href={href.play(lesson.id)}>I.{n} · {lesson.name}</a>
                    : <a href={originalProposition(n)} target="_blank" rel="noreferrer">I.{n} · 读原文（英文）</a>}
                </li>
              );
            })}
          </ul>
          <a className="pill-btn" href={originalProposition(proposition.n)} target="_blank" rel="noreferrer">对照命题 I.{proposition.n} 原文 ↗</a>
        </div>
      )}
      {topic.sources && (
        <ul className="ref-list">
          {topic.sources.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">📚 {label}</a></li>)}
        </ul>
      )}
    </section>
  );
}

function PlayPage({ topic }: { topic: Topic }) {
  const theme = themeOf(topic.hall.id);
  const turns = turnsFor(topic.id);
  const { lit } = useProgress();
  const lab = useLab(topic, true);
  const [shown, setShown] = useState<number>();
  const index = topics.indexOf(topic);
  const prev = topics[(index - 1 + topics.length) % topics.length];
  const next = topics[(index + 1) % topics.length];
  const hasRecords = topic.id === "cube-section";

  const preset = (turn: number) => {
    setShown(turn);
    lab.demo.current?.(...turns[turn].scene);
    lab.canvas.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="page play" style={{ "--bubble": theme.hex } as CSSProperties}>
      <PageTop
        backHref={href.play()} backLabel="游乐场"
        kicker={<>{theme.emoji} {topic.hall.name} · {topic.tag}</>}
        title={topic.name}
        tools={lit.has(topic.id) ? <span className="star-chip">⭐ 已点亮</span> : undefined}
      />
      <p className="play-intro">{topic.intro}</p>

      <section id="lab-workbench" className={hasRecords ? "play-bench has-cut-notebook" : "play-bench"} aria-label="动手实验">
        <div className="play-board">
          <div ref={lab.canvas} id="canvas" />
          <div ref={lab.stats} id="stats" className="readout-grid" />
          {hasRecords && <div ref={lab.records} id="lab-records" />}
        </div>
        <aside className="play-panel">
          <h2 className="side-title">操作台</h2>
          <div ref={lab.controls} id="controls" className="controls" />
          <p ref={lab.notice} id="notice" className="status lab-status" role="status" />
          <div ref={lab.guide} id="lab-guide" />
          <div className="play-presets" aria-labelledby="presets-title">
            <h3 id="presets-title">📌 摆出画面</h3>
            <p>一键摆出问答里那几幕，再接着自己拖。</p>
            <div className="play-preset-list">
              {turns.map((turn, i) => (
                <button
                  key={i} type="button" data-preset={i} title={turn.dad} onClick={() => preset(i)}
                  aria-pressed={shown === i}
                ><b>{i + 1}</b>{actTitle(i, turns.length)}</button>
              ))}
            </div>
            <a className="play-listen" href={href.question(topic.id)}>🎬 先听小念和爸爸讲这一题 →</a>
          </div>
        </aside>
      </section>

      <div className="play-reading">
        <Challenge topic={topic} />
        <DadNotes topic={topic} />
      </div>

      <nav className="play-footer" aria-label="换一块画板">
        <a className="pill-btn" href={href.play(prev.id)}>← {prev.name}</a>
        <a className="pill-btn" href={href.hall(topic.hall.id)}>{theme.emoji} 回{topic.hall.name}</a>
        <a className="primary-btn" href={href.play(next.id)}>下一块：{next.name} →</a>
      </nav>
    </div>
  );
}

type Chapter = { name: string; intro: string; numbers: readonly number[] };
const chapters = readingSections as readonly Chapter[];
const sources = readingSources as unknown as readonly (readonly [string, string])[];

function PlayCard({ topic, prefix }: { topic: Topic; prefix?: string }) {
  const { lit } = useProgress();
  return (
    <a className="mode-card" href={href.play(topic.id)} style={{ "--bubble": themeOf(topic.hall.id).hex } as CSSProperties}>
      <strong>{prefix && <span className="mode-num">{prefix}</span>}{topic.name}<span className="mode-tag">{topic.tag}</span></strong>
      <small>{topic.intro}</small>
      <span className="mode-count"><span>{lit.has(topic.id) ? "⭐ 已点亮" : "还没点亮"}</span><span>去动手 →</span></span>
    </a>
  );
}

function ElementsBook({ list }: { list: readonly Topic[] }) {
  const inBook = new Set(chapters.flatMap((chapter) => chapter.numbers.map((n) => propositionByNumber(n)?.id)));
  const extras = list.filter((topic) => !inBook.has(topic.id));
  return (
    <>
      <details className="elements-primer">
        <summary>📖 开卷：欧几里得允许我们先做什么？</summary>
        <div>
          <p>《几何原本》从定义、公设和共同概念开始。画板用直尺和圆规画出图形，但一张看起来正确的图不能代替证明。</p>
          <ol>
            <li>可以连接任意两点。</li><li>有限直线可以继续延长。</li><li>给定圆心、半径，可以画圆。</li>
            <li>所有直角彼此相等。</li><li>若截线一侧的同旁内角之和小于两个直角，两条直线延长后会在这一侧相交。</li>
          </ol>
        </div>
      </details>
      {chapters.map((chapter) => (
        <section key={chapter.name} className="elements-chapter">
          <h3>{chapter.name}</h3>
          <p className="note">{chapter.intro}</p>
          <div className="play-cards">
            {chapter.numbers.map((n) => {
              const topic = topicById(propositionByNumber(n)?.id);
              return topic && <PlayCard key={n} topic={topic} prefix={`I.${n}`} />;
            })}
          </div>
        </section>
      ))}
      {extras.length > 0 && (
        <section className="elements-chapter">
          <h3>✨ 同馆延伸实验</h3>
          <div className="play-cards">{extras.map((topic) => <PlayCard key={topic.id} topic={topic} />)}</div>
        </section>
      )}
      <p className="elements-sources">
        <strong>编排参考：</strong>
        {sources.map(([label, url], i) => <span key={url}>{i > 0 && " · "}<a href={url} target="_blank" rel="noreferrer">{label}</a></span>)}
      </p>
    </>
  );
}

function PlayIndex() {
  const { lit } = useProgress();
  const groups = topics.reduce<Map<string, Topic[]>>((map, topic) => {
    map.set(topic.hall.id, [...(map.get(topic.hall.id) ?? []), topic]);
    return map;
  }, new Map());
  return (
    <div className="page play-index">
      <PageTop backHref={href.home} backLabel="首页" kicker={`${topics.length} 块画板 · 已点亮 ${lit.size}`} title="🧪 动手游乐场" />
      <div className="qlist-intro">
        <p><b>小念：</b>爸爸讲完了，我能自己试试吗？</p>
        <p><b>爸爸：</b>当然！每块画板都在真的计算：拖动点、拉滑块、切一刀，看看哪些数变了、哪些数一直不变。答对小挑战就能点亮它。</p>
      </div>
      {[...groups].map(([hallId, list]) => {
        const theme = themeOf(hallId);
        return (
          <section key={hallId} className="play-group" aria-label={list[0].hall.name}>
            <h2>
              <span aria-hidden="true">{theme.emoji}</span> {list[0].hall.name}
              <small>{list.filter((topic) => lit.has(topic.id)).length} / {list.length}</small>
            </h2>
            {hallId === "euclid"
              ? <ElementsBook list={list} />
              : <div className="play-cards">{list.map((topic) => <PlayCard key={topic.id} topic={topic} />)}</div>}
            {hallId === "non-euclid" && <a className="pill-btn" href={href.compare}>🌐 曲率对照台：三个世界，同一个三角形 →</a>}
          </section>
        );
      })}
    </div>
  );
}

export function PlayRoute({ id }: { id?: string }) {
  if (!id) return <PlayIndex />;
  const topic = topicById(id);
  if (!topic) return <MissingPage />;
  return <PlayPage key={topic.id} topic={topic} />;
}
