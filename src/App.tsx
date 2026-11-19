import { useEffect } from "react";
import { stopSpeaking } from "./speech.js";
import { hallById, topicById } from "./lib/catalog";
import { useRoute, type Route } from "./lib/route";
import { HomePage } from "./pages/HomePage";
import { HallPage } from "./pages/HallPage";
import { MissingPage, QuestionRoute } from "./pages/QuestionPage";
import { PlayRoute } from "./pages/PlayPage";
import { ComparePage, ProgressPage, StoriesPage } from "./pages/MorePages";

const site = "几何游乐场";

function titleOf(route: Route) {
  switch (route.page) {
    case "hall": return hallById(route.id)?.name;
    case "question": return topicById(route.id)?.title;
    case "playground": return route.id ? `${topicById(route.id)?.name ?? ""} · 游乐场` : "动手游乐场";
    case "progress": return "我的进度";
    case "compare": return "曲率对照台";
    case "stories": return "几何故事";
    default: return undefined;
  }
}

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case "hall": {
      const hall = hallById(route.id);
      return hall ? <HallPage key={hall.id} hall={hall} /> : <MissingPage />;
    }
    case "question": return <QuestionRoute id={route.id} />;
    case "playground": return <PlayRoute id={route.id} />;
    case "progress": return <ProgressPage />;
    case "compare": return <ComparePage />;
    case "stories": return <StoriesPage />;
    default: return <HomePage />;
  }
}

export function App() {
  const route = useRoute();
  const key = JSON.stringify(route);

  useEffect(() => {
    const title = titleOf(route);
    document.title = title ? `${title} · ${site}` : `${site}大冒险`;
    window.scrollTo({ top: 0 });
    return stopSpeaking;
  }, [key]);

  return <Page route={route} />;
}
