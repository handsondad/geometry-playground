import type { CSSProperties } from "react";
import { say, stopSpeaking } from "../speech.js";
import { themeOf } from "../lib/catalog";
import { href } from "../lib/route";
import { isLine, useSpeaking, type Line } from "../lib/speech";
import { Bubble } from "./Bubble";

export type WikiStory = {
  id: string; hall: string; emoji: string; era: string; scientist: string; title: string;
  story: string; homeLab: string; relatedLabId: string; relatedLabTitle: string; source?: readonly [string, string];
};

export type GeometryTalk = {
  hall: string; emoji: string; title: string; wrap: string; turns: readonly { nian: string; dad: string }[];
};

/** 大师故事 + 家庭小实验；朗读文本和配音清单里的那句一字不差 */
export function WikiCard({ story }: { story: WikiStory }) {
  const speaking = useSpeaking();
  const spoken = `${story.scientist}的故事：${story.title}。${story.story} ${story.homeLab}`;
  const active = isLine(speaking, "dad", spoken);
  return (
    <article className="wiki-card" style={{ "--wiki-accent": themeOf(story.hall)?.hex ?? "#ff9f43" } as CSSProperties}>
      <header className="wiki-head">
        <span className="wiki-emoji" aria-hidden="true">{story.emoji}</span>
        <div className="wiki-meta">
          <small>{story.era} · {story.scientist}</small>
          <h3>{story.title}</h3>
        </div>
        <button
          type="button" className={active ? "speak-btn is-speaking" : "speak-btn"}
          aria-label={active ? "停止朗读" : `听爸爸讲：${story.title}`}
          onClick={() => (active ? stopSpeaking() : say({ who: "dad", text: spoken }))}
        >🔊</button>
      </header>
      <p className="wiki-story">{story.story}</p>
      <div className="wiki-lab">{story.homeLab}</div>
      <footer className="wiki-foot">
        <a className="pill-btn" href={href.play(story.relatedLabId)}>🧪 去玩「{story.relatedLabTitle}」 →</a>
        {story.source && <a className="wiki-source" href={story.source[1]} target="_blank" rel="noreferrer">{story.source[0]} ↗</a>}
      </footer>
    </article>
  );
}

const talkLines = (talk: GeometryTalk): Line[] => [
  ...talk.turns.flatMap((turn) => [{ who: "nian" as const, text: turn.nian }, { who: "dad" as const, text: turn.dad }]),
  { who: "nian", text: talk.wrap },
];

/** 一组可以展开、从头听到尾的小念问爸爸 */
export function TalkCard({ talk, open, onToggle }: { talk: GeometryTalk; open: boolean; onToggle: () => void }) {
  const speaking = useSpeaking();
  const lines = talkLines(talk);
  const toggle = () => {
    if (open) stopSpeaking();
    else void say(...lines);
    onToggle();
  };
  return (
    <article className={open ? "talk-card is-open" : "talk-card"}>
      <button type="button" className="talk-head" aria-expanded={open} onClick={toggle}>
        <span className="talk-emoji" aria-hidden="true">{talk.emoji}</span>
        <strong>{talk.title}</strong>
        <small>{open ? "收起 ▲" : "听他们聊 ▶"}</small>
      </button>
      {open && (
        <div className="talk-body">
          {lines.map((line, index) => (
            <Bubble key={index} who={line.who} index={index} speaking={isLine(speaking, line.who, line.text)}>
              <p>{line.text}</p>
            </Bubble>
          ))}
        </div>
      )}
    </article>
  );
}
