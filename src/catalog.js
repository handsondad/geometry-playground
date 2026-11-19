import { collection } from './topics.js';
import { addedPropositions } from './elements-data.js';
import { customLabs } from './custom-labs.js';

const existing = [
  { id: 'euclid', name: '平面几何与尺规', en: 'PLANE GEOMETRY & EUCLID', color: 'violet', summary: '从《几何原本》的尺规作图出发，探索三角形、圆、面积和证明。', lessons: [
    { id: 'equilateral', name: '作等边三角形', tag: '卷 I · 命题 1', intro: '给定线段 AB，不用量长度，能把它变成等边三角形吗？', idea: 'C 同时落在以 A、B 为圆心的两个圆上。于是 AC = AB，BC = AB，三边相等。', question: '为什么两段新画出的边都等于 AB？', choices: ['因为三条边看起来差不多', '因为它们分别是两个等半径圆的半径', '因为两圆的圆心是同一个点'], answer: 1 },
    { id: 'bisect-angle', name: '平分一个角', tag: '卷 I · 命题 9', intro: '给定角 BAC，用同一个圆在两条边上找出等距的点。', idea: 'AD = AE，DP = EP，AP 是公共边，所以 △ADP 与 △AEP 按边边边全等，∠DAP = ∠PAE。作等边三角形 DEP 时，把 P 取在 DE 与 A 相反的一侧。', question: '证明角被平分时，两组全等三角形的公共边是哪一条？', choices: ['DE', 'AD', 'AP'], answer: 2 },
    { id: 'midpoint', name: '平分一条线段', tag: '卷 I · 命题 10', intro: '不用尺上的刻度，也能准确地找到线段 AB 的中点。', idea: '按命题 1 作等边三角形，再按命题 9 平分 ∠ACB。角平分线与 AB 相交于 M。△ACM 与 △BCM 按边角边全等，所以 AM = BM。把两处构造选在 AB 的相反两侧，可以清楚看到它们。', question: '在命题 10 中，哪一步把等边三角形和中点联系了起来？', choices: ['平分顶角，并与底边相交', '绕顶点画任意一个圆', '把底边延长一倍'], answer: 0 },
    { id: 'pythagoras', name: '勾股定理的彩色证明', tag: '卷 I · 命题 47', intro: '同样的四块三角形，换一种拼法，空出来的面积会变吗？拼完后，再看欧几里得怎么证明。', idea: '欧几里得没有移动正方形。他在每一侧各找出两个全等的三角形：一个的面积是小正方形的一半，另一个的面积是对应长方形的一半。两块长方形恰好填满斜边的正方形。', question: '切拼时，为什么原来空出的一块正方形，与后来空出的两块正方形面积之和相等？', choices: ['因为拼图中所有边一样长', '因为从同样大的外框中拿掉了同样的四块三角形', '因为空出的正方形周长相同'], answer: 1, sources: [['C82 · 柏恩版《几何原本》', 'https://www.c82.net/work/euclid']] },
    { id: 'sangaku', name: '算额谜题：三条圆弧间的小圆', tag: '内切、外切与比例', intro: '正方形里有一个同时与三条圆弧相切的小圆。调整正方形边长，先猜小圆半径占边长的几分之几。', idea: '找出每条圆弧的圆心，把相切条件写成两圆心的距离。内切用大半径减小半径，外切用两半径相加。缩放整个正方形不会改变这个比例。', question: '正方形边长扩大到原来的两倍；三个大圆弧也同比例放大，小圆半径会怎样？', choices: ['加倍，半径与边长的比不变', '保持原值', '变为四倍'], answer: 0, sources: [['Sam Shah · Sangaku Puzzle', 'https://samjshah.com/2025/08/05/sangaku-puzzle-i-cant-solve/'], ['Sangaku Journal · 2017，图 6′', 'https://www.sangaku-journal.com/2017/SJM-problems-2017-1.pdf']] },
  ] },
  { id: 'non-euclid', name: '非欧几何与曲率', en: 'NON-EUCLIDEAN GEOMETRY', color: 'mint', summary: '走上球面，钻进双曲圆盘。换一个空间，熟悉的直线和三角形会怎样？', lessons: [
    { id: 'sphere', name: '球面三角形', tag: '正曲率', intro: '从北极沿两条大圆走向赤道，看看弯曲的球面如何把多出来的角度变成面积。', idea: '球面直线沿大圆走。两条经线垂直于赤道，因此两个赤道角都是 90°；北极角等于经度差 Δλ。内角和是 180° + Δλ。', question: '经度差从 30° 变为 90°：多出的角度（角超）和球面三角形面积各变为多少倍？', choices: ['都变成 2 倍', '都变成 3 倍', '只有角超变成 3 倍'], answer: 1 },
    { id: 'disk', name: '双曲圆盘里的平行线', tag: '负曲率', intro: '改变过点 P 的测地线方向，看看它和基准直线在圆盘内会不会相遇。', idea: '在庞加莱圆盘里，测地线是直径或与边界正交的圆弧。边界不属于双曲平面，因此即便两条线共用一个边界端点，也不算在平面内相交。', question: '在双曲平面里，过直线外一点、不与已知直线相交的直线有几条？', choices: ['一条', '没有', '无穷多条'], answer: 2 },
    { id: 'hyperbolic-triangle', name: '拖出一个双曲三角形', tag: '测地线与内角', intro: '在圆盘里拖动 A、B、C。每条边自动沿测地线连接，观察内角和怎样变化。', idea: '庞加莱圆盘保持角度：用两条圆弧在顶点处的切线就能量内角。非退化双曲三角形的内角和小于 180°；差值叫角亏。曲率固定时，角亏越大，双曲面积越大。', question: '在这个圆盘模型中，非退化三角形的内角和与 180° 相比如何？', choices: ['总是更小', '总是相等', '总是更大'], answer: 0, sources: [['Mathigon · Dimensions and Distortions', 'https://mathigon.org/world/Dimensions_and_Distortions#spherical']] },
  ] },
  { id: 'fractal', name: '分形与自相似', en: 'FRACTALS & SELF-SIMILARITY', color: 'amber', summary: '把同一条规则重复几次，看雪花长出无数尖角，三角形里藏着更多三角形。', lessons: [
    { id: 'koch', name: '科赫雪花', tag: '迭代与周长', intro: '从等边三角形开始，每一轮都把边的中段换成向外的小尖角。', idea: '每条线段变成四条原长 1/3 的线段。所以每一轮周长乘 4/3；随着轮数增加，周长没有上界，但雪花面积趋于一个有限值。', question: '每迭代一轮，雪花的周长变成上一轮的多少？', choices: ['4/3 倍', '3/4 倍', '4 倍'], answer: 0 },
    { id: 'sierpinski', name: '谢尔宾斯基三角形', tag: '自相似与面积', intro: '每一轮都挖掉每个三角形的中央，再观察剩下的图形。', idea: '每个三角形分成四个等面积的部分，移去中央的一份。留下的三个小三角形各自继续同样的操作，所以每一轮总面积乘 3/4。', question: '第 2 轮后，剩下的面积是最初的多少？', choices: ['1/2', '9/16', '3/4'], answer: 1 },
    { id: 'fractal-tree', name: '长一棵分形树', tag: '参数与递归', intro: '改变张开的角度、枝条长度比例和迭代轮数，看看同一条规则能长出多少种树形。', idea: '每根新枝都从上一根枝条的末端出发，左右各长一根更短的枝。因此第 n 轮新长出的枝条有 2ⁿ 根；不管角度或长度怎么变，数量都不变。', question: '从第 0 轮的一根树干开始，第 3 轮新长出多少根枝条？', choices: ['3 根', '6 根', '8 根'], answer: 2, sources: [['Mathigon · Fractals Introduction', 'https://mathigon.org/course/fractals/introduction']] },
  ] },
  { id: 'transforms', name: '变换、对称与透视', en: 'TRANSFORMATIONS & SYMMETRY', color: 'rose', summary: '旋转、缩放、照镜子：从变换里发现长度、角度和对称关系。', lessons: [
    { id: 'centers', name: '三角形的三个中心', tag: '拖动与不变量', intro: '拖动 A、B、C，切换重心、外心和内心，比较它们在不同三角形里的位置。', idea: '重心是三条中线的交点；外心是三条边的垂直平分线的交点；内心是三条内角平分线的交点。重心和内心始终在非退化三角形内，外心在钝角三角形外，在直角三角形的斜边中点。', question: '钝角三角形中，哪个中心位于三角形外？', choices: ['重心', '内心', '外心'], answer: 2 },
    { id: 'transform', name: '图形变换工作台', tag: '旋转、反射、缩放', intro: '拖动紫色三角形的顶点，再切换变换规则，比较原图与像的边长和面积。', idea: '旋转和反射保持距离，因此面积不变；等比缩放把边长乘 k，把面积乘 k²。反射还会反转顶点的顺序方向。', question: '把图形等比放大到 2 倍，面积会变成几倍？', choices: ['2 倍', '4 倍', '8 倍'], answer: 1 },
    { id: 'tiling', name: '铺砖挑战：拼满一圈', tag: '镶嵌与内角', intro: '选一种砖，把它贴到中心点旁边。用相同的砖，或者混搭不同的砖，试着不留缝地拼满一圈。', idea: '密铺要求顶点周围的角度加起来等于 360°。正三角形、正方形、正六边形的内角分别是 60°、90°、120°，都可以用同一种砖填满一圈。正五边形的 108° 不能整除 360°。拼满一个顶点是边对边铺砌的必要条件，不代表一定能铺满整个平面。', question: '混搭时，两个正六边形和两个正三角形能拼满一个顶点吗？', choices: ['能，120° + 120° + 60° + 60° = 360°', '不能，还差 60°', '不能，会重叠 60°'], answer: 0, sources: [['Mathigon · Tessellations', 'https://mathigon.org/course/polyhedra/tessellations'], ['Red Blob Games · Hexagonal Grids', 'https://www.redblobgames.com/grids/hexagons/']] },
    { id: 'billiards', name: '台球几何：借一次反弹', tag: '镜像与反射', intro: '让白球 A 碰一次上方库边，再打中目标 B。移动两球或改变碰边位置，先试射，再打开镜像提示。', idea: '把 B 映到库边另一侧，得到 B′。连结 A 和 B′，直线穿过库边的点就是理想碰边点。折回来后，入射角等于反射角。这里把球视为质点，不考虑旋转和摩擦。', question: '要用镜像找到上方库边的反弹点，应该把目标 B 关于哪里反射？', choices: ['桌面的中心点', '白球 A', '上方库边所在的直线'], answer: 2, sources: [['JRMF · Billiards Geometry', 'https://jrmf.org/puzzle/billiards-geometry/']] },
    { id: 'symmetry-ink', name: '对称画板：一笔变多笔', tag: '旋转与镜像', intro: '在圆内画一笔，让画板自动旋转复制。打开镜像，再看同一条笔迹能生成多少种朝向。', idea: '设旋转份数为 n，画板每隔 360° ÷ n 复制笔迹，原笔迹也算一份。打开镜像后，每份再生成一个镜像副本；如果笔迹落在对称轴上，部分副本可能重合。', question: '设为 4 份旋转并打开镜像，一般位置的一笔最多生成多少份（含原笔迹）？', choices: ['4 份', '8 份', '16 份'], answer: 1, sources: [['Weave Silk · 对称绘画灵感', 'https://weavesilk.com/']] },
  ] },
];

const byId = Object.fromEntries([...existing, ...collection].map(hall => [hall.id, hall]));
const movable = byId.transforms.lessons;
byId.euclid.lessons.push(...addedPropositions, movable.find(l => l.id === 'centers'));
byId.mosaics = { id: 'mosaics', name: '镶嵌与离散几何', en: 'TILINGS & DISCRETE GEOMETRY', color: 'ochre',
  summary: '用多边形拼满一个角，再连接蜂窝中心，看看同一张铺砌怎样变成另一张网。', lessons: [movable.find(l => l.id === 'tiling')] };
byId.transforms.lessons = movable.filter(l => l.id !== 'centers' && l.id !== 'tiling');
for (const entry of customLabs) {
  byId[entry.hall]?.lessons.push(entry.lesson);
}

export const wings = [
  { id: 'foundations', name: '形状与变换', ids: ['euclid', 'solids', 'curves', 'transforms'] },
  { id: 'structures', name: '空间与结构', ids: ['mosaics', 'non-euclid', 'topology', 'fractal'] },
  { id: 'frontiers', name: '算法与高维', ids: ['computational', 'dimensions'] },
].map(({ id, name, ids }) => ({ id, name, halls: ids.map(hall => byId[hall]) }));

export const halls = wings.flatMap(wing => wing.halls);
