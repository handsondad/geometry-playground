const clark = 'https://mathcs.clarku.edu/~djoyce/elements/bookI/';
export const readingSources = [
  ['C82 · 柏恩版《几何原本》', 'https://www.c82.net/work/euclid'],
  ['Manim Euclid Elements · 分步演示', 'https://github.com/osolmaz/manim-euclid-elements'],
  ['geomlib · Joyce 动态几何', 'https://github.com/brownnrl/euclid'],
];

export const volumeOne = [
  { n: 1, id: 'equilateral', uses: [] },
  { n: 9, id: 'bisect-angle', uses: [1, 8] },
  { n: 10, id: 'midpoint', uses: [1, 9, 4] },
  { n: 11, id: 'perpendicular-on', uses: [3, 1, 8] },
  { n: 12, id: 'perpendicular-off', uses: [10, 8] },
  { n: 23, id: 'copy-angle', uses: [22, 8] },
  { n: 31, id: 'draw-parallel', uses: [23, 27] },
  { n: 32, id: 'triangle-sum', uses: [31, 29, 13] },
  { n: 47, id: 'pythagoras', uses: [46, 31, 4, 41] },
];

export const originalProposition = n => `${clark}propI${n}.html`;
export const readingSections = [
  { name: '01 / 作图的基本动作', intro: '用圆规转移长度，从等边三角形走到角、线段和垂线。', numbers: [1, 9, 10, 11, 12] },
  { name: '02 / 从等角走到平行', intro: '复制一个角，通过平行线比较不同位置的角。', numbers: [23, 31, 32] },
  { name: '03 / 用面积完成证明', intro: '把面积关系拆成看得见的全等和等积。', numbers: [47] },
];

export const addedPropositions = [
  { id: 'perpendicular-on', name: '过线上一点作垂线', tag: '卷 I · 命题 11', intro: '点 C 已在直线 AB 上。只用直尺和圆规，在 C 处作出两个相邻的直角。', idea: '在 C 两侧取 CD = CE，再作等边三角形 DEF。△DCF 与 △ECF 按三边全等，所以相邻两角相等。它们合成一个平角，各是直角。', question: '作出等边三角形 DEF 后，哪个条件使两个相邻角相等？', choices: ['两侧三角形的三条对应边分别相等', '圆规开口是 90°', '直线 AB 的端点恰好在画板两边'], answer: 0 },
  { id: 'perpendicular-off', name: '过线外一点作垂线', tag: '卷 I · 命题 12', intro: '点 C 在线外。先用一个圆截出弦，再想想怎样不用量角器找到垂足。', idea: '以 C 为圆心的圆在直线上截出 E、G。命题 10 给出弦中点 H。因为 CE = CG、HE = HG，而且 CH 是公共边，两个相邻角相等，所以 CH 垂直于直线。', question: '点 D 为什么选在直线的另一侧？', choices: ['让 C 和 D 一定是垂足', '保证以 C 为圆心、过 D 的圆与直线有两个交点', '保证弦长恰好等于半径'], answer: 1 },
  { id: 'copy-angle', name: '用尺规复制一个角', tag: '卷 I · 命题 23', intro: '把左边的角复制到右侧给定射线。不量角度，只搬运三条边的长度。', idea: '命题 23 先从原角两边各取一点，再按三条边构造全等三角形。这里在两边截取等长线段来简化操作，仍然只依靠边长决定夹角。', question: '圆规除了搬运两条等长的角边，还必须搬运什么？', choices: ['原来的方位', '顶点到画板的距离', '原角两边截点之间的弦长'], answer: 2 },
  { id: 'draw-parallel', name: '过线外一点作平行线', tag: '卷 I · 命题 31', intro: '沿截线把已知角复制到线外的 A，看看新直线为什么会与原直线平行。', idea: '命题 23 允许复制角。把原角复制到截线另一侧，得到一对相等的内错角；由命题 27，两条直线平行。这里并没有先假设平行再得到等角。', question: '由哪个条件断定两条直线平行？', choices: ['一对内错角相等', '两条直线长度相等', '截线经过直线的中点'], answer: 0 },
  { id: 'triangle-sum', name: '把三角形的三角拼成平角', tag: '卷 I · 命题 32', intro: '拖动三角形顶点，再点读证明：怎样借一条平行线把三个角都搬到 C？', idea: '延长 BC，在 C 处作 CE ∥ AB。借平行线的角关系，把 A、B 两角在 C 旁找出来；它们与 C 的内角合为平角。这是欧氏平面的结论，不能直接搬到球面或双曲平面。', question: '在 C 点，三个内角最后合成了什么？', choices: ['直角', '平角', '周角'], answer: 1 },
];
