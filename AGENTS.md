# AGENTS.md：给接手这个仓库的代码助手

## 这是什么

**几何游乐场大冒险（`geometry-playground`）** 是一座给孩子和家长共玩的互动几何博物馆（与兄弟项目 `sci-playground`、`fourier-puzzle-game`、`bodyverse` 同属「小念和爸爸」系列）。全站由 7 岁好奇男孩 **小念** 和温和爱动手的 **爸爸** 串联引导，按 **10 座几何展馆** 收录可拖动、可尺规作图、可切片与迭代的互动实验（每馆至少两个）、大师百宝箱故事与「小念问爸爸」双人离线语音问答。

页面组织参考 `bodyverse`：每个问题有一页「左边父子对话、右边几何动画」的问答页；每个实验另有一块独立的游乐场画板，方便自由操作。

技术栈：**React 18 + TypeScript + Vite** 负责页面外壳；实验仍是 **原生 ES Modules + SVG + Web Animations**，由 `src/lib/useLab.ts` 挂到页面上；测试用 Node 22/24 原生测试运行器。Hash 路由，纯静态前端零后端，本机 `localStorage` 记录进度，`vite build` 打包到 `dist/` 部署 GitHub Pages。

> **动手扩充新实验、新命题、大师故事或父子问答之前，请先完整阅读项目 Skill：**
> - `.agents/skills/geometry-playground-builder/SKILL.md`（镜像于 `skills/geometry-playground-builder/SKILL.md`）
> - `.agents/skills/geometry-playground-builder/kit-reference.md`（共享画板、角色组件、页面与语音速查表）

---

## 命令

先运行一次 `npm install`。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服 (`http://127.0.0.1:8000/`) |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lab:new` | 查看 10 座展馆 ID 与新实验脚手架用法 |
| `npm run lab:new -- <hall> <id> "<中文标题>" --write` | 生成 `src/labs/<id>.js` 模板并自动注册到 `src/custom-labs.js` 与 `src/lab-talks.js` |
| `npm run check` | 运行仓库规则守卫（导入后缀、纯数学层、实验元数据、3 轮问答、百宝箱与语音完整性校验） |
| `npm run voice` | 增量采集全站台词并用 `edge-tts` 生成「小念（`zh-CN-YunxiaNeural +0%`）& 爸爸（`zh-CN-YunxiNeural -5%`）」标准语音 MP3 与清单 |
| `npm test` | Node 原生测试运行器（几何数学、《几何原本》卷 I、全站音频清单测试） |
| `npm run build` | 类型检查后用 Vite 打包到 `dist/` |
| `npm run smoke` | 先打包，再用无头 Edge/Chrome 巡检 `dist/`：首页、旧地址跳转、10 座展馆、全部问答页与游乐场，桌面 `1280×900` 与手机 `390/320px` 零溢出 |
| `npm run smoke -- <id>...` | 定向快速巡检新增或修改的实验 |

**交付前必跑门禁**：

```bash
npm run voice      # 若新增或修改任何小念/爸爸台词、实验 idea、百宝箱或问答，必须补齐离线 MP3
npm run check
npm test
npm run build
npm run smoke -- <新增或改动的labId>   # 若改动页面外壳/样式则跑全量 npm run smoke
```

---

## 地图

### 路由与存档兼容

| Hash 路由 | 页面 | 说明 |
| --- | --- | --- |
| `#` | `HomePage` | 首页：标题、几何明星轮播（每座展馆一张，共 10 张：莫比乌斯带、彭罗斯镶嵌、四维超立方体、乘法表心形线、双曲 {7,3} 镶嵌、科赫雪花、五种柏拉图立体、向日葵黄金角、沃罗诺伊图、尺规等边三角形；每张用所在展馆的主题色，链接到该馆和一块游乐场，并注明 Wolfram MathWorld 出处，不放对话）、搜索与随便问一题、十座展馆卡片、其他入口 |
| `#hall/<id>` | `HallPage` | 展馆：父子导览、问题按入门 / 进阶 / 挑战分组、这座馆的游乐场、可折叠的几何故事 |
| `#q/<id>` | `QuestionPage` | 问答页：左边小念和爸爸的对话，右边吸顶的几何动画；每轮对话是一幕，爸爸开口时画板演示；看完记为「看过」 |
| `#play` | `PlayRoute` | 游乐场目录，按展馆分组；`euclid` 保留卷 I 分章目录 |
| `#play/<id>` | `PlayRoute` | 独立游乐场：大画板、操作台、「摆出画面」预设、小挑战、爸爸的笔记；答对小挑战记为「点亮」 |
| `#progress` | `ProgressPage` | 我的进度（看过的问答 + 点亮的游乐场） |
| `#compare` | `ComparePage` | 曲率对照台，首页、非欧几何展馆和游乐场目录提供入口 |
| `#stories` | `StoriesPage` | 睡前聊天与全部几何故事 |

旧地址由 `src/lib/route.ts` 的 `legacyRedirect` 换成新地址：`#lab/<id>` → `#play/<id>`，`#question/<id>` → `#q/<id>`，`#reading` → `#stories`，`#halls` → `#`，`#hall/dynamic` → `#hall/transforms`，`#hall/<id>/<分区>` → `#hall/<id>`。

> 兼容约束：保持 `localStorage` 键 `geometry-playground:completed:v1`（点亮）、`geometry-playground:sound:v1`（声音开关）不变，新增的 `geometry-playground:heard:v1` 记录看过的问答；已上线的实验 ID 与卷 I 命题 ID 不改名；旧地址跳转不删。

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

- `index.html`、`vite.config.ts`、`tsconfig.json`：Vite 入口与配置（`base: "./"`，适配 GitHub Pages 子路径）
- `src/main.tsx`、`src/App.tsx`：挂载 React、按路由切换页面、离开页面时停止朗读
- `src/pages/`：`HomePage`、`HallPage`、`QuestionPage`、`PlayPage`（游乐场与目录）、`MorePages`（进度、对照台、故事）
- `src/components/`：`Avatar`（小念和爸爸头像）、`Bubble`（对话气泡）、`PageTop`（返回、标题、声音开关）、`TopicCard`（问题卡片）、`QuestionFilm`（问答动画）、`Stories`（几何故事卡与睡前聊天）、`HomeShowcase`（首页轮播：8 秒一张，鼠标悬停或键盘聚焦时暂停，有暂停按钮，减少动态效果时不自动播放）
- `src/showcase-figures.js` & `src/euclid-cover.js`：首页轮播的原生 SVG 画面，颜色取所在展馆的 `--bubble`；画面和读数都由 `src/math.js` / `src/spatial-math.js` 实时算出（`penroseTriangles` 罗宾逊细分、`hyperbolicTiling` 庞加莱圆盘镶嵌与 `diskTranslate` 平移、`timesTableEnvelope` 外摆线包络、`vogelSpiral` / `spiralFamilies` 黄金角螺旋、`platonicSolids` 与 `convexFaces`、`voronoiCells`），离开视野、切到后台或减少动态效果时暂停；等边三角形可拖动 B 点、点按或用方向键
- `src/lib/`：`catalog.ts`（展馆、问题、对话的类型化视图）、`route.ts`（路由与旧地址跳转）、`progress.ts`（看过 / 点亮记录）、`speech.ts`（朗读状态钩子）、`useLab.ts`（挂载原生 JS 实验）
- `src/styles/`：`base.css`（配色与按钮）、`lab.css`（画板、各实验图形、挑战与故事卡）、`app.css`（页面外壳，参考 bodyverse）。展馆、问答、游乐场和对照台在 `.page` 上设置 `--bubble`，`app.css` 由它派生 `--hall`、`--hall-soft`、`--hall-line`、`--hall-ink`，并把 `--border-color` 换成展馆色；按钮、卡片、画板边框、读数和滑块都跟着变。空间实验同样用浅色画板，不要再引入深色主题或写死橙色
- `src/question-catalog.js`：问题标题、小念遇到的生活场景、难度分组、展馆钩子、首页精选、首页轮播的几何明星（`homeShowcase`：`{ id, hall, play: [labId, 按钮文字], name, en, hook, source: [标题, https 链接] }`，每座展馆恰好一张，由 `check-rules.mjs` 校验），以及小挑战的两句固定台词
- `src/lab-modes.js`：实验 id 到实验函数的映射；`src/hall-theme.js`：展馆配色与图标
- `src/catalog.js` & `src/topics.js` & `src/custom-labs.js`：10 座展馆与实验注册表
- `src/speech.js` & `src/voice-manifest.js`：双人离线 MP3 队列播放 + `chime()` WebAudio 音效 + 浏览器 TTS 回退
- `src/board.js`：SVG 画板底座（坐标变换、拖拽与键盘方向键支持、Web Animations 描线与微弹跳动效）
- `src/spatial-view.js`：空间实验公用的 SVG 投影、旋转视角、立体面片、双图布局与可中断的逐帧演示；`src/spatial.js`、`src/sphere.js` 复用它把模型和定量对照图联动起来
- `src/cube-notebook.js`：正方体截面的 A/B 实验记录，只将切面方向和位置存入浏览器，面积与轮廓由 `src/spatial-math.js` 重算
- `src/curvature.js` / `src/curvature-math.js`：曲率对照台，以相同方位和实际径向距离在平面、球面与双曲面上同步放置顶点
- `src/math.js` & `src/spatial-math.js`：纯几何计算模块（不碰 DOM）
- `src/elements-data.js`、`src/elements-talks.js`、`src/lab-talks.js`、`src/geometry-story-data.js`：全站剧本、百宝箱故事与父子问答数据
- `tools/`：`new-lab.mjs`、`check-rules.mjs`、`smoke.mjs`、`generate-elements-voice.py`、`generate-all-voice.py`

### 下一阶段（尚未做）

- 把每题的对话从 3 轮扩到 5–8 轮，最后由小念总结。
- 把 `QuestionFilm` 换成按时间轴逐笔画出的讲解片（圆规画弧、点沿路径走、量角标注），画面时长跟着配音走。问答页只依赖 `QuestionFilm` 的 `playTurn` 和 `onTurn` 接口，换引擎时问答页不用动。
- 这两项都会改动 `check-rules.mjs` 和测试里「恰好 3 轮」的约束，届时一起放宽。

---

## 硬性规矩

1. **几何准确性不可妥协**：所有几何坐标、相切比例、截面多边形、测地线与不变量必须真实计算，绝不能靠假图形糊弄，不能出现 `NaN`。
2. **纯计算与视图分离**：`src/math.js` 与 `src/spatial-math.js` 保持纯函数，不访问 `document`/`window`/`localStorage`。
3. **每个实验都必须配 3 轮「小念问爸爸」**：`elementsTalks` 或 `labTalks` 中必须配置 3 轮且绑定 3 个不同的 `demo` 场景。问答页里每一轮是一幕动画；游乐场里只有点「摆出画面」才驱动画板，演示不破坏用户已经画好的图。
4. **小念 × 爸爸角色与音色统一**：小念好奇敢猜、爱用生活比喻；爸爸温和启发，严禁贬损词；离线语音统一使用 `zh-CN-YunxiaNeural (+0%)` 与 `zh-CN-YunxiNeural (-5%)`。
5. **移动端与无障碍**：桌面 `1280×900` 与手机 `320px/390px` 零横向溢出，可拖拽点同时支持键盘方向键微调，遵守 `prefers-reduced-motion: reduce`（问答动画不自动播放）。
6. **导入后缀**：`src/` 下的 `.js` 文件与 `tests/` 的相对导入必须显式带 `.js` 后缀；`.ts/.tsx` 之间互相导入不写后缀，但导入原生 `.js` 模块时必须写 `.js`。
7. **实验模块不依赖 React**：`src/labs/`、`src/*.js` 里的实验只操作传入的容器；不要在实验里引入 React 或读路由。
