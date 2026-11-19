import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { elementsClipUrl, getSound, say, stopSpeaking } from "../speech.js";
import { isElementsTalk, type Topic, type Turn } from "../lib/catalog";
import { isLine, useSpeaking, type Speaker } from "../lib/speech";
import { useLab } from "../lib/useLab";
import { SoundToggle } from "./PageTop";

export type FilmHandle = {
  /** 从第 turn 轮开始往后播 */
  playTurn: (turn: number) => void;
};

type Props = {
  topic: Topic;
  turns: readonly Turn[];
  /** 正在讲第几轮；有人开口时 who 是正在说话的人 */
  onTurn: (turn: number, who?: Speaker) => void;
  /** 整段问答播完 */
  onFinish: () => void;
};

const threeActs = ["先观察", "追问原因", "换个条件验证"];
export const actTitle = (index: number, count: number) => (count === 3 ? threeActs[index] : `第 ${index + 1} 轮`);

/** 没有声音时，每一轮画面停留的时间 */
const silentHold = 4800;

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * 问答动画（过渡版）：每一轮问答对应实验画板上的一个画面。小念问完、爸爸一开口，画面就切过去并描线。
 * 以后换成按时间轴逐笔画出来的讲解片时，只替换这个组件，问答页不用动。
 */
export const QuestionFilm = forwardRef<FilmHandle, Props>(function QuestionFilm({ topic, turns, onTurn, onFinish }, ref) {
  const lab = useLab(topic, false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const speaking = useSpeaking();
  const run = useRef(0);
  const stepRef = useRef(0);
  const reveal = useRef<string>();
  const timer = useRef<number>();
  const release = useRef<() => void>();
  const bundled = isElementsTalk(topic.id);

  const goTo = (index: number) => {
    stepRef.current = index;
    setStep(index);
  };

  const show = useCallback((index: number) => {
    reveal.current = undefined;
    lab.demo.current?.(...turns[index].scene);
  }, [lab.demo, turns]);

  const stopMotion = useCallback(() => {
    const board = lab.canvas.current?.querySelector<SVGSVGElement>("svg");
    if (board?.dataset.playing) lab.controls.current?.querySelector<HTMLButtonElement>('[data-action="play-space"]')?.click();
    board?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  }, [lab.canvas, lab.controls]);

  const stop = useCallback(() => {
    run.current += 1;
    reveal.current = undefined;
    window.clearTimeout(timer.current);
    release.current?.();
    release.current = undefined;
    setPlaying(false);
    stopMotion();
    stopSpeaking();
  }, [stopMotion]);

  const wait = (ms: number) => new Promise<void>((resolve) => {
    release.current = resolve;
    timer.current = window.setTimeout(() => {
      release.current = undefined;
      resolve();
    }, ms);
  });

  const line = (index: number, who: Speaker) => ({
    who, text: turns[index][who], src: bundled ? elementsClipUrl(topic.id, index + 1, who) : undefined,
  });

  async function playFrom(first: number, automatic = false) {
    stop();
    const token = run.current;
    setPlaying(true);
    setFinished(false);
    setNeedsTap(false);
    for (let index = first; index < turns.length; index += 1) {
      goTo(index);
      if (getSound()) {
        reveal.current = turns[index].dad;
        const ok = await say(line(index, "nian"), line(index, "dad"));
        if (token !== run.current) return;
        if (!ok) {
          if (automatic && index === first) {
            show(index);
            stop();
            setNeedsTap(true);
            return;
          }
          if (reveal.current) show(index);
          await wait(silentHold);
        }
      } else {
        await wait(650);
        if (token !== run.current) return;
        show(index);
        await wait(silentHold);
      }
      if (token !== run.current) return;
    }
    setPlaying(false);
    setFinished(true);
    onFinish();
  }

  const choose = (index: number) => {
    stop();
    setFinished(false);
    goTo(index);
    show(index);
  };

  useImperativeHandle(ref, () => ({ playTurn: (turn) => { void playFrom(turn); } }));

  useEffect(() => {
    // 只让画板本身不可操作；空间实验在手机上的「立体模型 / 对照图」切换仍然能点
    const board = lab.canvas.current?.querySelector("svg");
    if (board) {
      const shield = document.createElement("div");
      shield.inert = true;
      board.before(shield);
      shield.append(board);
    }
    show(0);
    if (!prefersReducedMotion()) void playFrom(0, true);
    return stop;
  }, []); // 只在进入页面时自动播一次；换题时整个组件按 key 重建

  useEffect(() => {
    if (reveal.current && isLine(speaking, "dad", reveal.current)) show(stepRef.current);
  }, [speaking, show]);

  const who: Speaker | undefined = isLine(speaking, "nian", turns[step].nian) ? "nian"
    : isLine(speaking, "dad", turns[step].dad) ? "dad" : undefined;
  useEffect(() => { onTurn(step, who); }, [step, who, onTurn]);

  const toggle = () => {
    if (playing) stop();
    else void playFrom(finished ? 0 : step);
  };

  return (
    <div className="film" aria-label="动画讲解" data-playing={playing}>
      <div className="film-stage">
        <div ref={lab.canvas} id="canvas" />
        <p className="film-title" aria-hidden="true"><b>{step + 1}</b>{actTitle(step, turns.length)}</p>
      </div>
      <div ref={lab.stats} id="stats" className="readout-grid film-readouts" aria-label="画面上的数据" />
      <div className="film-controls">
        <button
          type="button" className={needsTap ? "film-play is-waiting" : "film-play"} onClick={toggle}
          aria-label={playing ? "暂停" : finished ? "再看一遍" : "播放"}
        >
          {playing ? "❚❚" : finished ? "↻" : "▶"}
        </button>
        <div className="film-track" aria-hidden="true">
          {turns.map((_, index) => (
            <span key={index} className={index < step || (finished && index === step) ? "is-done" : index === step ? "is-on" : ""} />
          ))}
        </div>
        <span className="film-time">第 {step + 1} 幕 / {turns.length}</span>
        <SoundToggle />
      </div>
      {needsTap && <p className="film-hint">点 ▶ 听小念和爸爸讲</p>}
      <ol className="film-chips" aria-label="分段">
        {turns.map((_, index) => (
          <li key={index}>
            <button
              type="button" className={index === step ? "is-on" : index < step ? "is-done" : ""}
              aria-current={index === step ? "step" : undefined} onClick={() => choose(index)}
            >
              <b>{index + 1}</b>{actTitle(index, turns.length)}
            </button>
          </li>
        ))}
      </ol>
      <div hidden>
        <div ref={lab.controls} id="controls" />
        <div ref={lab.guide} id="lab-guide" />
        <div ref={lab.records} id="lab-records" />
        <p ref={lab.notice} id="notice" />
      </div>
    </div>
  );
});
