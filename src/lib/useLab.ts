import { useEffect, useRef } from "react";
import { makeBoard } from "../board.js";
import { labMode } from "../lab-modes.js";
import type { Lesson } from "./catalog";

/** 实验返回的演示函数：按问答里某一轮的 scene 参数摆出画面并播放描线动画 */
export type Demo = (...scene: readonly unknown[]) => void;

/**
 * 把原生 JS 写的实验模块挂到页面上。实验只认这几个容器（id 沿用旧版，巡检脚本也靠它们）：
 * #canvas 画板、#controls 操作台、#stats 读数、#lab-guide 证明步骤、#lab-records 截面记录、#notice 提示。
 * 使用这个钩子的组件要以实验 id 作为 key，换实验时整块重建，免得旧实验的监听留在容器上。
 */
export function useLab(lesson: Lesson, interactive: boolean) {
  const canvas = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const stats = useRef<HTMLDivElement>(null);
  const guide = useRef<HTMLDivElement>(null);
  const records = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLParagraphElement>(null);
  const demo = useRef<Demo>();

  useEffect(() => {
    const abort = new AbortController();
    const board = makeBoard(canvas.current, lesson.name);
    const notify = (message: string) => { if (notice.current) notice.current.textContent = message; };
    demo.current = labMode(lesson.id)({
      board, controls: controls.current, stats: stats.current, guide: guide.current, records: records.current,
      lesson, signal: abort.signal, notify, interactive,
    });
    const boxes = [canvas, controls, stats, guide, records];
    return () => {
      abort.abort();
      demo.current = undefined;
      for (const box of boxes) if (box.current) box.current.innerHTML = "";
    };
  }, [lesson, interactive]);

  return { canvas, controls, stats, guide, records, notice, demo };
}
