import type { CSSProperties, ReactNode } from "react";
import type { Speaker } from "../lib/speech";
import { Avatar, names } from "./Avatar";

type Props = { who: Speaker; index?: number; speaking?: boolean; children: ReactNode };

export function Bubble({ who, index = 0, speaking, children }: Props) {
  return (
    <div className={`qa-line is-${who}${speaking ? " is-speaking" : ""}`} style={{ "--i": index } as CSSProperties}>
      <span className="qa-avatar"><Avatar who={who} /></span>
      <div className="qa-bubble">
        <span className="qa-name">{names[who]}</span>
        {children}
      </div>
    </div>
  );
}
