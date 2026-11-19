import { useEffect, useRef, useState, type CSSProperties } from "react";
import { comparisonHtml, mountComparison } from "../curvature.js";
import { geometryTalks, geometryWiki } from "../geometry-story-data.js";
import { PageTop } from "../components/PageTop";
import { TalkCard, WikiCard, type GeometryTalk, type WikiStory } from "../components/Stories";
import { halls, themeOf, topics } from "../lib/catalog";
import { storageNotice, useProgress } from "../lib/progress";
import { href } from "../lib/route";

const talks = geometryTalks as readonly GeometryTalk[];
const stories = geometryWiki as readonly WikiStory[];

export function ComparePage() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = root.current;
    if (!box) return;
    const abort = new AbortController();
    box.innerHTML = comparisonHtml();
    mountComparison(box, abort.signal);
    return () => {
      abort.abort();
      box.innerHTML = "";
    };
  }, []);
  return (
    <div className="page compare-page" style={{ "--bubble": themeOf("non-euclid").hex } as CSSProperties}>
      <PageTop backHref={href.hall("non-euclid")} backLabel={`${themeOf("non-euclid").emoji} 非欧几何`} kicker="曲率对照台" title="🌐 三个世界，同一个三角形" />
      <div ref={root} />
    </div>
  );
}

export function StoriesPage() {
  const [open, setOpen] = useState<number>();
  return (
    <div className="page stories">
      <PageTop backHref={href.home} backLabel="首页" kicker={`${talks.length} 段聊天 · ${stories.length} 个故事`} title="📚 几何故事" />
      <section aria-labelledby="stories-talks">
        <h2 id="stories-talks" className="home-section-title">小念问爸爸：睡前聊聊</h2>
        <div className="talk-list">
          {talks.map((talk, index) => (
            <TalkCard key={talk.title} talk={talk} open={open === index} onToggle={() => setOpen(open === index ? undefined : index)} />
          ))}
        </div>
      </section>
      {halls.map((hall) => {
        const list = stories.filter((story) => story.hall === hall.id);
        if (!list.length) return null;
        return (
          <section key={hall.id} aria-label={hall.name}>
            <h2 className="home-section-title">{themeOf(hall.id).emoji} {hall.name}</h2>
            <div className="wiki-grid">{list.map((story) => <WikiCard key={story.id} story={story} />)}</div>
          </section>
        );
      })}
    </div>
  );
}

function explorerRank(done: number, total: number) {
  if (done >= total) return "🏆 全馆几何大师";
  if (done >= Math.ceil(total * 0.6)) return "🧭 空间探险家";
  if (done >= Math.ceil(total * 0.25)) return "📐 尺规小工匠";
  return "🌱 几何好奇宝宝";
}

export function ProgressPage() {
  const { lit, heard } = useProgress();
  const total = topics.length;
  const pct = (n: number) => Math.round((n / total) * 100);
  const notice = storageNotice();
  return (
    <div className="page progress">
      <PageTop backHref={href.home} backLabel="首页" kicker="只保存在这台设备的浏览器里" title={`我的进度 · ${explorerRank(lit.size, total)}`} />
      <div className="card progress-summary">
        {notice && <p className="banner is-warn" role="status">{notice}</p>}
        {[["🎬 看完的问答", heard.size], ["🧪 点亮的游乐场", lit.size]].map(([label, n]) => (
          <div key={label} className="meter-wrap">
            <div className="meter-label"><span>{label} {n} / {total}</span><span>{pct(Number(n))}%</span></div>
            <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct(Number(n))}>
              <span style={{ width: `${pct(Number(n))}%` }} />
            </div>
          </div>
        ))}
        <p className="note">从头看完一个问题的动画问答记为「看完」；在游乐场答对小挑战记为「点亮」。</p>
      </div>
      <div className="progress-grid">
        {halls.map((hall) => {
          const theme = themeOf(hall.id);
          const done = hall.lessons.filter((lesson) => lit.has(lesson.id)).length;
          return (
            <div key={hall.id} className="card" style={{ borderTop: `5px solid ${theme.hex}` }}>
              <h2 className="side-title">{theme.emoji} {hall.name} ({done} / {hall.lessons.length})</h2>
              <div className="progress-list">
                {hall.lessons.map((lesson) => (
                  <div key={lesson.id} className={lit.has(lesson.id) ? "progress-row is-done" : "progress-row"}>
                    <a href={href.play(lesson.id)}>{lit.has(lesson.id) ? "⭐" : "○"} {lesson.name}</a>
                    <a className="progress-heard" href={href.question(lesson.id)}>{heard.has(lesson.id) ? "🎬 看过" : "🎬 去看"}</a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
