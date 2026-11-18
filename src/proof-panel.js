import { button } from './board.js';

export function proofPanel(guide, steps, select, signal) {
  guide.innerHTML = `<div class="proof-steps" aria-label="逐句阅读证明">${steps.map(([label], i) =>
    button(`${i + 1}. ${label}`, i, 'aria-pressed="false"')).join('')}</div><p class="proof-detail" role="status"></p>`;
  const options = [...guide.querySelectorAll('button')], detail = guide.querySelector('.proof-detail');
  guide.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.action;
    if (action !== undefined) select(Number(action));
  }, { signal });
  return index => {
    options.forEach((item, i) => item.setAttribute('aria-pressed', i === index));
    detail.textContent = steps[index]?.[1] ?? '';
  };
}
