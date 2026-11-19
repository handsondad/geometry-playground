import type { CSSProperties } from "react";
import { themeOf, turnsFor, type Topic } from "../lib/catalog";
import { useProgress } from "../lib/progress";
import { href } from "../lib/route";

/** 问题卡片：标题是小念的问题，下面一行是他刚遇到的事 */
export function TopicCard({ topic, showHall = false }: { topic: Topic; showHall?: boolean }) {
  const { heard, lit } = useProgress();
  const theme = themeOf(topic.hall.id);
  const seen = heard.has(topic.id);
  const turns = turnsFor(topic.id).length;
  return (
    <a
      className={seen ? "qlist-card is-heard" : "qlist-card"} href={href.question(topic.id)}
      style={{ "--bubble": theme.hex } as CSSProperties}
    >
      <strong>{topic.title}</strong>
      <span className="qlist-trigger">{topic.trigger}</span>
      <span className="qlist-badges">
        {showHall && <em className="is-hall">{theme.emoji} {topic.hall.name}</em>}
        <em>💬 {turns} 问 {turns} 答</em>
        {seen && <em className="is-star">⭐ 看过</em>}
        {lit.has(topic.id) && <em className="is-lit">🧪 已点亮</em>}
      </span>
    </a>
  );
}
