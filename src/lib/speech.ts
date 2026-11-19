import { useSyncExternalStore } from "react";
import { getSound, getSpeaking, isSpeakingLine, setSound, subscribeSpeaking } from "../speech.js";

export type Speaker = "nian" | "dad";
export type Line = { who: Speaker; text: string; src?: string };

const subscribe = (listener: () => void) => {
  const off = subscribeSpeaking(listener);
  return () => { off(); };
};

/** 正在朗读的那句；没有在读时是 null */
export function useSpeaking(): Line | null {
  return useSyncExternalStore(subscribe, () => getSpeaking() as Line | null);
}

export function useSound(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, () => getSound() as boolean);
  return [on, setSound];
}

export const isLine = (line: Line | null, who: Speaker, text: string) => isSpeakingLine(line, who, text) as boolean;
