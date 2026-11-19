import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "hall"; id: string }
  | { page: "question"; id: string }
  | { page: "playground"; id?: string }
  | { page: "progress" }
  | { page: "compare" }
  | { page: "stories" };

export const href = {
  home: "#",
  hall: (id: string) => `#hall/${id}`,
  question: (id: string) => `#q/${id}`,
  play: (id?: string) => (id ? `#play/${id}` : "#play"),
  progress: "#progress",
  compare: "#compare",
  stories: "#stories",
};

/** 旧地址（#lab/、#question/、#reading、#hall/dynamic……）换成现在的地址；不需要换时返回 undefined */
export function legacyRedirect(hash: string): string | undefined {
  const [page, id] = hash.replace(/^#/, "").split("/");
  if (page === "lab" && id) return href.play(id);
  if (page === "question" && id) return href.question(id);
  if (page === "reading") return href.stories;
  if (page === "halls") return href.home;
  if (page === "hall" && id === "dynamic") return href.hall("transforms");
  if (page === "hall" && hash.split("/").length > 2) return href.hall(id);
  return undefined;
}

export function parseRoute(hash: string): Route {
  const [page, id] = hash.replace(/^#/, "").split("/");
  switch (page) {
    case "hall": return id ? { page: "hall", id } : { page: "home" };
    case "q": return id ? { page: "question", id } : { page: "home" };
    case "play": return { page: "playground", id: id || undefined };
    case "progress": return { page: "progress" };
    case "compare": return { page: "compare" };
    case "stories": return { page: "stories" };
    default: return { page: "home" };
  }
}

function currentHash() {
  const target = legacyRedirect(window.location.hash);
  if (target) window.history.replaceState(null, "", target);
  return window.location.hash;
}

export function useRoute(): Route {
  const [hash, setHash] = useState(currentHash);
  useEffect(() => {
    const sync = () => setHash(currentHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return parseRoute(hash);
}
