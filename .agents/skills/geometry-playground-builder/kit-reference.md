# `geometry-playground` 共享画板与组件速查表 (`kit-reference.md`)

所有实验、展馆与问答页面都复用共享工具模块，禁止在单个实验内重复造轮子。

页面外壳是 React + TypeScript（`src/main.tsx`、`src/App.tsx`、`src/pages/`、`src/components/`、`src/lib/`）；实验本身仍是原生 JS 模块，直接操作 SVG 画板。两边只通过 `src/lib/useLab.ts` 对接。

---

## 1. 实验函数签名与 `demo` 回调 (`src/lab-modes.js` / `src/labs/*.js`)

```js
export function myLab({ board, controls, stats, guide, records, lesson, signal, notify, interactive }) {
  // 1. 初始化控件到 controls.innerHTML
  // 2. 绑定事件时务必传入 { signal }，离开页面时自动清理监听
  // 3. 调用 board.draw(...) 绘制 SVG，stats.innerHTML 写入 metric(...)
  // 4. interactive 为 false 时（问答动画）画板只用来演示
  // 5. 返回给问答动画和「摆出画面」调用的场景回调：
  return (kind, ...args) => {
    // 根据场景参数切换状态、重绘，并触发 SVG 动画：
    board.animate('.result, .aux, .shape');
  };
}
```

`useLab(lesson, interactive)` 负责创建画板、通过 `requireLabMode(id)` 取到按需下载的实验函数并在卸载时 `abort()`；实验代码还没下载完时它会挂起渲染（React Suspense），`App` 已在外层包好 `<Suspense>`。它要求这些容器（id 沿用旧版，巡检脚本也靠它们定位）：`#canvas` 画板、`#controls` 操作台、`#stats` 读数、`#lab-guide` 证明步骤、`#lab-records` 截面记录、`#notice` 提示。使用它的组件要以实验 id 作为 `key`，换实验时整块重建。

---

## 2. SVG 画板原语 (`src/board.js`)

画板坐标系固定为 `W = 640, H = 400`：

- `line(a, b, cls)` / `infinite(a, b, cls)` / `circle(p, r, cls)` / `polygon(points, cls)` / `polyline(points, cls)` / `text(p, value, cls)`
- `angleArc(vertex, a, b, r, cls)`：在顶点处画两条射线之间的小角弧（泰勒斯实验用它标 ∠ACB 和底角）。
- `point(p, name, { key, kind })`：`kind` 可选 `'point'`、`'draggable'`、`'highlight'`、`'candidate'`、`'selected'`；传 `key` 后自动支持 `Tab` 聚焦与方向键移动。
- `dragPoints(board, (key, p) => { ... }, selector)`：统一处理鼠标/触屏拖拽与键盘微调。
- `slider(label, id, value, min, max, step, unit)`、`button(label, action, attrs)`、`metric(label, value)`。
- `board.animate(selector)`：为描线要素执行 `strokeDashoffset` 描绘，为填充面执行渐显，为高亮/候选点执行微弹跳弹出，且自动遵守 `prefers-reduced-motion: reduce`。

常用画板 CSS 类（`src/styles/lab.css`）：
- 画板上的 `--hue`（等于展馆的 `--bubble`）和 `--hue-ink`（加深一档）供实验图形取色，新实验优先用它们，而不是写死颜色。
- `structural`（深灰基础线）、`aux`（紫色虚线辅助圆/线）、`aux alt`（青色对比虚线）、`result`（高亮橙色结果线）、`shape`（紫色半透明区域）、`image-shape`（橙色变换像）。
- 页面外壳的颜色跟着展馆走：页面根元素设置 `--bubble`，读数、滑块、按钮按下态、`.status` 和卡片边框都用它（`app.css` 派生出 `--hall`、`--hall-soft`、`--hall-line`、`--hall-ink`，并改写 `--border-color`）。新实验不要写死橙色或深色背景；空间实验（`space-*` 类）也是浅色画板，台词里说「金线 / 金点」的地方对应 `space-accent` / `space-point` 的金色。

---

## 3. 角色头像、对话与语音

- `src/components/Avatar.tsx`：`<Avatar who="nian" | "dad" />`，与 `sci-playground` / `fourier-puzzle-game` 完全一致的小念/爸爸 SVG 头像。
- `src/components/Bubble.tsx`：`<Bubble who index speaking>` 对话气泡，小念在右、爸爸在左，正在说话时高亮。
- `src/lib/speech.ts`：`useSpeaking()` 返回正在朗读的那句，`useSound()` 返回声音开关，`isLine(line, who, text)` 判断是不是这一句。
- `src/speech.js`：`say(...lines)` / `stopSpeaking()` / `chime(true | false)`，优先播放 `public/voice/clips/*.mp3` 或 `public/voice/elements/*.mp3`，找不到时回退到浏览器中文语音。音频地址按 `import.meta.env.BASE_URL` 拼接，开发服和 GitHub Pages 都能用。
- `src/question-catalog.js`：`challengeHint` 与 `challengeCheer(lesson)` 是游乐场小挑战的两句固定台词；检查脚本、测试和配音脚本都从这里取，改文字后要重跑 `npm run voice`。

---

## 4. 页面与路由 (`src/lib/route.ts`)

| 地址 | 页面 |
| --- | --- |
| `#` | 首页 `HomePage` |
| `#hall/<id>` | 展馆 `HallPage`：问题按难度分组、这座馆的游乐场、几何故事 |
| `#q/<id>` | 问答 `QuestionPage`：左边对话、右边 `QuestionFilm` 动画 |
| `#play`、`#play/<id>` | 游乐场目录与独立游乐场 `PlayRoute` |
| `#progress`、`#compare`、`#stories` | 进度、曲率对照台、几何故事 |

旧地址 `#lab/<id>`、`#question/<id>`、`#reading`、`#halls`、`#hall/dynamic`、`#hall/<id>/<分区>` 由 `legacyRedirect` 换成新地址。链接请用 `href.play(id)`、`href.question(id)` 等助手生成。

---

## 5. `src/custom-labs.js` 注册格式

```js
export const customLabs = [
  {
    hall: 'curves',
    lesson: {
      id: 'cycloid',
      name: '滚轮画摆线',
      tag: '滚动轨迹',
      intro: '轮子边沿粘了一颗发光小石子，往前滚动时它会画出什么线？',
      idea: '圆沿着直线无滑动滚动时，圆周上一点走出的拱形轨迹叫摆线……',
      question: '轮子每转满一整圈，摆线在地面留下几个拱？',
      choices: ['1 个', '2 个', '3 个'],
      answer: 0,
    },
    // 实验代码单独拆包：写成返回实验函数的 loader，不要在文件顶部静态 import
    load: () => import('./labs/cycloid.js').then(m => m.cycloidLab),
  },
];
```
