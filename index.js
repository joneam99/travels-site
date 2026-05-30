const listView   = document.getElementById('list-view');
const gridView   = document.getElementById('grid-view');
const btnList    = document.getElementById('btn-list');
const btnGrid    = document.getElementById('btn-grid');
const popup      = document.getElementById('preview-popup');
const popupImg   = document.getElementById('preview-img');

function buildList() {
  trips.forEach((trip, i) => {
    const a = document.createElement('a');
    a.href = `trip.html?id=${trip.id}`;
    a.className = 'city-item';
    a.style.animationDelay = `${i * 0.06}s`;
    a.innerHTML = `
      <div class="city-item-inner">
        <span class="city-country">${trip.country}</span>
        <span class="city-name">${trip.city}</span>
        <span class="city-date">${trip.date}</span>
      </div>`;

    a.addEventListener('mouseenter', () => {
      a.classList.add('is-hover');
      popupImg.src = trip.cover;
      popup.classList.add('visible');
    });
    a.addEventListener('mouseleave', () => {
      a.classList.remove('is-hover');
      popup.classList.remove('visible');
    });
    listView.appendChild(a);
  });
}

function buildGrid() {
  trips.forEach(trip => {
    const a = document.createElement('a');
    a.href = `trip.html?id=${trip.id}`;
    a.className = 'grid-card';
    a.innerHTML = `
      <img src="${trip.cover}" alt="${trip.city}" loading="lazy">
      <div class="grid-card-info">
        <div class="grid-city">${trip.city}</div>
        <div class="grid-period">${trip.period}</div>
      </div>`;
    gridView.appendChild(a);
  });
}

btnList.addEventListener('click', () => {
  listView.classList.add('active');    gridView.classList.remove('active');
  btnList.classList.add('active');     btnGrid.classList.remove('active');
  popup.classList.remove('visible');
});

btnGrid.addEventListener('click', () => {
  gridView.classList.add('active');    listView.classList.remove('active');
  btnGrid.classList.add('active');     btnList.classList.remove('active');
  popup.classList.remove('visible');
});

buildList();
buildGrid();
