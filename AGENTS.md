# AGENTS.md：给接手这个仓库的代码助手

## 这是什么

**几何游乐场大冒险（`geometry-playground`）** 是一座给孩子和家长共玩的互动几何博物馆（与兄弟项目 `sci-playground`、`fourier-puzzle-game` 同属「小念和爸爸」系列）。全站由 7 岁好奇男孩 **小念** 和温和爱动手的 **爸爸** 串联引导，按 **10 座几何展馆** 收录可拖动、可尺规作图、可切片与迭代的 **26+ 互动实验**、大师百宝箱故事与「小念问爸爸」双人离线语音问答。

技术栈刻意克制：**零第三方 npm 依赖 · 原生 ES Modules + SVG + Web Animations + Node 22/24 原生测试**，Hash 路由（`#`、`#hall/<id>`、`#lab/<id>`、`#progress`），纯静态前端零后端，本机 `localStorage` 记录完成进度，直接打包到 `dist/` 部署 GitHub Pages。

> **动手扩充新实验、新命题、大师故事或父子问答之前，请先完整阅读项目 Skill：**
> - `.agents/skills/geometry-playground-builder/SKILL.md`（镜像于 `skills/geometry-playground-builder/SKILL.md`）
> - `.agents/skills/geometry-playground-builder/kit-reference.md`（共享画板、角色组件与语音速查表）

---

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地静态服 (`http://127.0.0.1:8000/`) |
| `npm run lab:new` | 查看 10 座展馆 ID 与新实验脚手架用法 |
| `npm run lab:new -- <hall> <id> "<中文标题>" --write` | 生成 `src/labs/<id>.js` 模板并自动注册到 `src/custom-labs.js` 与 `src/lab-talks.js` |
| `npm run check` | 运行仓库规则守卫（导入后缀、纯数学层、实验元数据、3 轮问答、百宝箱与语音完整性校验） |
| `npm run voice` | 增量采集全站台词并用 `edge-tts` 生成「小念（`zh-CN-YunxiaNeural +0%`）& 爸爸（`zh-CN-YunxiNeural -5%`）」标准语音 MP3 与清单 |
| `npm test` | Node 原生测试运行器（几何数学、《几何原本》卷 I、全站音频清单测试） |
| `npm run build` | 生成可部署 GitHub Pages 的静态产物到 `dist/` |
| `npm run smoke` | 无头 Edge/Chrome 全站巡检（首页 + 10 座展馆 + 全部实验 3 轮动画 + 桌面 `1280×900` 与手机 `390×844` 零溢出） |
| `npm run smoke -- <id>...` | 定向快速巡检新增或修改的实验 |

**交付前四步必跑门禁**：

```bash
npm run voice      # 若新增或修改任何小念/爸爸台词、实验 idea、百宝箱或问答，必须补齐离线 MP3
npm run check
npm test
npm run smoke -- <新增或改动的labId>   # 若改动公共壳层/样式则跑全量 npm run smoke
```

---

## 地图

### 路由与存档兼容

| Hash 路由 | 页面 | 说明 |
| --- | --- | --- |
| `#` / `#halls` | `mapPage()` | 探索大厅：探索勋章进度条、C 位「小念和爸爸」互动舞台、搜索与「随便玩一个」、10 座展馆、精选问答与几何百宝箱 |
| `#hall/<id>` | `hallPage()` | 分馆展厅：TopBar、父子开场导览、快捷锚点、实验卡片网格（`euclid` 含《几何原本》卷 I 分章目录）、本馆百宝箱与问答 |
| `#lab/<id>` | `labPage()` | 具体实验台：TopBar、3 轮 `StageStrip` + 小念问爸爸问答、SVG 互动画板、控制区、爸爸笔记与小挑战 |
| `#progress` | `progressPage()` | 我的进度册（等级徽章 + 分馆点亮清单） |

> 兼容约束：保持现有 `localStorage` 键 `geometry-playground:completed:v1`、声音开关键 `geometry-playground:sound:v1`、`#hall/dynamic` 重定向至 `transforms`，以及现有 26 个实验 ID 与卷 I 命题 ID 不改名。

### 十大展馆边界

| `hallId` | 展馆名 | 收录边界 |
| --- | --- | --- |
| `euclid` | 📐 平面几何与尺规 | 《几何原本》尺规作图、三角形全等、比例与算额经典几何 |
| `solids` | 🧊 立体与空间 | 多面体、三维旋转投影与平面截面 |
| `curves` | 🪐 坐标、方程与曲线 | 圆锥曲线、焦点轨迹、参数与坐标几何 |
| `transforms` | 🪞 变换、对称与透视 | 平移、旋转、反射、缩放、镜像反弹与对称图案 |
| `mosaics` | 🧩 镶嵌与离散几何 | 平面密铺、多边形内角和、格网与组合几何 |
| `non-euclid` | 🌍 非欧几何与曲率 | 球面大圆几何、庞加莱双曲圆盘、曲率与角亏 |
| `fractal` | ❄️ 分形与自相似 | 递归迭代、分形树、雪花周长与面积极限 |
| `topology` | ♾️ 拓扑与连续变形 | 莫比乌斯带、连通性、欧拉示性数与橡皮泥几何 |
| `computational` | 📍 计算几何与算法 | 沃罗诺伊图、凸包、最近邻、三角剖分与碰撞算法 |
| `dimensions` | 🔮 高维几何 | 四维超立方体投影、高维截面与维度类比 |

### 目录结构

- `index.html`、`style.css`：单页壳层与暖阳糖果色统一视觉样式（对齐 `sci-playground` / `fourier-puzzle-game`）
- `src/app.js`：Hash 路由、四大页面渲染、挑战与进度持久化
- `src/catalog.js` & `src/topics.js` & `src/custom-labs.js`：10 座展馆与实验注册表
- `src/components.js`：全站复用 UI 组件（完全对齐的 `portrait` 头像、`topBarHtml`、`duoStageHtml`、`saysHtml`、`chatHtml`、`talksSectionHtml`、`wikiSectionHtml`、`meterHtml`、`burstHtml`）
- `src/speech.js` & `src/voice-manifest.js`：双人离线 MP3 队列播放 + `chime()` WebAudio 音效 + 浏览器 TTS 回退
- `src/story-stage.js`：实验页顶部的 3 轮 `StageStrip` + 小念问爸爸联动动画控制器
- `src/board.js`：SVG 画板底座（坐标变换、拖拽与键盘方向键支持、Web Animations 描线与微弹跳动效）
- `src/math.js` & `src/spatial-math.js`：纯几何计算模块（不碰 DOM）
- `src/elements-data.js`、`src/elements-talks.js`、`src/lab-talks.js`、`src/geometry-story-data.js`：全站剧本、百宝箱故事与父子问答数据
- `tools/`：`new-lab.mjs`、`check-rules.mjs`、`smoke.mjs`、`build.mjs`、`generate-elements-voice.py`、`generate-all-voice.py`

---

## 硬性规矩

1. **几何准确性不可妥协**：所有几何坐标、相切比例、截面多边形、测地线与不变量必须真实计算，绝不能靠假图形糊弄，不能出现 `NaN`。
2. **纯计算与视图分离**：`src/math.js` 与 `src/spatial-math.js` 保持纯函数，不访问 `document`/`window`/`localStorage`。
3. **每个实验都必须配 3 轮「小念问爸爸」**：`elementsTalks` 或 `labTalks` 中必须配置 3 轮且绑定 3 个不同的 `demo` 场景，点击上一轮/下一轮/演示都能触发可见 SVG 动画且不破坏用户已经画好的图。
4. **小念 × 爸爸角色与音色统一**：小念好奇敢猜、爱用生活比喻；爸爸温和启发，严禁贬损词；离线语音统一使用 `zh-CN-YunxiaNeural (+0%)` 与 `zh-CN-YunxiNeural (-5%)`。
5. **移动端与无障碍**：桌面 `1280×900` 与手机 `320px/390px` 零横向溢出，可拖拽点同时支持键盘方向键微调，遵守 `prefers-reduced-motion: reduce`。
6. **相对导入带 `.js` 后缀**：`src/` 与 `tests/` 所有相对模块导入必须显式带 `.js` 后缀。
