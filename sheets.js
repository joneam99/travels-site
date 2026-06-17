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

// maps 컬럼 값 정규화: 고덕 공유 텍스트(한 줄 또는 여러 줄)에서 URL과 주소 추출
function normalizeMapsField(raw) {
  if (!raw) return { url: '', address: '' };

  // URL 추출 (한 줄이든 여러 줄이든 https:// 찾기)
  const urlMatch = raw.match(/https?:\/\/\S+/);
  const url = urlMatch ? urlMatch[0] : '';

  // 여러 줄 형식이면 주소 추출 (URL 아닌 줄 중 마지막 줄 = 실제 주소)
  if (raw.includes('\n')) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const nonUrlLines = lines.filter(l => !l.startsWith('http'));
    return { url, address: nonUrlLines[nonUrlLines.length - 1] || '' };
  }

  return { url, address: '' };
}

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

// 따옴표 안 줄바꿈을 올바르게 처리하는 전체-텍스트 방식 CSV 파서
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      row.push(cur.trim());
      cur = '';
    } else if (c === '\r' && !inQ) {
      // \r\n 처리: \r 스킵
    } else if (c === '\n' && !inQ) {
      row.push(cur.trim());
      if (row.some(v => v)) rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += c;
    }
  }
  // 마지막 행 처리
  row.push(cur.trim());
  if (row.some(v => v)) rows.push(row);

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(vals => {
    const obj = {};
    headers.forEach((h, j) => { obj[h] = vals[j] ?? ''; });
    return obj;
  });
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

// 주소 문자열 → 위도/경도 (Nominatim 포워드 지오코딩, sessionStorage 캐시)
async function geocodeAddress(address) {
  if (!address) return null;
  const key = `geo:${address}`;
  const hit = sessionStorage.getItem(key);
  if (hit !== null) return hit ? JSON.parse(hit) : null;

  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    );
    const data = await res.json();
    if (!data.length) { sessionStorage.setItem(key, ''); return null; }
    const result = { lat: +data[0].lat, lon: +data[0].lon };
    sessionStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    sessionStorage.setItem(key, '');
    return null;
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

  // 사전 생성된 Amap 좌표 캐시 로드 (node scripts/resolve-amap.js로 생성)
  let amapCache = {};
  try {
    const cacheResp = await fetch(`data/${tripId}-coords.json`);
    if (cacheResp.ok) amapCache = await cacheResp.json();
  } catch { /* 캐시 없으면 그냥 진행 */ }

  const geoData = await Promise.all(rows.map(async row => {
    const { url, address: amapAddress } = normalizeMapsField(row.maps);

    // 좌표: 시트 lat/lon 컬럼 우선, 없으면 Amap 캐시, 없으면 Maps URL에서 추출
    let lat = parseFloat(row.lat) || null;
    let lon = parseFloat(row.lon) || null;
    if (!lat || !lon) {
      const cached = amapCache[url];
      if (cached) { lat = cached.lat; lon = cached.lon; }
    }
    if (!lat || !lon) {
      const coords = extractCoords(url);
      if (coords) { lat = +coords.lat; lon = +coords.lon; }
    }

    // 주소: 시트 address 컬럼 > 고덕 파싱 > Maps API 순
    const address = (row.address && row.address.trim())
      ? row.address.trim()
      : amapAddress || (hasAddress ? '' : await addressFromMaps(url));

    // 좌표 여전히 없으면 주소로 자동 지오코딩 (고덕/아맵 URL은 스킵 — 중국 주소라 Nominatim 무의미)
    if ((!lat || !lon) && !url.includes('amap.com')) {
      const coords = await geocodeAddress(address);
      if (coords) { lat = coords.lat; lon = coords.lon; }
    }

    return { address, lat, lon, mapsUrl: url };
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
      return `images/${tripId}/places/${f}`;
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
      maps:     geoData[i].mapsUrl    || '',
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
