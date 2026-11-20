import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { stopSpeaking } from "./speech.js";
import { loadLabMode } from "./lab-modes.js";
import { hallById, topicById } from "./lib/catalog";
import { useRoute, type Route } from "./lib/route";
import { HomePage } from "./pages/HomePage";
import { MissingPage } from "./components/MissingPage";

// 首页随入口一起下载，其余页面按路由拆包，打开时再取
const HallPage = lazy(() => import("./pages/HallPage").then((m) => ({ default: m.HallPage })));
const QuestionRoute = lazy(() => import("./pages/QuestionPage").then((m) => ({ default: m.QuestionRoute })));
const PlayRoute = lazy(() => import("./pages/PlayPage").then((m) => ({ default: m.PlayRoute })));
const ProgressPage = lazy(() => import("./pages/MorePages").then((m) => ({ default: m.ProgressPage })));
const ComparePage = lazy(() => import("./pages/MorePages").then((m) => ({ default: m.ComparePage })));
const StoriesPage = lazy(() => import("./pages/MorePages").then((m) => ({ default: m.StoriesPage })));

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

/** 问答页和游乐场要用的实验代码与页面代码同时开始下载，不用等页面挂载后再排队 */
function prefetchLab(route: Route) {
  const id = route.page === "question" || route.page === "playground" ? route.id : undefined;
  if (id && topicById(id)) loadLabMode(id).catch(() => {});
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

function Loading() {
  return <div className="page page-loading" role="status" aria-live="polite">正在打开…</div>;
}

/** 网络断开等原因导致页面代码下载失败时，给出重新加载的入口，而不是整页空白 */
class LoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="page missing">
        <p>这一页没有加载成功，可能是网络断了一下。</p>
        <button type="button" className="primary-btn" onClick={() => window.location.reload()}>重新加载</button>
      </div>
    );
  }
}

export function App() {
  const route = useRoute();
  const key = JSON.stringify(route);
  prefetchLab(route);

  useEffect(() => {
    const title = titleOf(route);
    document.title = title ? `${title} · ${site}` : `${site}大冒险`;
    window.scrollTo({ top: 0 });
    return stopSpeaking;
  }, [key]);

  return (
    <LoadBoundary key={key}>
      <Suspense fallback={<Loading />}>
        <Page route={route} />
      </Suspense>
    </LoadBoundary>
  );
}