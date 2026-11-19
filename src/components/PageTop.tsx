import type { ReactNode } from "react";
import { getSound } from "../speech.js";
import { useSound } from "../lib/speech";

export function SoundToggle() {
  const [on, setOn] = useSound();
  return (
    <button
      type="button" className="sound-toggle" aria-pressed={on}
      aria-label={on ? "声音：开，点一下关掉" : "声音：关，点一下打开"}
      title={on ? "小念和爸爸会开口说话" : "静音"}
      onClick={() => setOn(!getSound())}
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}

type Props = {
  backHref: string; backLabel: string; kicker?: ReactNode; title: ReactNode; tools?: ReactNode;
  /** 页面里已经有自己的声音开关（问答动画）时关掉 */
  sound?: boolean;
};

/** 每个子页面顶上：返回按钮、一行小标签、大标题、右侧小工具 */
export function PageTop({ backHref, backLabel, kicker, title, tools, sound = true }: Props) {
  return (
    <header className="page-top">
      <a className="page-back" href={backHref}>← {backLabel}</a>
      <div className="page-heading">
        {kicker && <span className="page-kicker">{kicker}</span>}
        <h1>{title}</h1>
      </div>
      <div className="page-tools">{tools}{sound && <SoundToggle />}</div>
    </header>
  );
}
