export const questionTitles = {
  equilateral: '不量长度，怎么画出等边三角形？',
  'bisect-angle': '没有量角器，怎么把角平分？',
  midpoint: '没有刻度，怎么找到线段正中间？',
  'perpendicular-on': '怎么用圆规作出直角？',
  'perpendicular-off': '线外的一点，怎样垂直落到线上？',
  'copy-angle': '圆规怎么把一个角原样搬走？',
  'draw-parallel': '怎样作一条永远不相交的直线？',
  'triangle-sum': '三角形的三个角怎么拼成平角？',
  pythagoras: '同样四块拼图，怎么证明勾股定理？',
  sangaku: '一个小圆怎么同时碰到三条圆弧？',
  centers: '一个三角形为什么有不止一个中心？',
  'cube-section': '正方体怎么切出一个正六边形？',
  'shear-stack': '一摞正方形推斜，体积会变吗？',
  ellipse: '两颗钉子一根绳，怎么画出椭圆？',
  cycloid: '为什么滚轮上的一点能画出回环？',
  'conic-slices': '一个双圆锥，怎么切出四种曲线？',
  transform: '旋转、反射、缩放，什么会留下来？',
  billiards: '台球反弹一次，怎么瞄准目标？',
  'symmetry-ink': '为什么一笔就能画出一圈花纹？',
  'perspective-rail': '明明是平行的铁轨，怎么在远处相遇？',
  tiling: '为什么常见六边形地砖，很少见正五边形？',
  'dual-tiling': '六边形蜂窝里，等边三角形藏在哪？',
  sphere: '球面上能画出三个直角的三角形吗？',
  disk: '在双曲世界，平行线为什么不止一条？',
  'hyperbolic-triangle': '双曲三角形的内角和，为什么不到 180°？',
  mobius: '莫比乌斯带沿中线剪开，为什么没分成两条？',
  'euler-holes': '给纸挖一个洞，有什么数会变？',
  koch: '雪花的周长能无限长，面积却有限吗？',
  sierpinski: '一直挖三角形的中央，最后剩下多少面积？',
  'fractal-tree': '一条分叉规则，怎么长出一整棵树？',
  'chaos-game': '随机跳点，为什么会留下整齐的洞？',
  voronoi: '怎么给每个人划出最近的服务站？',
  'convex-hull': '橡皮筋包住一群点，哪些点能顶住它？',
  tesseract: '看不见第四个方向，怎么认出四维立方体？',
  'cube-growth': '再复制一次正方体，能多长出一维吗？',
};

/** 小念刚刚遇到的事：问题卡片和问答页开头的场景 */
export const questionTriggers = {
  equilateral: '手边只有一根线和一支铅笔，小念想画一个三条边一样长的三角形',
  'bisect-angle': '折纸飞机时，小念想把一个尖角正好分成两半',
  midpoint: '尺子上的刻度磨掉了，小念还想找到一根木条的正中间',
  'perpendicular-on': '搭积木墙时，小念想让竖着的木条和地面站成直角',
  'perpendicular-off': '小念站在跑道外面，想知道走到跑道上哪一点最近',
  'copy-angle': '小念想把风筝骨架上的一个角，原样画到另一张纸上',
  'draw-parallel': '小念画铁轨，两条线画着画着就歪到一起了',
  'triangle-sum': '小念把纸三角形的三个角撕下来，拼在了一起',
  pythagoras: '小念拿四块一样的三角形纸片，在正方形框里拼来拼去',
  sangaku: '爸爸给小念看了一块日本古庙里的算额木牌照片',
  centers: '小念想用一根铅笔尖顶住一块三角形纸板',
  'cube-section': '切豆腐块时，小念发现斜着下刀，切口不是正方形',
  'shear-stack': '小念把一摞便利贴往旁边一推，推成了斜斜的一叠',
  ellipse: '小念用两颗图钉和一圈毛线，在纸上画出了一个扁圆',
  cycloid: '夜里自行车轮上的反光片转起来，划出一道道弧线',
  'conic-slices': '手电筒照在墙上，光斑随着角度变成圆、椭圆，还拖出长尾巴',
  transform: '小念把一张三角形贴纸转一转、翻一翻，又放大复印了一张',
  billiards: '小念打台球，想让球先撞一下边，再打中目标',
  'symmetry-ink': '小念在万花筒里看到一圈一模一样的花纹',
  'perspective-rail': '站在铁轨上往远处看，两条铁轨好像在天边碰到了一起',
  tiling: '小念蹲在地上，看厨房里的六边形地砖',
  'dual-tiling': '小念盯着蜂巢的照片，想把每个格子的中心连起来',
  sphere: '小念在地球仪上用手指从北极滑到赤道',
  disk: '爸爸给小念看一幅圆形的画，越往边上，鱼就越小',
  'hyperbolic-triangle': '小念在一张越往边缘越挤的圆形地图上画三角形',
  mobius: '小念把纸条拧了半圈再粘起来，拿起剪刀准备沿中线剪',
  'euler-holes': '小念给一张画满三角形格子的纸挖了一个洞',
  koch: '下雪天，小念盯着窗户上的雪花，越看尖角越多',
  sierpinski: '小念把三角形一次次挖掉中间，像在做镂空剪纸',
  'fractal-tree': '小念发现大树的每根树枝，长得都像一棵小树',
  'chaos-game': '小念掷骰子决定往哪个角跳半步，点越积越多',
  voronoi: '小区里新开了几家便利店，小念想知道去哪家最近',
  'convex-hull': '小念在木板上钉了一圈钉子，拿橡皮筋往外一套',
  tesseract: '小念看到一张「四维立方体」的图，大立方体里套着小立方体',
  'cube-growth': '小念把一根小棒复制一份连起来，拼成了正方形',
};

const mathWorld = page => `https://mathworld.wolfram.com/${page}.html`;

/**
 * 首页轮播的几何明星，每座展馆一张。id 对应 src/showcase-figures.js 里的画面；play 是最接近的游乐场实验，
 * source 是 Wolfram MathWorld 上的词条。
 */
export const homeShowcase = [
  { id: 'mobius', hall: 'topology', play: ['mobius', '🧪 动手玩一玩'], name: '莫比乌斯带', en: 'MÖBIUS STRIP', source: ['Möbius Strip', mathWorld('MoebiusStrip')],
    hook: '纸条拧半圈再粘起来，就分不出正面和背面了。沿着边一直走，要绕两圈才回到起点。' },
  { id: 'penrose', hall: 'mosaics', play: ['tiling', '🧪 自己铺一铺'], name: '彭罗斯镶嵌', en: 'PENROSE TILING', source: ['Penrose Tiles', mathWorld('PenroseTiles')],
    hook: '只用胖、瘦两种菱形就能铺满整个平面，却永远找不到一块能照抄平移的重复花纹。越切越细，胖砖和瘦砖的数量比越来越接近黄金比 1.618。' },
  { id: 'tesseract', hall: 'dimensions', play: ['tesseract', '🧪 动手玩一玩'], name: '四维超立方体', en: 'TESSERACT', source: ['Tesseract', mathWorld('Tesseract')],
    hook: '看不见第四个方向，却能看它投进三维世界的影子：两个立方体套在一起，转着转着里外互换。' },
  { id: 'cardioid', hall: 'curves', play: ['cycloid', '🧪 滚一个圆试试'], name: '乘法表里的心形线', en: 'TIMES-TABLE CARDIOID', source: ['Cardioid', mathWorld('Cardioid')],
    hook: '圆上排好 120 个点，把第 k 个点连到第 2k 个点，一根根直线竟围出一颗心。换成乘 3 就是肾形线，阳光斜照进咖啡杯，杯底那道亮弯线正是它的一半。' },
  { id: 'hyperbolic', hall: 'non-euclid', play: ['disk', '🧪 在圆盘里画直线'], name: '双曲七边形镶嵌', en: 'HYPERBOLIC {7,3} TILING', source: ['Poincaré Hyperbolic Disk', mathWorld('PoincareHyperbolicDisk')],
    hook: '平面上三块正七边形拼不满一圈，在双曲世界里却刚刚好。圆盘里每一块其实一样大，只是越靠边看起来越小。埃舍尔的《圆极限》就画在这样的圆盘里。' },
  { id: 'koch', hall: 'fractal', play: ['koch', '🧪 动手玩一玩'], name: '科赫雪花', en: 'KOCH SNOWFLAKE', source: ['Koch Snowflake', mathWorld('KochSnowflake')],
    hook: '每一轮都给每条边长出一个小尖角。周长可以无限长，围住的面积却永远超不过一个上限。' },
  { id: 'platonic', hall: 'solids', play: ['euler-holes', '🧪 数一数顶点、棱和面'], name: '五种柏拉图立体', en: 'PLATONIC SOLIDS', source: ['Platonic Solid', mathWorld('PlatonicSolid')],
    hook: '每个面都是同样的正多边形、每个顶点都一个样的凸立体，全世界只有五种。欧几里得把这件事写在了《几何原本》的最后一条命题里。' },
  { id: 'phyllotaxis', hall: 'transforms', play: ['transform', '🧪 自己转一转'], name: '向日葵的黄金角', en: 'GOLDEN ANGLE', source: ['Phyllotaxis', mathWorld('Phyllotaxis')],
    hook: '每颗新种子都比上一颗多转 137.5°，再往外挪一点点。只靠这一条规则，就排出一左一右两组螺旋，条数还正好是相邻的两个斐波那契数。' },
  { id: 'voronoi', hall: 'computational', play: ['voronoi', '🧪 拖一拖站点'], name: '沃罗诺伊图', en: 'VORONOI DIAGRAM', source: ['Voronoi Diagram', mathWorld('VoronoiDiagram')],
    hook: '每个格子里的点，都离格子里那个站点最近。1854 年伦敦闹霍乱，斯诺医生按走路远近，圈出了离宽街水泵最近的街区，用的就是这个想法。' },
  { id: 'equilateral', hall: 'euclid', play: ['equilateral', '🧪 动手玩一玩'], name: '尺规等边三角形', en: 'COMPASS & STRAIGHTEDGE', source: ['Equilateral Triangle', mathWorld('EquilateralTriangle')],
    hook: '不用尺子量，只靠两个一样大的圆。拖一拖 B 点，三条边永远一样长。' },
];

/** 游乐场小挑战的两句配音台词；检查脚本、测试和配音脚本都从这里取 */
export const challengeHint = '先别急着选，再拖一拖画板，或者点「摆出画面」看看！';
export const challengeCheer = lesson => `太棒啦！我搞懂「${lesson.name}」的秘密啦！`;

/** 问题列表里从简单到复杂的排序 */
export const difficultyLabel = { 1: '入门', 2: '进阶', 3: '挑战' };
export const difficultyHint = { 1: '一看就懂的小问题', 2: '要多想一步：谁和谁在接力？', 3: '藏得更深的问题，大人也常常答不全' };
const difficulty = {
  equilateral: 1, 'bisect-angle': 1, midpoint: 2, 'perpendicular-on': 2, 'perpendicular-off': 2,
  'copy-angle': 2, 'draw-parallel': 3, 'triangle-sum': 2, pythagoras: 3, sangaku: 3, centers: 2,
  'cube-section': 2, 'shear-stack': 1, ellipse: 1, cycloid: 2, 'conic-slices': 3,
  transform: 1, billiards: 2, 'symmetry-ink': 1, 'perspective-rail': 2, tiling: 1, 'dual-tiling': 2,
  sphere: 2, disk: 3, 'hyperbolic-triangle': 3, mobius: 1, 'euler-holes': 2,
  koch: 2, sierpinski: 1, 'fractal-tree': 1, 'chaos-game': 3, voronoi: 2, 'convex-hull': 1,
  tesseract: 3, 'cube-growth': 2,
};
export const questionDifficulty = lesson => difficulty[lesson.id] ?? 2;
export const questionTrigger = lesson => questionTriggers[lesson.id] ?? lesson.intro;

/** 小念眼里每座展馆在问什么：首页卡片上的一句话 */
export const hallHooks = {
  euclid: '不量长度能画等边三角形吗？没有量角器怎么平分角？勾股定理怎么拼出来？',
  solids: '正方体能切出六边形吗？一摞纸推斜了，体积会变吗？',
  curves: '两颗钉子怎么画椭圆？车轮上的点走出什么线？光斑为什么会变形？',
  transforms: '照镜子会变大吗？台球怎么借边反弹？铁轨为什么在远处相遇？',
  mosaics: '为什么地砖常见六边形？蜂窝里藏着什么三角形？',
  'non-euclid': '三角形能有三个直角吗？平行线能不止一条吗？',
  topology: '莫比乌斯带剪开会变成两条吗？挖一个洞，什么数会变？',
  fractal: '雪花的周长能无限长吗？乱跳的点怎么排出整齐的洞？',
  computational: '去哪家店最近？橡皮筋套住一圈钉子，哪些钉子顶着它？',
  dimensions: '四维立方体长什么样？多复制一次，能长出一维吗？',
};

const featured = {
  euclid: ['equilateral', 'pythagoras'],
  curves: ['conic-slices', 'cycloid'],
  transforms: ['perspective-rail', 'symmetry-ink'],
  fractal: ['koch', 'chaos-game'],
};

export const questionTitle = lesson => questionTitles[lesson.id] ?? lesson.name;
export const featuredQuestions = hall => featured[hall.id]
  ? featured[hall.id].map(id => hall.lessons.find(l => l.id === id))
  : hall.lessons.slice(0, 2);
