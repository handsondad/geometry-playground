# `geometry-playground` 共享画板与组件速查表 (`kit-reference.md`)

所有实验、展馆与问答页面都复用共享工具模块，禁止在单个实验内重复造轮子。

---

## 1. 实验函数签名与 `demo` 回调 (`src/app.js` / `src/labs/*.js`)

```js
export function myLab({ board, controls, stats, guide, lesson, signal, notify }) {
  // 1. 初始化控件到 controls.innerHTML
  // 2. 绑定事件时务必传入 { signal }，切换路由时自动清理监听
  // 3. 调用 board.draw(...) 绘制 SVG，stats.innerHTML 写入 metric(...)
  // 4. 返回给小念问爸爸三轮动画调用的场景回调：
  return (kind, ...args) => {
    // 根据场景参数切换状态、重绘，并触发 SVG 动画：
    board.animate('.result, .aux, .shape');
  };
}
```

---

## 2. SVG 画板原语 (`src/board.js`)

画板坐标系固定为 `W = 640, H = 400`：

- `line(a, b, cls)` / `infinite(a, b, cls)` / `circle(p, r, cls)` / `polygon(points, cls)` / `polyline(points, cls)` / `text(p, value, cls)`
- `point(p, name, { key, kind })`：`kind` 可选 `'point'`、`'draggable'`、`'highlight'`、`'candidate'`、`'selected'`；传 `key` 后自动支持 `Tab` 聚焦与方向键移动。
- `dragPoints(board, (key, p) => { ... }, selector)`：统一处理鼠标/触屏拖拽与键盘微调。
- `slider(label, id, value, min, max, step, unit)`、`button(label, action, attrs)`、`metric(label, value)`。
- `board.animate(selector)`：为描线要素执行 `strokeDashoffset` 描绘，为填充面执行渐显，为高亮/候选点执行微弹跳弹出，且自动遵守 `prefers-reduced-motion: reduce`。

常用画板 CSS 类：
- `structural`（深灰基础线）、`aux`（紫色虚线辅助圆/线）、`aux alt`（青色对比虚线）、`result`（高亮橙色结果线）、`shape`（紫色半透明区域）、`image-shape`（橙色变换像）。

---

## 3. 角色头像、对话与语音 (`src/components.js` / `src/speech.js`)

- `portrait('nian' | 'dad')`：与 `sci-playground` / `fourier-puzzle-game` 完全一致的小念/爸爸 SVG 头像。
- `saysHtml(who, text)` / `chatHtml(lines, { playLabel })`：带角色头像与 `🔊` 单句按钮的气泡。
- `say(...lines)` / `stopSpeaking()` / `chime(true | false)`：优先播放 `public/voice/clips/*.mp3` 或 `public/voice/elements/*.mp3`，找不到时优雅回退到浏览器中文语音。

---

## 4. `src/custom-labs.js` 注册格式

```js
import { cycloidLab } from './labs/cycloid.js';

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
    mode: cycloidLab,
  },
];
```
