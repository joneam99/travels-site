(async () => {
const params = new URLSearchParams(window.location.search);
const trip   = trips.find(t => t.id === params.get('id')) || trips[0];

document.title = `${trip.city} — Travels`;

const main = document.getElementById('trip-main');

// Sheets → data.js 폴백으로 days/places 로드
const sheetRows = await fetchSheet(trip.id).catch(() => null);
let tripDays = trip.days;
if (sheetRows && sheetRows.length) {
  const result = await rowsTodays(sheetRows, trip.id).catch(e => {
    console.error('[Trip] rowsTodays 실패:', e);
    return null;
  });
  if (result) {
    tripDays = result.days;
    if (result.period) trip.period = result.period;
  }
}

const allCategories = [...new Set(tripDays.flatMap(d => d.places.map(p => p.category)))];
const allPlaces     = tripDays.flatMap(d => d.places);

// instagram section: showcase (objects) vs placeholder grid (strings)
const isIGShowcase = Array.isArray(trip.instagram) &&
  trip.instagram.length > 0 && typeof trip.instagram[0] === 'object';

let instaHTML;
if (isIGShowcase) {
  const igPosts = trip.instagram;
  const n = igPosts.length;
  const gridClass = n <= 1 ? 'ig-grid--1'
    : n === 2 ? 'ig-grid--2'
    : n === 3 ? 'ig-grid--3'
    : n <= 6  ? 'ig-grid--medium'
    : 'ig-grid--large';

  const tileItems = igPosts.map((post, i) => {
    const src = post.thumb || '';
    const [rw, rh] = (post.ratio || '1/1').split('/');
    return `<div class="ig-tile" data-ig="${i}" style="aspect-ratio:${rw.trim()}/${rh.trim()}">
      ${src ? `<img src="${src}" alt="" loading="lazy">` : ''}
    </div>`;
  }).join('');

  const firstCaption = igPosts[0]?.caption || '';
  instaHTML = `
  <div class="insta-showcase">
    <div class="insta-showcase-inner">
      <div class="insta-showcase-header">
        <h2 class="insta-showcase-title">What I shared</h2>
      </div>
      <div class="insta-showcase-body">
        <div class="ig-grid ${gridClass}" id="ig-grid">${tileItems}</div>
        <div class="insta-caption-panel">
          <p class="insta-caption-text" id="ig-caption">${firstCaption.replace(/\n/g, '<br>')}</p>
          <a class="insta-caption-link" id="ig-link" href="${igPosts[0]?.url || '#'}" target="_blank" rel="noopener">Instagram ↗</a>
        </div>
      </div>
    </div>
  </div>`;
} else {
  const gridItems = trip.instagram.map(src =>
    `<div class="insta-item"><img src="${src}" alt="" loading="lazy"></div>`
  ).join('');
  instaHTML = `
  <div class="section">
    <div class="section-label">Instagram</div>
    <div class="instagram-grid">${gridItems}</div>
  </div>`;
}

// ── ROUTE MAP SVG ────────────────────────────────────────
const DAY_COLORS = ['#0a0a0a'];

function buildRouteMap(tripDays, allPlaces) {
  const PAD = 40, W = 600, CLASH = 20;

  // 좌표 있는 스팟만, 날짜별 그룹
  const dayGroups = tripDays.map((day, di) => ({
    label: day.day, di,
    spots: day.places.filter(p => p.lat && p.lon),
  })).filter(g => g.spots.length > 0);

  if (!dayGroups.length) return '';
  const allSpots = dayGroups.flatMap(g => g.spots);

  // 좌표 → SVG 변환
  const lons = allSpots.map(s => s.lon), lats = allSpots.map(s => s.lat);
  const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
  const latMin = Math.min(...lats), latMax = Math.max(...lats);
  const ls = lonMax - lonMin || 0.001, as_ = latMax - latMin || 0.001;

  // 지리적 비율에 맞춰 높이 동적 계산 (위도에 따른 경도 보정 적용)
  const avgLat = (latMin + latMax) / 2;
  const cosLat = Math.cos(avgLat * Math.PI / 180);
  const idealH = PAD * 2 + (W - PAD * 2) * as_ / (ls * cosLat);
  const H = Math.max(140, Math.min(320, Math.round(idealH * 0.7)));

  const tx = lon => PAD + (lon - lonMin) / ls  * (W - PAD * 2);
  const ty = lat => PAD + (1 - (lat - latMin) / as_) * (H - PAD * 2);

  // 겹치는 점 오프셋 (전체 통합)
  const rawAll = allSpots.map(s => [+tx(s.lon).toFixed(1), +ty(s.lat).toFixed(1)]);
  const dispAll = [];
  rawAll.forEach(([x, y]) => {
    let nx = x, ny = y;
    for (let k = 0; k < 20; k++) {
      const ci = dispAll.findIndex(([ox, oy]) => Math.hypot(ox - nx, oy - ny) < CLASH);
      if (ci === -1) break;
      // 겹치는 점에서 바깥 방향으로 밀어내기 (방사형)
      const [ox, oy] = dispAll[ci];
      const dx = nx - ox || 0.5;
      const dy = ny - oy || -0.5;
      const d = Math.hypot(dx, dy);
      nx += (dx / d) * CLASH;
      ny += (dy / d) * CLASH * 0.6;
    }
    nx = Math.max(PAD, Math.min(W - PAD, nx));
    ny = Math.max(PAD, Math.min(H - PAD, ny));
    dispAll.push([+nx.toFixed(1), +ny.toFixed(1)]);
  });

  // 스팟 → 디스플레이 좌표 매핑
  let si = 0;
  const dispMap = new Map();
  dayGroups.forEach(g => g.spots.forEach(s => dispMap.set(s, dispAll[si++])));

  // SVG 컨텐츠 (날짜별 그룹)
  const svgContent = dayGroups.map(g => {
    const color = DAY_COLORS[g.di % DAY_COLORS.length];
    const pts   = g.spots.map(s => dispMap.get(s).join(',')).join(' ');
    const dots  = g.spots.map((s, n) => {
      const [x, y] = dispMap.get(s);
      const gi = allPlaces.indexOf(s);
      return `<g class="route-dot" data-idx="${gi}" style="color:${color}" role="button" tabindex="0" aria-label="${s.name}">
        <circle cx="${x}" cy="${y}" r="9" class="route-dot-circle"/>
        <text x="${x}" y="${y}" class="route-dot-num" dominant-baseline="central" text-anchor="middle">${n + 1}</text>
      </g>`;
    }).join('');
    return `<g class="route-day" data-day="${g.di + 1}">
      <polyline points="${pts}" class="route-line" stroke="${color}"/>
      ${dots}
    </g>`;
  }).join('');

  return `
  <div class="route-map-wrap">
    <svg class="route-map-svg" viewBox="0 0 ${W} ${H}" aria-label="Route map">
      ${svgContent}
    </svg>
    <div class="route-tooltip" id="route-tooltip"></div>
  </div>`;
}

// category normalisation (supports both old ALL-CAPS and new names)
const CAT_NORM = {
  FOOD: 'Food', CAFE: 'Cafe', BAR: 'Bar',
  SHOPPING: 'Shop', CULTURE: 'Sight', ART: 'Sight', NATURE: 'Sight',
};
function normCat(c) { return CAT_NORM[(c || '').toUpperCase()] || c || ''; }

// itinerary with running index for side-panel lookup
let _pi = 0;
const itineraryHTML = tripDays.map((day, di) => {
  const placesHTML = day.places.map(p => {
    const idx = _pi++;
    const cat      = normCat(p.category);
    const mapsHref = p.maps || (p.address ? `https://maps.google.com/?q=${encodeURIComponent(p.address)}` : '');
    return `
      <div class="place-item" data-idx="${idx}">
        <div class="place-info">
          <div class="place-name">${p.name}</div>
          ${p.address && mapsHref
            ? `<a class="place-address" href="${mapsHref}" target="_blank" rel="noopener">${p.address}</a>`
            : ''}
        </div>
        ${cat ? `<span class="place-cat">${cat}</span>` : ''}
      </div>`;
  }).join('');
  return `<div class="day-group" data-day="${di + 1}">${placesHTML}</div>`;
}).join('');

// ── CATEGORY / ITINERARY COMBINED SECTION ────────────────
const placesByCategory = {};
allCategories.forEach(cat => { placesByCategory[cat] = []; });
allPlaces.forEach(p => { if (placesByCategory[p.category]) placesByCategory[p.category].push(p); });

const SCATTER_POS = [
  { x:  4, y:  0 },
  { x: 48, y: 24 },
  { x: 10, y: 48 },
  { x: 52, y: 64 },
  { x:  4, y: 82 },
  { x: 42, y: 84 },
  { x: 30, y: 12 },
  { x: 24, y: 66 },
];

// 개수 내림차순 정렬 → 많은 카테고리가 더 크게
const sortedCategories = [...allCategories].sort(
  (a, b) => (placesByCategory[b]?.length || 0) - (placesByCategory[a]?.length || 0)
);
const catCounts  = sortedCategories.map(c => placesByCategory[c]?.length || 0);
const maxCount   = catCounts[0] || 1;
const minCount   = catCounts[catCounts.length - 1] || 0;
const countRange = maxCount - minCount || 1;

const scatterHTML = sortedCategories.map((cat, i) => {
  const count = placesByCategory[cat]?.length || 0;
  const t     = (count - minCount) / countRange; // 0(최소) ~ 1(최대)
  const fsMin = (2 + t * 1.2).toFixed(2);
  const fsVw  = (3.5 + t * 3).toFixed(2);
  const fsMax = (4.5 + t * 3.5).toFixed(2);
  const pos   = SCATTER_POS[i % SCATTER_POS.length];
  return `<button class="cat-scatter-item" data-cat="${cat}" style="left:${pos.x}%;top:${pos.y}%;font-size:clamp(${fsMin}rem,${fsVw}vw,${fsMax}rem)">${cat.toUpperCase()}</button>`;
}).join('');

const routeMapHTML = buildRouteMap(tripDays, allPlaces);

const daysWithPlaces = tripDays.filter(d => d.places.length > 0);
const itinDayFilterHTML = daysWithPlaces.length > 1 ? `
  <div class="itin-day-filter">
    ${daysWithPlaces.map((d, i) => {
      const dayNum = tripDays.indexOf(d) + 1;
      return `<button class="itin-day-btn${i === 0 ? ' active' : ''}" data-day="${dayNum}">${d.day}</button>`;
    }).join('')}
  </div>` : '';

const ciSectionHTML = `
<div class="section ci-section">
  <div class="ci-toggle">
    <button class="ci-btn ci-active" id="ci-cat-btn">Category</button>
    <span class="ci-sep"> / </span>
    <button class="ci-btn" id="ci-itin-btn">Itinerary</button>
  </div>
  <div id="ci-cat-view" class="ci-view">
    <div class="cat-scatter">${scatterHTML}</div>
  </div>
  <div id="ci-itin-view" class="ci-view ci-hidden">
    ${itinDayFilterHTML}
    ${routeMapHTML}
    ${itineraryHTML}
  </div>
</div>`;

main.innerHTML = `
  <!-- HERO + PHOTO STRIP -->
  <div class="strip-wrapper" id="strip-wrapper">
    <div class="strip-sticky">
      <section class="trip-hero">
        <h1 class="trip-hero-city">${trip.city}</h1>
        <p class="trip-hero-meta">${trip.country}&nbsp;&nbsp;·&nbsp;&nbsp;${trip.period}</p>
      </section>
      <div class="strip-track" id="strip-track">
        ${trip.photos.map((src, i) => `
          <div class="strip-photo">
            <img src="${src}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}">
          </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- CATEGORY + ITINERARY -->
  ${ciSectionHTML}

  <!-- INSTAGRAM -->
  ${instaHTML}

  <footer class="site-footer">
    <div class="footer-main">
      <div class="footer-nl">
        <div>
          <h2 class="footer-heading">Newsletter</h2>
          <p class="footer-nl-desc">새로운 여정이 추가되면 메일로 받아보세요.</p>
        </div>
        <a class="footer-nl-btn" href="https://fromj.stibee.com/" target="_blank" rel="noopener">구독하기</a>
      </div>
      <div class="footer-contact">
        <h2 class="footer-heading">Contact</h2>
        <nav class="footer-links">
          <a class="footer-link" href="mailto:joneam99@gmail.com">Mail</a>
          <a class="footer-link" href="https://www.instagram.com/_j___oo/" target="_blank" rel="noopener">Instagram</a>
        </nav>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="site-footer-slogan">Recording is Remembering. Sharing is Caring.</span>
      <span class="site-footer-copy">© Jungeun Joo. All rights reserved.</span>
    </div>
  </footer>
`;

// ── SIDE PANEL ──────────────────────────────────────────
const panel = document.createElement('aside');
panel.className = 'side-panel';
panel.innerHTML = `
  <button class="sp-close" id="sp-close">✕</button>
  <div class="sp-body" id="sp-body"></div>
`;
document.body.appendChild(panel);

const overlay = document.createElement('div');
overlay.className = 'side-panel-overlay';
document.body.appendChild(overlay);

async function openPanel(place) {
  const cat      = normCat(place.category);
  const mapsHref = place.maps || (place.address ? `https://maps.google.com/?q=${encodeURIComponent(place.address)}` : '');
  const photos   = await resolvePhotos(place);
  document.getElementById('sp-body').innerHTML = `
    <div class="sp-name">${place.name}</div>
    ${cat ? `<div class="sp-sub">${cat}</div>` : ''}
    ${place.address && mapsHref
      ? `<a class="sp-address-link" href="${mapsHref}" target="_blank" rel="noopener">${place.address} ↗</a>`
      : mapsHref
      ? `<a class="sp-address-link" href="${mapsHref}" target="_blank" rel="noopener">지도 보기 ↗</a>`
      : ''}
    ${photos[0] ? `<img class="sp-photo" src="${photos[0]}" alt="${place.name}">` : ''}
    ${place.desc  ? `<p class="sp-desc">${place.desc}</p>` : ''}
  `;
  panel.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  panel.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('sp-close').addEventListener('click', closePanel);
overlay.addEventListener('click', closePanel);

document.querySelectorAll('.place-item').forEach(item => {
  item.addEventListener('click', () => openPanel(allPlaces[+item.dataset.idx]));
});
// address links open Maps, not the side panel
document.querySelectorAll('.place-address').forEach(link => {
  link.addEventListener('click', e => e.stopPropagation());
});

// ── ROUTE MAP FILTER ─────────────────────────────────────
function applyDayFilter(day) {
  document.querySelectorAll('.route-day').forEach(g => {
    g.classList.toggle('faded', g.dataset.day !== day);
  });
  document.querySelectorAll('.day-group').forEach(g => {
    g.style.display = g.dataset.day === day ? '' : 'none';
  });
}

// init: show first day only
const firstItinBtn = document.querySelector('.itin-day-btn');
if (firstItinBtn) applyDayFilter(firstItinBtn.dataset.day);

document.querySelectorAll('.itin-day-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.itin-day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyDayFilter(btn.dataset.day);
  });
});

// ── ROUTE MAP INTERACTIONS ────────────────────────────────
const routeTooltip = document.getElementById('route-tooltip');
document.querySelectorAll('.route-dot').forEach(dot => {
  const idx   = +dot.dataset.idx;
  const place = allPlaces[idx];
  if (!place) return;

  dot.addEventListener('mouseenter', e => {
    if (!routeTooltip) return;
    routeTooltip.textContent = place.name;
    routeTooltip.classList.add('visible');
  });
  dot.addEventListener('mousemove', e => {
    if (!routeTooltip) return;
    const wrap = dot.closest('.route-map-wrap');
    const rect = wrap.getBoundingClientRect();
    routeTooltip.style.left = (e.clientX - rect.left) + 'px';
    routeTooltip.style.top  = (e.clientY - rect.top - 36) + 'px';
  });
  dot.addEventListener('mouseleave', () => {
    routeTooltip?.classList.remove('visible');
  });
  dot.addEventListener('click', () => openPanel(place));
});

// ── INSTAGRAM SHOWCASE INTERACTION ──────────────────────
if (isIGShowcase) {
  const igPosts   = trip.instagram;
  const captionEl = document.getElementById('ig-caption');
  const linkEl    = document.getElementById('ig-link');
  const tiles     = [...document.querySelectorAll('.ig-tile')];

  tiles.forEach((tile, i) => {
    const post = igPosts[i];
    tile.addEventListener('mouseenter', () => {
      tiles.forEach(t => t.classList.remove('is-active'));
      tile.classList.add('is-active');
      if (captionEl) {
        captionEl.style.opacity = '0';
        setTimeout(() => {
          captionEl.innerHTML = (post.caption || '').replace(/\n/g, '<br>');
          captionEl.style.opacity = '1';
        }, 160);
      }
      if (linkEl) linkEl.href = post.url || '#';
    });
    tile.addEventListener('click', () => {
      if (post?.url) window.open(post.url, '_blank', 'noopener');
    });
  });
}

// ── PHOTO STRIP ──────────────────────────────────────────
const wrapper = document.getElementById('strip-wrapper');
const track   = document.getElementById('strip-track');
const photos  = [...track.querySelectorAll('.strip-photo')];
const PEEK    = 32;
const VISIBLE = Math.min(photos.length, 3);

function isDesktop() { return window.innerWidth >= 768; }

let spreadStarts = [];

function setWrapperHeight() {
  wrapper.style.height = `${(window.innerHeight - 52) + photos.length * 300 + window.innerHeight * 0.5}px`;
}

function onScrollDesktop() {
  const stickyH = window.innerHeight - 52;
  const rect    = wrapper.getBoundingClientRect();
  const total   = wrapper.offsetHeight - stickyH;
  if (total <= 0) return;
  const scrolled = Math.max(0, -rect.top);
  const overall  = Math.min(1, scrolled / total);
  const n      = photos.length;
  const trackW = track.offsetWidth;

  const topW    = photos[n - 1].getBoundingClientRect().width || trackW * 0.3;
  const dynPeek = n > 1 ? (trackW - topW) / (n - 1) : 0;

  photos.forEach((photo, i) => {
    const p      = Math.max(0, Math.min(1, (overall - i / n) / (1 / n)));
    const eased  = 1 - Math.pow(1 - p, 3);
    const finalX = i * dynPeek;
    const startX = spreadStarts[i] !== undefined ? spreadStarts[i] : window.innerWidth;
    photo.style.transform = `translateX(${startX + (finalX - startX) * eased}px)`;
  });

  const labelEl = document.getElementById('cursor-label');
  if (labelEl) labelEl.textContent = `${Math.min(n, Math.floor(overall * n) + 1)}/${n}`;
}

function initDesktop() {
  const n    = photos.length;
  const colW = window.innerWidth / VISIBLE;

  // 1단계: 이미지 로드 전 colW 기준으로 즉시 배치
  spreadStarts = Array.from({length: n}, (_, i) =>
    i < VISIBLE ? i * colW : window.innerWidth
  );
  photos.forEach((photo, i) => {
    photo.style.zIndex = i + 1;
    photo.style.transform = `translateX(${spreadStarts[i]}px)`;
  });
  setWrapperHeight();
  onScrollDesktop();

  // 2단계: 실제 너비로 보정 (이미지 로드 후 갭 제거)
  function refineSpread() {
    let offset = 0;
    for (let i = 0; i < VISIBLE && i < n; i++) {
      const w = photos[i].getBoundingClientRect().width; // 서브픽셀 정밀도
      if (!w) return;
      spreadStarts[i] = offset;
      photos[i].style.transform = `translateX(${offset}px)`;
      offset += w;
    }
  }
  refineSpread(); // 캐시된 이미지면 즉시 적용
  photos.slice(0, VISIBLE).forEach(photo => {
    const img = photo.querySelector('img');
    if (img && !img.complete) img.addEventListener('load', refineSpread, {once: true});
  });
}

function initMobile() {
  wrapper.style.height = '';
  photos.forEach(p => { p.style.transform = ''; p.style.zIndex = ''; });
}

if (isDesktop()) {
  initDesktop();
  window.addEventListener('scroll', onScrollDesktop, { passive: true });

  wrapper.addEventListener('mouseenter', () => {
    const labelEl = document.getElementById('cursor-label');
    if (labelEl && !labelEl.textContent) labelEl.textContent = `1/${photos.length}`;
    window.setCursorState?.('has-label');
  });
  wrapper.addEventListener('mouseleave', () => window.setCursorState?.(''));
} else {
  initMobile();
}

window.addEventListener('resize', () => {
  if (isDesktop()) initDesktop();
  else initMobile();
  fitCatScatter();
});

// ── CATEGORY SCATTER FIT ──────────────────────────────────
function fitCatScatter() {
  const scatter = document.querySelector('.cat-scatter');
  if (!scatter || !scatter.offsetParent) return;
  const items = [...scatter.querySelectorAll('.cat-scatter-item')];
  if (!items.length) return;

  // 원래 위치로 리셋 (리사이즈 시 재계산)
  items.forEach(item => {
    if (item.dataset.origLeft) item.style.left = item.dataset.origLeft;
    else item.dataset.origLeft = item.style.left;
    if (item.dataset.origTop) item.style.top = item.dataset.origTop;
    else item.dataset.origTop = item.style.top;
  });

  const sw = scatter.offsetWidth;
  let sr = scatter.getBoundingClientRect();
  const rects = items.map(el => el.getBoundingClientRect());

  let minL = Infinity, maxR = -Infinity;
  rects.forEach(r => {
    minL = Math.min(minL, r.left - sr.left);
    maxR = Math.max(maxR, r.right - sr.left);
  });

  // 수평 중앙 정렬
  const shift = (sw - (maxR - minL)) / 2 - minL;
  if (Math.abs(shift) > 1) {
    items.forEach(item => {
      const origPx = parseFloat(item.dataset.origLeft) / 100 * sw;
      item.style.left = ((origPx + shift) / sw * 100).toFixed(2) + '%';
    });
  }

  // 겹침 해소: 최대 8회 반복으로 수직 방향 밀어내기
  for (let iter = 0; iter < 8; iter++) {
    sr = scatter.getBoundingClientRect();
    const cur = items.map(el => el.getBoundingClientRect());
    let moved = false;
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        const ra = cur[a], rb = cur[b];
        const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (ox > 4 && oy > 4) {
          const push = (oy + 8) / 2 / sr.height * 100;
          const topA = parseFloat(items[a].style.top);
          const topB = parseFloat(items[b].style.top);
          if (ra.top + ra.height / 2 <= rb.top + rb.height / 2) {
            items[a].style.top = Math.max(0, topA - push).toFixed(2) + '%';
            items[b].style.top = (topB + push).toFixed(2) + '%';
          } else {
            items[a].style.top = (topA + push).toFixed(2) + '%';
            items[b].style.top = Math.max(0, topB - push).toFixed(2) + '%';
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // 컨테이너 높이를 아이템에 맞게 조정
  let maxB = 0;
  sr = scatter.getBoundingClientRect();
  items.forEach(el => {
    maxB = Math.max(maxB, el.getBoundingClientRect().bottom - sr.top);
  });
  scatter.style.height = (maxB + 16) + 'px';
}

// ── CATEGORY / ITINERARY TOGGLE ──────────────────────────
document.getElementById('ci-cat-btn').addEventListener('click', () => {
  document.getElementById('ci-cat-view').classList.remove('ci-hidden');
  document.getElementById('ci-itin-view').classList.add('ci-hidden');
  document.getElementById('ci-cat-btn').classList.add('ci-active');
  document.getElementById('ci-itin-btn').classList.remove('ci-active');
  fitCatScatter();
});
document.getElementById('ci-itin-btn').addEventListener('click', () => {
  document.getElementById('ci-itin-view').classList.remove('ci-hidden');
  document.getElementById('ci-cat-view').classList.add('ci-hidden');
  document.getElementById('ci-itin-btn').classList.add('ci-active');
  document.getElementById('ci-cat-btn').classList.remove('ci-active');
});

// Initial fit after layout
requestAnimationFrame(() => requestAnimationFrame(fitCatScatter));

// ── CATEGORY SCATTER ANIMATION ────────────────────────────
const scatterEl = document.querySelector('.cat-scatter');
if (scatterEl) {
  const scatterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const items = [...entry.target.querySelectorAll('.cat-scatter-item')];
      items.forEach((item, i) => {
        setTimeout(() => {
          item.classList.add('is-visible');
          setTimeout(() => item.classList.add('is-settled'), 750);
        }, i * 90);
      });
      scatterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  scatterObserver.observe(scatterEl);
}

// ── CATEGORY CAROUSEL OVERLAY ────────────────────────────
const catOverlay = document.createElement('div');
catOverlay.className = 'cat-overlay';
catOverlay.innerHTML = `
  <div class="cat-overlay-bg"></div>
  <div class="cat-overlay-hd">
    <span class="cat-overlay-title" id="cat-overlay-title"></span>
  </div>
  <div class="cat-carousel">
    <div class="cat-carousel-track" id="cat-carousel-track"></div>
  </div>
  <button class="cat-carousel-nav prev" id="cat-prev">←</button>
  <button class="cat-carousel-nav next" id="cat-next">→</button>
  <div class="cat-carousel-dots" id="cat-carousel-dots"></div>
`;
document.body.appendChild(catOverlay);

let _ci = 0, _cPlaces = [], _cPhotos = [];
const CARD_W = 340, CARD_GAP = 16;

function _buildItemHTML(p, photos) {
  const mapsHref = p.maps || (p.address ? `https://maps.google.com/?q=${encodeURIComponent(p.address)}` : '');
  const img = photos.length >= 2
    ? `<div class="cat-carousel-diptych">
         <img src="${photos[0]}" alt="" loading="lazy">
         <img src="${photos[1]}" alt="" loading="lazy">
       </div>`
    : photos[0]
      ? `<img class="cat-carousel-photo" src="${photos[0]}" alt="${p.name}" loading="lazy">`
      : '';
  return `
    ${img}
    <div class="cat-carousel-info">
      <div class="cat-carousel-name">${p.name}</div>
      ${p.address ? `<div class="cat-carousel-addr">${p.address}</div>` : ''}
      ${p.desc    ? `<p class="cat-carousel-desc">${p.desc}</p>`        : ''}
      ${mapsHref  ? `<a class="cat-carousel-maps" href="${mapsHref}" target="_blank" rel="noopener">지도 보기 ↗</a>` : ''}
    </div>`;
}

function _focusCard(idx) {
  const track = document.getElementById('cat-carousel-track');
  const n     = _cPlaces.length;
  _ci = Math.max(0, Math.min(n - 1, idx));

  // center the active card horizontally
  const cardCenter = _ci * (CARD_W + CARD_GAP) + CARD_W / 2;
  const tx = window.innerWidth / 2 - cardCenter;
  track.style.transform = `translateY(-50%) translateX(${tx}px)`;

  [...track.querySelectorAll('.cat-carousel-item')].forEach((el, i) =>
    el.classList.toggle('active', i === _ci)
  );
  [...document.querySelectorAll('.cat-carousel-dot')].forEach((d, i) =>
    d.classList.toggle('active', i === _ci)
  );
  document.getElementById('cat-prev').disabled = _ci === 0;
  document.getElementById('cat-next').disabled = _ci === n - 1;
}

function _navigate(dir) { _focusCard(_ci + dir); }

// 08.jpg → 08_2.jpg 존재 여부 자동 감지 (sessionStorage 캐시)
function probePhoto(path) {
  return new Promise(resolve => {
    const key = `probe:${path}`;
    const hit = sessionStorage.getItem(key);
    if (hit !== null) return resolve(hit === '1');
    const img = new Image();
    img.onload  = () => { sessionStorage.setItem(key, '1'); resolve(true); };
    img.onerror = () => { sessionStorage.setItem(key, '0'); resolve(false); };
    img.src = path;
  });
}

// 기본 사진 + _2 변형 자동 감지 → [photo1] 또는 [photo1, photo2]
async function resolvePhotos(p) {
  if (p.photos && p.photos.length >= 2) return p.photos.slice(0, 2);
  let base = p.photo;
  if (!base) return [];

  // 확장자 없으면 .jpg → .webp 순으로 탐색
  if (!/\.[^.]+$/.test(base)) {
    for (const ext of ['.jpg', '.webp']) {
      if (await probePhoto(base + ext)) { base = base + ext; break; }
    }
  } else if (!await probePhoto(base)) {
    // 확장자 있는데 파일 없으면 반대 확장자 시도
    const alt = /\.jpg$/i.test(base)
      ? base.replace(/\.jpg$/i, '.webp')
      : base.replace(/\.webp$/i, '.jpg');
    if (await probePhoto(alt)) base = alt;
  }

  const ext    = base.match(/\.[^.]+$/)?.[0] || '.jpg';
  const second = base.replace(/\.[^.]+$/, '_2' + ext);
  const has2   = await probePhoto(second);
  return has2 ? [base, second] : [base];
}

async function openCatDrawer(cat) {
  _cPlaces = placesByCategory[cat] || [];
  document.getElementById('cat-overlay-title').textContent = cat.toUpperCase();
  catOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  _cPhotos = await Promise.all(_cPlaces.map(resolvePhotos));

  const track  = document.getElementById('cat-carousel-track');
  const dotsEl = document.getElementById('cat-carousel-dots');

  track.innerHTML = _cPlaces.map((p, i) =>
    `<div class="cat-carousel-item" data-idx="${i}">${_buildItemHTML(p, _cPhotos[i])}</div>`
  ).join('');

  dotsEl.innerHTML = _cPlaces.map((_, i) =>
    `<span class="cat-carousel-dot"></span>`
  ).join('');

  // click card to focus
  track.querySelectorAll('.cat-carousel-item').forEach((el, i) => {
    el.addEventListener('click', e => {
      if (e.target.closest('.cat-carousel-maps')) return;
      _focusCard(i);
    });
  });

  // disable transition for initial placement
  track.style.transition = 'none';
  _focusCard(0);
  requestAnimationFrame(() => {
    track.style.transition = '';
  });
}

function closeCatDrawer() {
  catOverlay.classList.remove('open');
  document.body.style.overflow = '';
  window.setCursorState?.('');
}

catOverlay.addEventListener('click', e => {
  if (!e.target.closest('.cat-carousel-item') &&
      !e.target.closest('.cat-carousel-nav') &&
      !e.target.closest('.cat-overlay-hd') &&
      !e.target.closest('.cat-carousel-dots')) {
    closeCatDrawer();
  }
});

catOverlay.addEventListener('mouseover', e => {
  if (!window.setCursorState) return;
  if (e.target.closest('#cat-prev') || e.target.closest('#cat-next')) {
    window.setCursorState('is-large');
  } else {
    window.setCursorState('');
  }
});
catOverlay.addEventListener('mouseleave', () => window.setCursorState?.(''));
document.getElementById('cat-prev').addEventListener('click', () => _navigate(-1));
document.getElementById('cat-next').addEventListener('click', () => _navigate(1));

document.addEventListener('keydown', e => {
  if (!catOverlay.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  _navigate(-1);
  if (e.key === 'ArrowRight') _navigate(1);
  if (e.key === 'Escape')     closeCatDrawer();
});

document.querySelectorAll('.cat-scatter-item').forEach(btn => {
  btn.addEventListener('click', () => openCatDrawer(btn.dataset.cat));
});
})();
