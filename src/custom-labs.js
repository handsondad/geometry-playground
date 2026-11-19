import { chaosGameLab } from './labs/chaos-game.js';
import { conicSlicesLab } from './labs/conic-slices.js';
import { perspectiveRailLab } from './labs/perspective-rail.js';
import { cubeGrowthLab } from './labs/cube-growth.js';
import { convexHullLab } from './labs/convex-hull.js';
import { eulerHolesLab } from './labs/euler-holes.js';
import { dualTilingLab } from './labs/dual-tiling.js';
import { cycloidLab } from './labs/cycloid.js';
import { shearStackLab } from './labs/shear-stack.js';
import { thalesLab } from './labs/thales.js';
import { timesTableLab } from './labs/times-table.js';
import { phyllotaxisLab } from './labs/phyllotaxis.js';
import { penroseLab } from './labs/penrose.js';
import { pickLab } from './labs/pick.js';
import { hyperbolicTilingLab } from './labs/hyperbolic-tiling.js';
import { sevenBridgesLab } from './labs/seven-bridges.js';
import { jordanLab } from './labs/jordan.js';
import { delaunayLab } from './labs/delaunay.js';
import { artGalleryLab } from './labs/art-gallery.js';
import { platonicLab } from './labs/platonic.js';
import { cubeNetsLab } from './labs/cube-nets.js';
import { flatlandLab } from './labs/flatland.js';
import { cubeDiagonalLab } from './labs/cube-diagonal.js';
import { dragonCurveLab } from './labs/dragon-curve.js';

const mathWorld = (title, page) => [`Wolfram MathWorld · ${title}`, `https://mathworld.wolfram.com/${page}.html`];
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
  {
    hall: 'euclid',
    lesson: {
      id: 'thales',
      name: '半圆里的直角',
      tag: '泰勒斯定理',
      intro: '拖动 C 沿圆走一圈，量 ∠ACB；再把 C 拉进圆里、推到圆外比一比。',
      idea: '连上半径 OC，大三角形被拆成两个等腰三角形，两个底角分别相等。三角形三个角加起来是 180°，C 处的两个角正好占一半，所以 ∠ACB 是 90°。C 进到圆里角变大，出到圆外角变小。',
      question: '把 C 拉到圆的里面（不在直径上），∠ACB 会怎样？',
      choices: ['比 90° 大', '还是 90°', '比 90° 小'],
      answer: 0,
      sources: [mathWorld('Thales\' Theorem', 'ThalesTheorem')],
    },
    mode: thalesLab,
  },
  {
    hall: 'curves',
    lesson: {
      id: 'times-table',
      name: '乘法表连出一颗心',
      tag: '弦的包络与心形线',
      intro: '把圆上第 k 个点连到第 m × k 个点。拉动乘数和点数，看直线怎样围出弯弯的曲线。',
      idea: '每根弦都是直的，但相邻的弦只差一点点，它们一起贴着的那条曲线叫包络。乘数是 2 时包络是心形线，乘数是 3 时是肾形线；乘数为 m 时，曲线有 m − 1 个尖角。',
      question: '把乘数调到 6，弦围出的曲线有几个尖角？',
      choices: ['6 个', '5 个', '3 个'],
      answer: 1,
      sources: [mathWorld('Cardioid', 'Cardioid')],
    },
    mode: timesTableLab,
  },
  {
    hall: 'transforms',
    lesson: {
      id: 'phyllotaxis',
      name: '向日葵为什么转 137.5°',
      tag: '黄金角与叶序',
      intro: '每颗新种子比上一颗多转同一个角度，再往外挪一点。拉动角度，看种子铺满还是排成直线。',
      idea: '如果转角是整圈的简单分数，比如四分之一圈，种子过几颗就回到同一个方向，排成几条直线，中间留下空隙。黄金角很难用简单分数逼近，每颗种子都落进当时最空的缝里，于是铺得又密又匀，还排出相邻斐波那契数条螺旋。',
      question: '每颗种子多转 120°，种子会排成什么样？',
      choices: ['3 条直线', '铺满整个圆盘', '1 条螺旋'],
      answer: 0,
      sources: [mathWorld('Phyllotaxis', 'Phyllotaxis')],
    },
    mode: phyllotaxisLab,
  },
  {
    hall: 'mosaics',
    lesson: {
      id: 'penrose',
      name: '永不重复的地砖',
      tag: '彭罗斯镶嵌与黄金比',
      intro: '把胖、瘦两种三角形按同一个规则一次次切小，数一数两种砖各有几块。',
      idea: '每块胖三角形切成两胖一瘦，每块瘦三角形切成一胖一瘦，切完再放大到原来的尺寸。数量按这个规则接力增长，胖砖与瘦砖之比越来越接近黄金比 1.618。这个比不是分数，所以花纹永远不会周期性重复。',
      question: '一直细分下去，胖砖数 ÷ 瘦砖数越来越接近哪个数？',
      choices: ['2', '1.618', '1.5'],
      answer: 1,
      sources: [mathWorld('Penrose Tiles', 'PenroseTiles')],
    },
    mode: penroseLab,
  },
  {
    hall: 'mosaics',
    lesson: {
      id: 'pick',
      name: '数格点就能算面积',
      tag: '皮克定理',
      intro: '把多边形的顶点钉在格点上。数一数里面和边上的格点，再和面积比一比。',
      idea: '顶点都在格点上的多边形，面积等于里面的格点数，加上边上格点数的一半，再减一。把图形切成小三角形，每加一块，两边同时增加同样的量，所以公式总是成立。',
      question: '一个格点多边形里面有 4 个格点，边上有 6 个格点，面积是多少？',
      choices: ['6', '7', '10'],
      answer: 0,
      sources: [mathWorld('Pick\'s Theorem', 'PicksTheorem')],
    },
    mode: pickLab,
  },
  {
    hall: 'non-euclid',
    lesson: {
      id: 'hyperbolic-tiling',
      name: '七边形也能铺满',
      tag: '双曲镶嵌 {p,q}',
      intro: '选每块砖的边数 p 和每个顶点围的块数 q，再把中间那块拖向边缘。',
      idea: 'q 块正 p 边形围住一个顶点，每个角都得是 360° 的 q 分之一。平面上正 p 边形的角是固定的；合不上时，双曲世界的多边形越大角越小，总能找到合适的大小。拖到边缘的砖看起来变小了，真实大小却和中间那块一样。',
      question: '每块砖是正方形，每个顶点围 4 块，这是哪种铺法？',
      choices: ['平面铺法', '球面铺法', '双曲铺法'],
      answer: 0,
      sources: [mathWorld('Hyperbolic Tiling', 'HyperbolicTiling')],
    },
    mode: hyperbolicTilingLab,
  },
  {
    hall: 'topology',
    lesson: {
      id: 'seven-bridges',
      name: '七座桥能一次走完吗？',
      tag: '欧拉路径与奇点',
      intro: '选一块陆地出发，一座座点桥。每座桥只走一次，看能不能走完；再修一座桥试试。',
      idea: '中途经过一块陆地，总是一座桥进、一座桥出，用掉成对的桥。只有起点和终点可以连着奇数座桥。哥尼斯堡四块陆地都连着奇数座桥，所以走不完；再修一座桥，只剩两块是奇数，从其中一块出发就能走完。',
      question: '一张桥的地图要能一笔走完，连着奇数座桥的陆地最多能有几块？',
      choices: ['1 块', '2 块', '4 块'],
      answer: 1,
      sources: [mathWorld('Königsberg Bridge Problem', 'KoenigsbergBridgeProblem')],
    },
    mode: sevenBridgesLab,
  },
  {
    hall: 'topology',
    lesson: {
      id: 'jordan',
      name: '在迷宫里面还是外面？',
      tag: '约当曲线定理',
      intro: '拖动小人 P，从它射出一条射线，数穿过曲线几次；转动射线，看次数的单双变不变。',
      idea: '一条不自交的闭合曲线把平面分成里面和外面两块。射线每穿过一次曲线，就在里外之间换一次；射线最后一定跑到外面，所以穿过奇数次说明起点在里面，偶数次说明在外面。换个方向，次数会变，单双不变。',
      question: '从 P 出发的射线穿过闭合曲线 7 次，P 在哪里？',
      choices: ['在里面', '在外面', '要换个方向才知道'],
      answer: 0,
      sources: [mathWorld('Jordan Curve Theorem', 'JordanCurveTheorem')],
    },
    mode: jordanLab,
  },
  {
    hall: 'computational',
    lesson: {
      id: 'delaunay',
      name: '把站点连成好看的三角网',
      tag: '德劳内三角剖分',
      intro: '拖动站点，看三角网怎样跟着翻边；打开外接圆，再和沃罗诺伊图叠在一起对照。',
      idea: '德劳内三角网里，每个三角形的外接圆里都没有别的站点。这样连出来的三角形尽量不细长，最小的角尽量大。它和沃罗诺伊图互为对偶：外接圆的圆心正好是三个格子相遇的地方。',
      question: '德劳内三角网里，任意一个三角形的外接圆里面有几个其他站点？',
      choices: ['一个也没有', '正好一个', '至少一个'],
      answer: 0,
      sources: [mathWorld('Delaunay Triangulation', 'DelaunayTriangulation')],
    },
    mode: delaunayLab,
  },
  {
    hall: 'computational',
    lesson: {
      id: 'art-gallery',
      name: '几个保安看得住美术馆？',
      tag: '美术馆定理',
      intro: '在梳子形的展厅里拖动保安，彩色区域是他们看得到的地方，试着让红点全部消失。',
      idea: '保安站着不动，能看到从他出发、不碰墙就能连到的每一点。有 n 个拐角的展厅，总能切成三角形，再给三角形顶点涂三种颜色；人数最少的那种颜色处各站一位，就能看住全馆。所以 n 个拐角最多需要 n ÷ 3 向下取整位保安。',
      question: '一间有 12 个拐角的展厅，无论形状多曲折，最多需要几位保安就一定看得住？',
      choices: ['3 位', '4 位', '6 位'],
      answer: 1,
      sources: [mathWorld('Art Gallery Theorem', 'ArtGalleryTheorem')],
    },
    mode: artGalleryLab,
  },
  {
    hall: 'solids',
    lesson: {
      id: 'platonic',
      name: '为什么只有五种柏拉图立体',
      tag: '顶点角缺与正多面体',
      intro: '选一种正多边形，把几块围在同一个顶点上，看缺口能不能折起来、折成哪种立体。',
      idea: '一个顶点至少要围三块面，角度和还得小于 360°，留出缺口才能折起来。正三角形可以围三块、四块、五块，正方形和正五边形只能围三块，正六边形围三块就刚好铺平。所以只有五种。而且所有缺口加起来正好是 720°。',
      question: '三块正六边形围在一个顶点上，会怎样？',
      choices: ['折成一个立体', '刚好铺平，折不起来', '挤不下，会重叠'],
      answer: 1,
      sources: [mathWorld('Platonic Solid', 'PlatonicSolid')],
    },
    mode: platonicLab,
  },
  {
    hall: 'solids',
    lesson: {
      id: 'cube-nets',
      name: '哪张展开图能折成盒子',
      tag: '正方体展开图',
      intro: '选一张六个正方形连成的图，把每条折痕往上折，看折到 90° 时能不能合成正方体。',
      idea: '折到 90° 时，每块正方形都要占住正方体的一个面。六块各占一面就合成了；如果有两块挤到同一个面上，就必有一个面空着。六个正方形连成的图一共有 35 种，只有 11 种能折成正方体。',
      question: '一张展开图里有四个正方形拼成一个 2×2 的大方块，它能折成正方体吗？',
      choices: ['能', '不能', '看怎么折'],
      answer: 1,
      sources: [mathWorld('Hexomino', 'Hexomino')],
    },
    mode: cubeNetsLab,
  },
  {
    hall: 'dimensions',
    lesson: {
      id: 'flatland',
      name: '平面国的人怎么看球？',
      tag: '降维截面',
      intro: '让球或正方体慢慢穿过一张平面，右边只画平面里的人能看到的切口。',
      idea: '平面国的居民只能看到物体和平面相交的那一圈。球穿过时，他们看到一个点长成圆，变到最大再缩回一点。正方体换个姿势穿过，切口可以是正方形，也可以是三角形和六边形。我们看四维物体穿过三维空间，也只能这样一片一片地看。',
      question: '一个球从上到下穿过平面国，平面国居民看到的圆会怎样变化？',
      choices: ['一直一样大', '先变大，再变小', '一直变大'],
      answer: 1,
      sources: [mathWorld('Cross Section', 'CrossSection')],
    },
    mode: flatlandLab,
  },
  {
    hall: 'dimensions',
    lesson: {
      id: 'cube-diagonal',
      name: '高维立方体的对角线有多长',
      tag: '勾股定理一维一维接力',
      intro: '把维数从 1 调到 8，看棱长为 1 的立方体最长的对角线，以及右边一级级接起来的直角三角形。',
      idea: '多一维，就多一条和前面都垂直的、长度为 1 的棱。前面的对角线和这条新棱组成直角三角形，所以对角线的平方每次加一。n 维立方体最长的对角线是根号 n。',
      question: '棱长为 1 的四维立方体，最长的对角线有多长？',
      choices: ['4', '2', '√3'],
      answer: 1,
      sources: [mathWorld('Hypercube', 'Hypercube'), mathWorld('Theodorus Spiral', 'TheodorusSpiral')],
    },
    mode: cubeDiagonalLab,
  },
  {
    hall: 'fractal',
    lesson: {
      id: 'dragon-curve',
      name: '纸条对折，折出一条龙',
      tag: '龙形曲线',
      intro: '把纸条对折几次再张开，让每道折痕都成直角。调小最后一折的张开角，看曲线怎样转出来。',
      idea: '每对折一次，纸条的段数翻倍。展开时，后一半是前一半绕着终点转了 90° 的样子。重复下去得到龙形曲线：小段越来越多，却从不在同一段上重叠。',
      question: '纸条对折 5 次再张开，一共有多少小段？',
      choices: ['10 段', '25 段', '32 段'],
      answer: 2,
      sources: [mathWorld('Dragon Curve', 'DragonCurve')],
    },
    mode: dragonCurveLab,
  },
];
