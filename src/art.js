import { pt, koch, sierpinski } from './math.js';
import { polygon } from './board.js';

const icons = {
  euclid: '<path d="M12 5 5 20m7-15 7 15M8 14h8"/><circle cx="12" cy="5" r="2"/>',
  'non-euclid': '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  fractal: '<path d="m12 3 10 18H2Zm-5 9h10l-5 9Z"/>',
  transforms: '<path d="M20 9a8 8 0 1 0-1 8m1-13v5h-5"/><path d="m10 9 5 3-5 3Z"/>',
  solids: '<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10 9-5m-9 5L3 7m9 5v10"/>',
  curves: '<ellipse cx="12" cy="12" rx="10" ry="7"/><path d="m8 13 4-6 4 6"/>',
  mosaics: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Zm0 0v9m8 4.5L12 12l-8 4.5"/>',
  topology: '<path d="M2 12c0-6 6-7 10 0s10 6 10 0-6-7-10 0-10 6-10 0Z"/>',
  computational: '<path d="M10 3v7l-6 5m6-5 10 5m-8 6-2-11"/><circle cx="6" cy="7" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="8" cy="18" r="1"/><circle cx="17" cy="18" r="1"/>',
  dimensions: '<path d="M3 3h18v18H3Zm5 5h8v8H8Zm0 0L3 3m13 5 5-5m-5 13 5 5M8 16l-5 5"/>',
};
export const icon = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]}</svg>`;
const plate = (name, art) => `<svg class="plate-svg" viewBox="0 0 240 120" aria-hidden="true"><path class="plate-axis" d="M0 60H240M120 0V120"/><text x="12" y="106">${name}</text>${art}</svg>`;
export const plates = {
  euclid: plate('FIG 01', '<circle class="plate-guide" cx="98" cy="76" r="47"/><circle class="plate-guide" cx="145" cy="76" r="47"/><path class="plate-shape" d="M98 76 121.5 35.3 145 76Z"/><circle cx="98" cy="76" r="2.7"/><circle cx="145" cy="76" r="2.7"/><circle cx="121.5" cy="35.3" r="2.7"/>'),
  solids: plate('FIG 02', '<path class="plate-shape" d="M120 11 171 35V83l-51 25-51-25V35Zm0 48 51-24m-51 24L69 35m51 24v49"/><path class="plate-guide" d="M69 83 120 58l51 25m-51-25V11"/><path class="plate-em" d="m120 36 26 12 25 11-25 12-26 13-51-25 26-12Z"/>'),
  curves: plate('FIG 03', '<ellipse class="plate-shape" cx="120" cy="60" rx="69" ry="43"/><path class="plate-em" d="M75 60 130 17 165 60" fill="none"/><circle cx="75" cy="60" r="3"/><circle cx="165" cy="60" r="3"/><circle cx="130" cy="17" r="3"/>'),
  transforms: plate('FIG 04', '<path class="plate-shape" d="M83 28 136 50 85 95Z"/><path class="plate-shape plate-second" d="M159 31 107 53 161 94Z"/><path class="plate-guide" d="M83 28 159 31M136 50 107 53M85 95l76-1"/><circle cx="83" cy="28" r="3"/><circle cx="136" cy="50" r="3"/><circle cx="85" cy="95" r="3"/>'),
  mosaics: plate('FIG 05', '<path class="plate-shape" d="m120 36 21 12v24l-21 12-21-12V48Zm0-48 21 12v24l-21 12-21-12V0Zm42 72 21 12v24l-21 12-21-12V72Zm-84 0 21 12v24l-21 12-21-12V72Zm0-48 21 12v24L78 60 57 48V24Zm84 0 21 12v24l-21 12-21-12V24Zm-42 72 21 12v24l-21 12-21-12V96Z"/>'),
  'non-euclid': plate('FIG 06', '<circle class="plate-shape" cx="120" cy="59" r="48"/><ellipse class="plate-guide" cx="120" cy="59" rx="24" ry="48"/><ellipse class="plate-guide" cx="120" cy="59" rx="48" ry="15"/><path class="plate-em" d="M120 11Q92 32 86 69Q120 81 154 69Q148 32 120 11Z"/><circle cx="120" cy="11" r="2.6"/><circle cx="86" cy="69" r="2.6"/><circle cx="154" cy="69" r="2.6"/>'),
  topology: plate('FIG 07', '<path class="plate-shape" d="M57 56C57 20 93 23 119 51s54 42 65 15c12-30-28-55-64-14-35 42-63 35-63 4m0 0c0 25 38 47 69 14 29-34 61-19 58 1"/><path class="plate-guide" d="M63 51c18-23 42-7 59 12 29 31 54 19 63-4"/>'),
  fractal: plate('FIG 08', sierpinski([pt(120, 10), pt(175, 105), pt(65, 105)], 3).map(t => polygon(t, 'plate-cell')).join('')),
  computational: plate('FIG 09', '<path class="plate-shape" d="M48 13H190V105H48Zm57 0 17 30-45 62m45-62 38 13 30-21m-30 21-12 49"/><circle cx="77" cy="45" r="3"/><circle cx="137" cy="27" r="3"/><circle cx="169" cy="79" r="3"/><circle cx="110" cy="81" r="3"/>'),
  dimensions: plate('FIG 10', '<path class="plate-shape" d="M69 26h101v67H69Zm30 18h42v32H99Z"/><path class="plate-guide" d="m69 26 30 18m71-18-29 18m29 49-29-17M69 93l30-17M88 13h63v93H88Zm0 0 11 31m52-31-10 31m10 62-10-30m-53 30 11-30"/>'),
};

const snow = koch([pt(432, 166), pt(494, 273), pt(370, 273)], 3);
export const heroArt = `<svg class="hero-svg" viewBox="0 0 560 330" aria-hidden="true">
  <defs>
    <pattern id="hero-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#cbc0ef" stroke-opacity=".16"/></pattern>
    <radialGradient id="hero-glow"><stop stop-color="#6a51a3"/><stop offset="1" stop-color="#392866"/></radialGradient>
    <linearGradient id="hero-fill" x2="0" y2="1"><stop stop-color="#c5afff" stop-opacity=".42"/><stop offset="1" stop-color="#c5afff" stop-opacity=".1"/></linearGradient>
  </defs>
  <rect width="560" height="330" fill="url(#hero-glow)"/><rect width="560" height="330" fill="url(#hero-grid)"/>
  <path d="M22 45V22h23m470 0h23v23M22 285v23h23m470 0h23v-23" fill="none" stroke="#c6b7ef" stroke-opacity=".65"/>
  <g fill="none" stroke="#bbabe9" stroke-width="1">
    <path d="M60 223H486M248 35v255" stroke-dasharray="4 7" opacity=".55"/>
    <circle cx="191" cy="223" r="116" opacity=".7"/><circle cx="307" cy="223" r="116" opacity=".7"/>
    <circle cx="249" cy="156" r="121" stroke-dasharray="3 7" opacity=".4"/>
  </g>
  <path d="M191 223 249 122.541 307 223Z" fill="url(#hero-fill)" stroke="#eee6ff" stroke-width="2.3" stroke-linejoin="round"/>
  <path d="M249 123v100M229 156l39 0" stroke="#f6c08c" stroke-dasharray="3 5" opacity=".78"/>
  <g fill="#f3c58d" stroke="#3b286a" stroke-width="2"><circle cx="191" cy="223" r="5"/><circle cx="307" cy="223" r="5"/><circle cx="249" cy="122.541" r="5"/></g>
  <g class="hero-label" fill="#efe5ff"><text x="173" y="214">A</text><text x="318" y="214">B</text><text x="260" y="114">C</text></g>
  <g transform="translate(427 88)" fill="none" stroke="#d3c7f7"><circle r="37" fill="#ad9ae0" fill-opacity=".09"/><ellipse rx="16" ry="37" opacity=".7"/><ellipse rx="37" ry="12" opacity=".7"/><path d="M0-37Q-23-21-26 8Q0 20 26 8Q23-21 0-37Z" stroke="#8fd7c9" stroke-width="1.5"/></g>
  ${polygon(snow, 'hero-snow')}
  <path d="M84 101v18m-9-9h18m271 36v12m-6-6h12m134-32v12m-6-6h12M74 264v12m-6-6h12" stroke="#e8c1a8" stroke-opacity=".8"/>
  <g class="hero-label" fill="#dfd0fc"><text x="36" y="47">PLATE 01 / GEOMETRY</text><text x="37" y="289">CONSTRUCTION STUDY</text></g>
</svg>`;
