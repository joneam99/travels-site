// ── GOOGLE SHEETS CONFIG ─────────────────────────────────
// 1. 스프레드시트를 "링크 있는 사람 보기" 공개로 설정
// 2. URL에서 /d/ 뒤의 ID를 복사해서 아래에 붙여넣기
//    예: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit
const SPREADSHEET_ID = '1K1uOuPAZuaFXvWfRHTX4xeTPflV-53HsjrHK00fRfEA';

// ── SPREADSHEET 구조 ──────────────────────────────────────
// 탭 이름 = trip ID (예: "taipei-2026-04")
//
// 컬럼 순서 (첫 행 = 헤더):
//   day | date | name | category | address | lat | lon | desc | maps
//
// day: 1, 2, 3 ... (DAY 1, DAY 2 그룹핑용)
// lat / lon: 위도/경도 (지도 표시용, 소수점 4자리 권장)
// 행 순서 = 사진 순서 (1행 → 01.jpg, 2행 → 02.jpg ...)
// category: Food / Cafe / Bar / Shop / Sight

async function fetchSheet(sheetName) {
  if (!SPREADSHEET_ID) return null;

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`
            + `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    return parseCSV(text);
  } catch (e) {
    console.warn('[Sheets] fetch failed:', e.message);
    return null;
  }
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.every(v => !v)) continue;
    const obj = {};
    headers.forEach((h, j) => { obj[h] = vals[j] ?? ''; });
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// ── ADDRESS AUTO-EXTRACTION ───────────────────────────────
// Maps 전체 URL에서 @lat,lon 좌표 추출
function extractCoords(url) {
  const m = (url || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { lat: m[1], lon: m[2] } : null;
}

// Nominatim 역지오코딩 (sessionStorage 캐시)
async function fetchAddress(lat, lon) {
  const key = `addr:${lat},${lon}`;
  const hit = sessionStorage.getItem(key);
  if (hit !== null) return hit;

  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
    );
    const data = await res.json();
    const a    = data.address || {};
    const road = a.road || '';
    const num  = a.house_number || '';
    const area = a.suburb || a.city_district || '';
    const addr = [num ? `${num} ${road}` : road, area].filter(Boolean).join(', ');
    sessionStorage.setItem(key, addr);
    return addr;
  } catch {
    sessionStorage.setItem(key, '');
    return '';
  }
}

// Maps URL에서 주소 가져오기 (캐시 우선)
// 짧은 URL(maps.app.goo.gl)도 프록시로 리다이렉트 따라가서 좌표 추출
async function addressFromMaps(mapsUrl) {
  if (!mapsUrl) return '';

  // 1. URL에 좌표가 바로 있으면 그대로 사용
  let coords = extractCoords(mapsUrl);

  // 2. 짧은 URL이면 프록시로 최종 URL 가져와서 좌표 추출
  if (!coords) {
    const cacheKey = `redir:${mapsUrl}`;
    const cached = sessionStorage.getItem(cacheKey);
    const resolved = cached !== null ? cached : await (async () => {
      try {
        const proxy = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(mapsUrl)}`;
        const res  = await fetch(proxy);
        const text = await res.text();
        const m = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const val = m ? `${m[1]},${m[2]}` : '';
        sessionStorage.setItem(cacheKey, val);
        return val;
      } catch { return ''; }
    })();
    if (resolved) {
      const [lat, lon] = resolved.split(',');
      coords = { lat, lon };
    }
  }

  if (!coords) return '';
  return fetchAddress(coords.lat, coords.lon);
}

// ── SHEET ROWS → TRIP DAYS ────────────────────────────────
// 시트 컬럼: day | name | category | desc | maps | photo
//   photo: 파일명 (확장자 있어도 없어도 OK)
//          예) 06  /  06.jpg  /  pharos-coffee.jpg
//   address 컬럼 불필요 — maps URL에서 자동 추출
async function rowsTodays(rows, tripId) {
  // address 컬럼이 있으면 API 호출 없이 바로 사용
  const hasAddress = rows.some(r => r.address && r.address.trim());

  const geoData = await Promise.all(rows.map(async row => {
    const url = row.maps || '';
    // 좌표: 시트 lat/lon 컬럼 우선, 없으면 Maps URL에서 추출
    let lat = parseFloat(row.lat) || null;
    let lon = parseFloat(row.lon) || null;
    if (!lat || !lon) {
      const coords = extractCoords(url);
      if (coords) { lat = +coords.lat; lon = +coords.lon; }
    }

    // 주소: 시트 address 컬럼 우선, 없으면 기존 API 방식
    const address = hasAddress
      ? (row.address || '').trim()
      : await addressFromMaps(url);

    return { address, lat, lon };
  }));

  // date 기준으로 day 번호 매핑 (day 컬럼이 비어있는 행 처리)
  const dateToDayNum = {};
  rows.forEach(row => {
    const day = parseInt(row.day);
    if (!isNaN(day) && row.date) dateToDayNum[row.date] = day;
  });
  // 명시된 day 없는 날짜는 날짜 순서로 번호 부여
  [...new Set(rows.map(r => r.date).filter(Boolean))].sort()
    .forEach((date, i) => { if (!dateToDayNum[date]) dateToDayNum[date] = i + 1; });

  const byDay = {};
  const dayDates = {};
  rows.forEach((row, i) => {
    const day = parseInt(row.day) || dateToDayNum[row.date] || 1;
    if (!byDay[day]) byDay[day] = [];
    if (row.date && !dayDates[day]) dayDates[day] = row.date;

    // photo 컬럼: 콤마 구분으로 여러 장 가능 (최대 2장)
    const toPath = fn => {
      const f = fn.trim();
      if (!f) return null;
      const file = f.includes('.')
        ? f.replace(/\.(jpg|jpeg|png)$/i, '.webp')
        : `${f}.webp`;
      return `images/${tripId}/places/${file}`;
    };
    const photoVal = (row.photo || '').trim();
    const photos = photoVal
      ? photoVal.split(',').map(toPath).filter(Boolean)
      : [`images/${tripId}/places/${String(i + 1).padStart(2, '0')}.webp`];

    byDay[day].push({
      name:     row.name              || '',
      category: row.category          || '',
      address:  geoData[i].address    || '',
      lat:      geoData[i].lat,
      lon:      geoData[i].lon,
      desc:     row.desc              || '',
      maps:     row.maps              || '',
      photo:    photos[0],
      photos,
    });
  });

  const days = Object.entries(byDay)
    .sort(([a], [b]) => a - b)
    .map(([day, places]) => ({
      day:    `DAY ${day}`,
      date:   dayDates[day] || '',
      places,
    }));

  // 시작/끝 날짜로 period 자동 계산
  const dates = Object.values(dayDates).filter(Boolean).sort();
  let period = '';
  if (dates.length) {
    const first = dates[0];
    const last  = dates[dates.length - 1];
    if (first === last) {
      period = first;
    } else {
      // 같은 연.월이면 뒤쪽 날짜에서 연.월 생략 (예: 2026.02.14 – 02.18)
      const [fy, fm] = first.split('.');
      const lp = last.split('.');
      const shortLast = (lp[0] === fy && lp[1] === fm) ? lp.slice(1).join('.') : last;
      period = `${first} – ${shortLast}`;
    }
  }

  return { days, period };
}
