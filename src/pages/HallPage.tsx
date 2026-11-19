import { useState, type CSSProperties } from "react";
import { say, stopSpeaking } from "../speech.js";
import { geometryTalks, geometryWiki, hallChats } from "../geometry-story-data.js";
import { difficultyHint, difficultyLabel } from "../question-catalog.js";
import { Avatar } from "../components/Avatar";
import { PageTop } from "../components/PageTop";
import { TopicCard } from "../components/TopicCard";
import { TalkCard, WikiCard, type GeometryTalk, type WikiStory } from "../components/Stories";
import { halls, themeOf, topics, type Hall } from "../lib/catalog";
import { useProgress } from "../lib/progress";
import { href } from "../lib/route";
import { isLine, useSpeaking } from "../lib/speech";

const guides = hallChats as unknown as Record<string, readonly [string, string]>;
const stories = geometryWiki as readonly WikiStory[];
const talks = geometryTalks as readonly GeometryTalk[];
const labels = difficultyLabel as Record<number, string>;
const hints = difficultyHint as Record<number, string>;

export function HallPage({ hall }: { hall: Hall }) {
  const theme = themeOf(hall.id);
  const { heard, lit } = useProgress();
  const speaking = useSpeaking();
  const list = topics.filter((topic) => topic.hall.id === hall.id);
  const seen = list.filter((topic) => heard.has(topic.id)).length;
  const [nian, dad] = guides[hall.id];
  const guiding = isLine(speaking, "nian", nian) || isLine(speaking, "dad", dad);
  const hallStories = stories.filter((story) => story.hall === hall.id);
  const hallTalks = talks.filter((talk) => talk.hall === hall.id);
  const [openTalk, setOpenTalk] = useState<number>();

  return (
    <div className="page qlist" style={{ "--bubble": theme.hex } as CSSProperties}>
      <PageTop
        backHref={href.home} backLabel="十座展馆"
        kicker={`${list.length} 个问题 · 看过 ${seen} 个`}
        title={<><span aria-hidden="true">{theme.emoji}</span> {hall.name}</>}
      />

      <div className="qlist-intro">
        <p className={isLine(speaking, "nian", nian) ? "is-speaking" : undefined}><Avatar who="nian" /><b>小念：</b>{nian}</p>
        <p className={isLine(speaking, "dad", dad) ? "is-speaking" : undefined}><Avatar who="dad" /><b>爸爸：</b>{dad}</p>
        <button
          type="button" className="qlist-listen"
          onClick={() => (guiding ? stopSpeaking() : say({ who: "nian", text: nian }, { who: "dad", text: dad }))}
        >{guiding ? "⏹ 停一下" : "▶ 听他们说"}</button>
      </div>

      {[1, 2, 3].map((level) => {
        const group = list.filter((topic) => topic.difficulty === level);
        if (!group.length) return null;
        return (
          <section key={level} className="qlist-group" aria-label={labels[level]}>
            <h2><span aria-hidden="true">{"⭐".repeat(level)}</span> {labels[level]} <small>{hints[level]}</small></h2>
            <div className="qlist-grid">{group.map((topic) => <TopicCard key={topic.id} topic={topic} />)}</div>
          </section>
        );
      })}

      <section className="qlist-play" aria-labelledby="hall-play">
        <h2 id="hall-play">🧪 这座展馆的游乐场</h2>
        <p>看完问答，换你动手：每个问题都有一块能拖、能调、能验证的画板。</p>
        <div className="qlist-chips">
          {list.map((topic) => (
            <a key={topic.id} className="chip" href={href.play(topic.id)}>{lit.has(topic.id) ? "⭐ " : ""}{topic.name}</a>
          ))}
          {hall.id === "non-euclid" && <a className="chip is-strong" href={href.compare}>🌐 曲率对照台</a>}
        </div>
      </section>

      {hallStories.length + hallTalks.length > 0 && (
        <details className="qlist-stories">
          <summary>📚 几何故事：数学家的真事、家庭小实验和睡前聊天（{hallStories.length + hallTalks.length}）</summary>
          {hallTalks.length > 0 && (
            <div className="talk-list">
              {hallTalks.map((talk, index) => (
                <TalkCard key={talk.title} talk={talk} open={openTalk === index} onToggle={() => setOpenTalk(openTalk === index ? undefined : index)} />
              ))}
            </div>
          )}
          <div className="wiki-grid">{hallStories.map((story) => <WikiCard key={story.id} story={story} />)}</div>
        </details>
      )}

      <nav className="qlist-other" aria-labelledby="hall-other">
        <h2 id="hall-other">换一座展馆</h2>
        <div className="qlist-chips">
          {halls.map((item) => (
            <a key={item.id} className="chip" href={href.hall(item.id)} aria-current={item.id === hall.id ? "true" : undefined}>
              {themeOf(item.id).emoji} {item.name}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
