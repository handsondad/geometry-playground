---
name: geometry-playground-builder
description: 为「几何游乐场大冒险」(geometry-playground) 设计、实现与验收新的互动几何实验、大师百宝箱故事与「小念问爸爸」图文动画问答。凡在本仓库扩充实验、命题或科普内容时调用。
---

# 几何游乐场大冒险 · 内容与实验扩充指南 (`geometry-playground-builder`)

动手写代码前请先通读本指南；需要查阅画板原语、组件签名与音频接口时，请阅读同目录下的 `kit-reference.md`。

---

## 1. 选题与交互标准

每个新实验必须满足以下三点：

1. **真实几何 + 可动手操作**：使用 `src/board.js` 与 `src/math.js` 实时计算，支持拖动控制点、切换按钮或滑动条，拒绝静态图片或纯选择题。
2. **清晰的几何直觉或反直觉时刻**：例如「双曲三角形内角和小于 180°」「莫比乌斯带剪一刀仍是一整条」「等比放大 2 倍面积变 4 倍」「正方体能切出正六边形」。
3. **三轮「小念问爸爸」递进引导**：
   - 第 1 轮（先问个为什么）：从画板上的一个具体形状或异常现象发问，驱动第 1 个演示场景。
   - 第 2 轮（再追问一步）：爸爸点出核心几何机制（如垂直平分线、焦距之和、内错角），驱动第 2 个场景。
   - 第 3 轮（自己动手验证）：出现「哇时刻」并引导孩子拖点或调节参数亲自检验不变量，驱动第 3 个场景。

---

## 2. 五步标准扩充流程

### 第 1 步：运行脚手架生成骨架

先运行 `npm run lab:new` 查看 10 座展馆及现有实验，随后生成新实验：

```bash
npm run lab:new -- <hall> <id> "<中文标题>" --write
```

脚手架会自动创建 `src/labs/<id>.js`，并在 `src/custom-labs.js` 与 `src/lab-talks.js` 中预置注册项和 3 轮对话模板。

### 第 2 步：实现纯几何计算与交互画板

- 纯几何公式放入 `src/math.js`（或独立纯函数导出），并在 `tests/` 下补充断言。
- 在 `src/labs/<id>.js` 实现实验逻辑：
  - 使用 `makeBoard`、`dragPoints`、`slider`、`button`、`metric` 等共享原语；
  - 必须返回一个 `demo(kind, ...args)` 回调，供顶部 `StageStrip` 三轮问答切换时更新画板状态并调用 `board.animate(...)`。

### 第 3 步：完善小念与爸爸的对话、小挑战和百宝箱

1. **`src/custom-labs.js`**：补全 `tag`、`intro`、`idea`、`question`、`choices`、`answer`。
2. **`src/lab-talks.js`**：编写 3 轮贴合儿童口吻的 `nian` / `dad` 对话与 3 个不同的 `scene` 参数。
3. **`src/geometry-story-data.js`（可选扩充）**：若新实验背后有著名数学家故事与安全的家庭纸笔/日常小实验，可向 `geometryWiki` 追加一张卡片（`homeLab` 以 `🏠 ` 开头，`relatedLabId` 指向 `<id>`），或在 `geometryTalks` 追加一条问答。

### 第 4 步：合成标准离线双人语音

确保 Python 环境中安装了 `edge-tts` 后执行：

```bash
npm run voice
```

会自动采集新增台词并使用 `zh-CN-YunxiaNeural (+0%)`（小念）与 `zh-CN-YunxiNeural (-5%)`（爸爸）增量合成 MP3 到 `public/voice/clips/` 并更新 `src/voice-manifest.js`。

### 第 5 步：四步验收门禁

```bash
npm run check
npm test
npm run smoke -- <id>
npm run build
```

确保规则守卫全绿、单元测试通过、无头浏览器中 3 轮动画均正常触发且无 `NaN`、无 JS 异常与移动端横向溢出。
