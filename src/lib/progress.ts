import { useSyncExternalStore } from "react";
import { topics } from "./catalog";

/**
 * 两份只存在本机浏览器里的记录：
 * - 游乐场小挑战答对后「点亮」的实验（沿用已上线的键名，不能改）；
 * - 动画问答从头看到尾的问题。
 */
const keys = { lit: "geometry-playground:completed:v1", heard: "geometry-playground:heard:v1" } as const;
type Kind = keyof typeof keys;

const known = new Set(topics.map((topic) => topic.id));
let notice = "";

function read(kind: Kind): ReadonlySet<string> {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(keys[kind]) ?? "[]");
    if (!Array.isArray(raw)) throw new TypeError("进度数据格式不对");
    return new Set(raw.filter((id): id is string => typeof id === "string" && known.has(id)));
  } catch (error) {
    console.warn("读取本地进度失败", error);
    notice = "无法读取本地进度，这次探索仍可继续。";
    return new Set();
  }
}

const state: Record<Kind, ReadonlySet<string>> = { lit: read("lit"), heard: read("heard") };
const listeners = new Set<() => void>();

function add(kind: Kind, id: string) {
  if (state[kind].has(id)) return;
  state[kind] = new Set([...state[kind], id]);
  try {
    window.localStorage.setItem(keys[kind], JSON.stringify([...state[kind]]));
    notice = "";
  } catch (error) {
    console.warn("保存本地进度失败", error);
    notice = "无法保存到浏览器，进度只在这次访问中有效。";
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const markLit = (id: string) => add("lit", id);
export const markHeard = (id: string) => add("heard", id);
export const storageNotice = () => notice;

export function useProgress() {
  const lit = useSyncExternalStore(subscribe, () => state.lit);
  const heard = useSyncExternalStore(subscribe, () => state.heard);
  return { lit, heard };
}
