import { pt } from '../math.js';
import { button, circle, line, metric, point, polyline, slider } from '../board.js';

export function rollingPoint(theta, radius, arm) {
  return pt(radius * theta - arm * Math.sin(theta), radius - arm * Math.cos(theta));
}

export function cycloidLab({ board, controls, stats, signal }) {
  const radius = 57, start = 75, ground = 286, maxAngle = 460;
  controls.innerHTML = slider('滚动角度', 'cycloid-angle', 145, 0, maxAngle, 1, '°') +
    slider('描线点到轮心的距离 / 半径', 'cycloid-arm', 100, 0, 160, 1, '%') +
    `<div class="control-row">${button('播放滚动', 'cycloid-play', 'aria-pressed="false"')}</div>
    <p class="lab-note">灰紫虚线是完整轨迹，橙线是已经走过的部分。把描线点移到轮外，注意轨迹何时向左折返。</p>`;
  const angle = controls.querySelector('#cycloid-angle'), arm = controls.querySelector('#cycloid-arm');
  const play = controls.querySelector('[data-action="cycloid-play"]');
  let frame = null;
  const radians = degrees => degrees * Math.PI / 180;

  function draw() {
    const a = Number(angle.value), ratio = Number(arm.value), reach = radius * ratio / 100;
    const pen = degrees => {
      const p = rollingPoint(radians(degrees), radius, reach);
      return pt(start + p.x, ground - p.y);
    };
    const trace = end => Array.from({ length: Math.ceil(end / 3) + 1 }, (_, i) => pen(Math.min(i * 3, end)));
    const center = pt(start + radius * radians(a), ground - radius);
    const tip = pen(a);
    board.draw(line(pt(16, ground), pt(622, ground), 'structural') +
      polyline(trace(maxAngle), 'aux') +
      circle(center, radius, 'shape') +
      (a > 0 ? polyline(trace(a), 'result cycloid-trace') : '') +
      line(center, tip, 'structural') + point(center) + point(tip, '', { kind: 'highlight' }));
    angle.previousElementSibling.value = `${a}°`;
    arm.previousElementSibling.value = `${ratio}%`;
    stats.innerHTML = metric('完整轨迹', ratio === 0 ? '水平直线' : ratio < 100 ? '光滑拱线' : ratio === 100 ? '尖点摆线' : '带回环') +
      metric('轮心前进距离 / 半径', radians(a).toFixed(2));
  }

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    play.textContent = '播放滚动';
    play.setAttribute('aria-pressed', 'false');
  }

  play.addEventListener('click', () => {
    if (frame !== null) return stop();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      angle.value = maxAngle;
      return draw();
    }
    const from = Number(angle.value) === maxAngle ? 0 : Number(angle.value);
    const started = performance.now();
    play.textContent = '暂停滚动';
    play.setAttribute('aria-pressed', 'true');
    const tick = now => {
      angle.value = Math.min(maxAngle, Math.floor(from + (now - started) * .12));
      draw();
      if (Number(angle.value) < maxAngle) frame = requestAnimationFrame(tick);
      else stop();
    };
    frame = requestAnimationFrame(tick);
  }, { signal });
  controls.addEventListener('input', () => { stop(); draw(); }, { signal });
  signal.addEventListener('abort', stop, { once: true });

  draw();
  return (_, degrees, ratio) => {
    stop();
    angle.value = degrees;
    arm.value = ratio;
    draw();
    board.animate('.cycloid-trace, .structural');
  };
}
