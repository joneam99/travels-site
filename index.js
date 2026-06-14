const listView   = document.getElementById('list-view');
const popup      = document.getElementById('preview-popup');
const popupImg   = document.getElementById('preview-img');
const labelEl    = document.getElementById('cursor-label');

const COMING_SOON_CITIES = [
  { city: 'TOKYO',       year: 2025 },
  { city: 'ULAANBAATAR', year: 2025 },
  { city: 'COPENHAGEN',  year: 2025 },
  { city: 'BERLIN',      year: 2025 },
  { city: 'FRANKFURT',   year: 2025 },
  { city: 'BANGKOK',     year: 2024 },
  { city: 'BANGKOK',     year: 2024 },
  { city: 'TAIPEI',      year: 2023 },
  { city: 'KYOTO',       year: 2023 },
  { city: 'MELBOURNE',   year: 2023 },
  { city: 'STUTTGART',   year: 2023 },
  { city: 'MADRID',      year: 2023 },
  { city: 'ROME',        year: 2023 },
  { city: 'BUDAPEST',    year: 2023 },
  { city: 'VIENNA',      year: 2023 },
  { city: 'SANTANDER',   year: 2022 },
  { city: 'DONOSTIA',    year: 2022 },
  { city: 'FRANKFURT',   year: 2022 },
  { city: 'PARIS',       year: 2022 },
  { city: 'MADRID',      year: 2022 },
  { city: 'BARCELONA',   year: 2022 },
  { city: 'LONDON',      year: 2022 },
  { city: 'MALLORCA',    year: 2022 },
  { city: 'BERLIN',      year: 2022 },
  { city: 'MÁLAGA',      year: 2022 },
  { city: 'BILBAO',      year: 2022 },
];

// 모든 아이템을 연도별로 그룹핑
function groupByYear() {
  const groups = {};

  trips.forEach(t => {
    const year = parseInt(t.date.split('.')[0]);
    if (!groups[year]) groups[year] = [];
    groups[year].push({ type: 'trip', trip: t });
  });

  COMING_SOON_CITIES.forEach(c => {
    if (!groups[c.year]) groups[c.year] = [];
    groups[c.year].push({ type: 'soon', city: c.city });
  });

  return Object.keys(groups).sort((a, b) => b - a).map(year => ({
    year: +year,
    items: groups[year],
  }));
}

function buildList() {
  const yearGroups = groupByYear();
  let animIdx = 0;

  yearGroups.forEach(({ year, items }) => {
    items.forEach((item, i) => {
      const isFirst = i === 0;

      if (item.type === 'trip') {
        const a = document.createElement('a');
        a.href = `trip.html?id=${item.trip.id}`;
        a.className = 'city-item';
        a.style.animationDelay = `${animIdx * 0.06}s`;
        a.innerHTML = `
          ${isFirst ? `<span class="year-label">${year}</span>` : ''}
          <div class="city-item-inner">
            <span class="city-country">${item.trip.country}</span>
            <span class="city-name">${item.trip.city}</span>
          </div>`;
        a.addEventListener('mouseenter', () => {
          a.classList.add('is-hover');
          popupImg.src = item.trip.cover;
          popup.classList.add('visible');
        });
        a.addEventListener('mouseleave', () => {
          a.classList.remove('is-hover');
          popup.classList.remove('visible');
        });
        listView.appendChild(a);
      } else {
        const div = document.createElement('div');
        div.className = 'city-item coming-soon';
        div.style.animationDelay = `${animIdx * 0.06}s`;
        div.innerHTML = `
          ${isFirst ? `<span class="year-label">${year}</span>` : ''}
          <div class="city-item-inner">
            <span class="city-name">${item.city}</span>
          </div>`;
        div.addEventListener('mouseenter', () => {
          labelEl.textContent = 'Update Soon!';
          window.setCursorState?.('has-label');
          popup.classList.remove('visible');
        });
        div.addEventListener('mouseleave', () => {
          labelEl.textContent = '';
          window.setCursorState?.('');
        });
        listView.appendChild(div);
      }

      animIdx++;
    });
  });
}

buildList();
