import { chaosGameLab } from './labs/chaos-game.js';
import { conicSlicesLab } from './labs/conic-slices.js';
import { perspectiveRailLab } from './labs/perspective-rail.js';
import { cubeGrowthLab } from './labs/cube-growth.js';
import { convexHullLab } from './labs/convex-hull.js';
import { eulerHolesLab } from './labs/euler-holes.js';
import { dualTilingLab } from './labs/dual-tiling.js';
import { cycloidLab } from './labs/cycloid.js';
import { shearStackLab } from './labs/shear-stack.js';
// Extension registry for labs scaffolded via `npm run lab:new -- ... --write`.
// Each entry: { hall: '<hallId>', lesson: { id, name, tag, intro, idea, question, choices, answer }, mode }
export const customLabs = [
  {
    hall: 'solids',
    lesson: {
      id: 'shear-stack',
      name: '推斜一摞正方形',
      tag: '卡瓦列里原理',
      intro: '推斜一座方柱，再逐层移动切面。形状倾斜了，体积也会变吗？',
      idea: '剪切只让每个高度的正方形横向平移，边长和层高都没变。同高处截面的面积一一相等，所以按卡瓦列里原理，两座方柱体积相等。',
      question: '保持底面和垂直高度不变，只把方柱往旁边推斜，体积会怎样？',
      choices: ['变大', '不变', '变小'],
      answer: 1,
    },
    mode: shearStackLab,
  },
  {
    hall: 'curves',
    lesson: {
      id: 'cycloid',
      name: '滚轮上的一点画什么线？',
      tag: '滚动与摆线',
      intro: '转动不打滑的轮子，把描线点从轮心推到轮缘或轮外，比较三种轨迹。',
      idea: '圆无滑动滚过的距离等于滚过的弧长。描线点还在绕轮心旋转，所以轨迹叠加了直线平移和圆周运动；轮缘的点留下有尖点的摆线。',
      question: '描线点恰好在轮心时，随着轮子滚动，它的轨迹是什么？',
      choices: ['有尖点的曲线', '水平直线', '一个圆'],
      answer: 1,
    },
    mode: cycloidLab,
  },
  {
    hall: 'mosaics',
    lesson: {
      id: 'dual-tiling',
      name: '蜂窝里藏着三角网',
      tag: '正六边形与对偶',
      intro: '把共享一条边的蜂窝中心连起来；扩展蜂窝，观察三角网怎样生长。',
      idea: '蜂窝中相邻六边形的中心距离相等。每个公共顶点周围的三个中心互相邻接，围成一个等边三角形，这就是六边形铺砌的对偶网格。',
      question: '在没有边界的蜂窝铺砌里，一个六边形中心连到多少个邻居？',
      choices: ['3 个', '4 个', '6 个'],
      answer: 2,
    },
    mode: dualTilingLab,
  },
  {
    hall: 'topology',
    lesson: {
      id: 'euler-holes',
      name: '挖一个洞，什么变了？',
      tag: '欧拉示性数',
      intro: '调细三角网格，再挖掉中央一块，对比顶点数减边数加三角形数。',
      idea: '这个差值叫欧拉示性数。完整方片是一个圆盘型区域，差值为一；挖去内部一个洞后，环形区域的差值为零。同一形状只重新细分网格，不会改变这个差值。',
      question: '保持中间的洞，只把环形区域的网格划得更细，欧拉示性数是多少？',
      choices: ['还是 0', '变成 1', '随三角形数增大'],
      answer: 0,
    },
    mode: eulerHolesLab,
  },
  {
    hall: 'computational',
    lesson: {
      id: 'convex-hull',
      name: '用橡皮筋包住一群点',
      tag: '凸包与转向',
      intro: '把一个内点拖到外围或往回拉，观察算法什么时候会把它当作凸包顶点。',
      idea: '点集的凸包像包住所有点的绷紧橡皮筋。算法先排序，再构造两条链；如果三点没有保持同一转向，就从当前链中撤掉中间点。',
      question: '一个点始终在原来凸包的内部移动，其他点不动。凸包会怎样？',
      choices: ['面积减少', '边界不变', '一定多一个顶点'],
      answer: 1,
    },
    mode: convexHullLab,
  },
  {
    hall: 'dimensions',
    lesson: {
      id: 'cube-growth',
      name: '把正方体再复制一次',
      tag: '超立方体逐维生长',
      intro: '从一个点开始，每多一维就复制上一维的图形，并连接对应顶点。把两份的投影拉开看得更清楚。',
      idea: '每次升一维，新坐标有两个取值，所以会出现两份上一维的顶点和棱。再让每对只差新坐标的顶点各连一条新棱，就得到了新的超立方体。',
      question: '从四维升到五维，光是连接两份四维图形，就要新增多少条棱？',
      choices: ['8 条', '16 条', '32 条'],
      answer: 1,
    },
    mode: cubeGrowthLab,
  },
  {
    hall: 'transforms',
    lesson: {
      id: 'perspective-rail',
      name: '平行铁轨为什么会相遇？',
      tag: '一点透视与消失点',
      intro: '移动金色枕木，同时看俯视图和相机画面。用同一把尺子量远近，看看哪里变了。',
      idea: '小孔成像里，图像坐标是焦距乘以横向或竖向偏移，再除以深度。两条铁轨没变窄，只是它们在画面上的间距随深度增加而变小；向远方延伸时，投影趋向同一个消失点。',
      question: '同样长的枕木，距相机的深度由 6 米变成 12 米。焦距不变，画面上的长度变成多少？',
      choices: ['一样长', '一半长', '四分之一长'],
      answer: 1,
      sources: [['MIT CSAIL · 小孔成像与线性透视', 'https://people.csail.mit.edu/fredo/comp-photo-book/02-fundamentals-02-pinhole-image-formation-and-linear-perspective.html']],
    },
    mode: perspectiveRailLab,
  },
  {
    hall: 'curves',
    lesson: {
      id: 'conic-slices',
      name: '一刀切出四种曲线',
      tag: '双圆锥与圆锥曲线',
      intro: '倾斜不穿过锥顶的切平面，再转动双圆锥，从正面查看真实截出的曲线。',
      idea: '这个双圆锥的母线与水平面成四十五度。水平切得到圆，较缓的斜切得到椭圆，平行于母线时得到抛物线，更陡时会切到两半圆锥，得到双曲线。开口的曲线在图外还会继续延伸。',
      question: '在这座双圆锥里，把切平面从略低于 45° 调到略高于 45°，截线依次是什么？',
      choices: ['椭圆 → 抛物线 → 双曲线', '双曲线 → 圆 → 椭圆', '椭圆 → 圆 → 抛物线'],
      answer: 0,
      sources: [['OpenStax · Calculus Volume 2：圆锥曲线', 'https://openstax.org/books/calculus-volume-2/pages/7-5-conic-sections']],
    },
    mode: conicSlicesLab,
  },
  {
    hall: 'fractal',
    lesson: {
      id: 'chaos-game',
      name: '随机跳点，跳出一座分形',
      tag: '混沌游戏与迭代映射',
      intro: '随机选一个角，每次朝它走固定比例。先逐步看走法，再批量落点，比较三角形和正方形。',
      idea: '选哪个角是随机的，走法不是。走一半，相当于把整片区域缩小一半再贴向选中的角。三角形的三个副本留出中央的空洞，正方形的四个副本却刚好拼满原来的区域。',
      question: '规则都是朝随机的顶点走一半。把三角形换成正方形，第一层中央空洞会怎样？',
      choices: ['照样留下三角形的洞', '洞会变大', '不再留洞，四个小正方形拼满大正方形'],
      answer: 2,
      sources: [['Wolfram MathWorld · Chaos Game', 'https://mathworld.wolfram.com/ChaosGame.html']],
    },
    mode: chaosGameLab,
  },
];
