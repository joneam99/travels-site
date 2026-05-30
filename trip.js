const params = new URLSearchParams(window.location.search);
const trip   = trips.find(t => t.id === params.get('id')) || trips[0];

document.title = `${trip.city} — Travels`;

const main = document.getElementById('trip-main');

// collect all categories for filter buttons
const allCategories = [...new Set(trip.days.flatMap(d => d.places.map(p => p.category)))];

// all places flat list
const allPlaces = trip.days.flatMap(d => d.places);

main.innerHTML = `
  <!-- HERO + PHOTO STRIP (combined sticky) -->
  <div class="strip-wrapper" id="strip-wrapper">
    <div class="strip-sticky">
      <section class="trip-hero">
        <h1 class="trip-hero-city">${trip.city}</h1>
        <p class="trip-hero-meta">${trip.country}&nbsp;&nbsp;·&nbsp;&nbsp;${trip.period}</p>
      </section>
      <div class="strip-track" id="strip-track">
        ${trip.photos.map(src => `
          <div class="strip-photo">
            <img src="${src}" alt="" loading="eager">
          </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- ITINERARY -->
  <div class="section">
    ${trip.days.map(day => `
      <div class="day-group">
        <div class="day-header">
          <span class="day-label">${day.day}</span>
          <span class="day-date">${day.date}</span>
        </div>
        ${day.places.length === 0 ? '' : day.places.map(p => `
          <div class="place-item">
            <img class="place-photo" src="${p.photo}" alt="${p.name}" loading="lazy">
            <div class="place-info">
              ${p.label ? `<span class="place-label">${p.label}</span>` : ''}
              <div class="place-name">${p.name}</div>
              ${p.desc ? `<div class="place-desc">${p.desc}</div>` : ''}
              ${p.maps ? `<a class="place-maps" href="${p.maps}" target="_blank" rel="noopener noreferrer">지도 보기 ↗</a>` : ''}
            </div>
            <span class="place-tag tag-${p.category.toLowerCase()}">${p.category}</span>
          </div>`).join('')}
      </div>`).join('')}
  </div>

  <!-- CATEGORY SECTION -->
  <div class="section--full">
    <div class="section--full-inner">
      <div class="section-label">Browse by Category</div>
      <div class="category-filters" id="cat-filters">
        <button class="cat-btn active" data-cat="ALL">All</button>
        ${allCategories.map(c => `<button class="cat-btn" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="category-grid" id="cat-grid">
        ${allPlaces.map(p => `
          <div class="cat-photo-card visible" data-cat="${p.category}">
            <img src="${p.photo}" alt="${p.name}" loading="lazy">
            ${p.label ? `<div class="cat-card-label">${p.label}</div>` : ''}
            <div class="cat-card-title">${p.name}</div>
            ${p.desc ? `<div class="cat-card-desc">${p.desc}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- INSTAGRAM -->
  <div class="section">
    <div class="section-label">Instagram</div>
    <div class="instagram-grid">
      ${trip.instagram.map(src => `
        <div class="insta-item"><img src="${src}" alt="" loading="lazy"></div>`).join('')}
    </div>
  </div>

  <footer class="trip-footer">
    ${trip.city},&nbsp;${trip.country}&nbsp;&nbsp;·&nbsp;&nbsp;${trip.period}
  </footer>
`;

// ── PHOTO STRIP: STACK FROM RIGHT ────────────────────────
const wrapper = document.getElementById('strip-wrapper');
const track   = document.getElementById('strip-track');
const photos  = [...track.querySelectorAll('.strip-photo')];
const PEEK    = 32; // px each card peeks from under the next

photos.forEach((photo, i) => {
  photo.style.zIndex = i + 1;
  photo.style.transform = `translateX(${window.innerWidth}px)`;
});

function setWrapperHeight() {
  const stickyH = window.innerHeight - 52;
  wrapper.style.height = `${stickyH + photos.length * 300}px`;
}

function onScroll() {
  const stickyH = window.innerHeight - 52;
  const rect = wrapper.getBoundingClientRect();
  const totalScroll = wrapper.offsetHeight - stickyH;
  if (totalScroll <= 0) return;

  const scrolled = Math.max(0, -rect.top);
  const overall  = Math.min(1, scrolled / totalScroll);
  const n = photos.length;

  photos.forEach((photo, i) => {
    const p     = Math.max(0, Math.min(1, (overall - i / n) / (1 / n)));
    const eased = 1 - Math.pow(1 - p, 3);
    const x     = window.innerWidth + (i * PEEK - window.innerWidth) * eased;
    photo.style.transform = `translateX(${x}px)`;
  });
}

setWrapperHeight();
onScroll();

window.addEventListener('resize', () => { setWrapperHeight(); onScroll(); });
window.addEventListener('scroll', onScroll, { passive: true });

// ── CATEGORY FILTER ──────────────────────────────────────
document.getElementById('cat-filters').addEventListener('click', e => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const sel = btn.dataset.cat;
  document.querySelectorAll('.cat-photo-card').forEach(card => {
    card.classList.toggle('visible', sel === 'ALL' || card.dataset.cat === sel);
  });
});
