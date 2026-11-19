import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/base.css";
import "./styles/lab.css";
import "./styles/app.css";

// 实验模块直接操作画板 DOM，StrictMode 的二次挂载会让它们重复绑定，所以这里不用 StrictMode
createRoot(document.getElementById("root")!).render(<App />);
