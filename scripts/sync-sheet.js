#!/usr/bin/env node
// 사용법: node scripts/sync-sheet.js <trip-id>
// 예시:   node scripts/sync-sheet.js tokyo-2026-07
//
// 구글 시트에서 해당 trip의 day/place 데이터를 읽어와서
// data.js의 days/period를 실제 값으로 "구워넣습니다" (bake).
//
// 왜 필요한가: 지금까지는 trip.html이 열릴 때마다 브라우저에서
// 구글 시트를 실시간으로 fetch해서 장소 목록을 그렸음 (days: []).
// 이러면 검색엔진 크롤러가 페이지를 봤을 때 장소 이름/설명 텍스트가
// 아직 안 채워진 빈 페이지로 보일 수 있음.
// 이 스크립트로 한 번 구워두면 data.js 자체에 텍스트가 들어있어서
// 페이지 로드 즉시(네트워크 대기 없이) 크롤러도 읽을 수 있음.
// 시트를 다시 수정했으면 이 스크립트를 다시 실행해서 갱신하세요.

const fs   = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1K1uOuPAZuaFXvWfRHTX4xeTPflV-53HsjrHK00fRfEA';
const ROOT = path.join(__dirname, '..');

const tripId = process.argv[2];
if (!tripId) {
  console.error('❌  trip ID를 입력해주세요.\n   예: node scripts/sync-sheet.js tokyo-2026-07');
  process.exit(1);
}

// ── sheets.js와 동일한 로직 (Node용으로 이식, sessionStorage → 메모리 캐시) ──

const cache = new Map();

// Nominatim 사용 정책상 식별 가능한 User-Agent 필요 (없으면 403)
const NOMINATIM_HEADERS = { 'User-Agent': 'travels-site-sync/1.0 (personal travel archive; joneam99@gmail.com)' };

function parseCSV(text) {
  const rows = [];
  let row = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      row.push(cur.trim()); cur = '';
    } else if (c === '\r' && !inQ) {
      // skip
    } else if (c === '\n' && !inQ) {
      row.push(cur.trim());
      if (row.some(v => v)) rows.push(row);
      row = []; cur = '';
    } else {
      cur += c;
    }
  }
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

function normalizeMapsField(raw) {
  if (!raw) return { url: '', address: '' };
  const urlMatch = raw.match(/https?:\/\/\S+/);
  const url = urlMatch ? urlMatch[0] : '';
  if (raw.includes('\n')) {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const nonUrlLines = lines.filter(l => !l.startsWith('http'));
    return { url, address: nonUrlLines[nonUrlLines.length - 1] || '' };
  }
  return { url, address: '' };
}

function extractCoords(url) {
  const m = (url || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { lat: m[1], lon: m[2] } : null;
}

async function fetchAddress(lat, lon) {
  const key = `addr:${lat},${lon}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`, { headers: NOMINATIM_HEADERS });
    const data = await res.json();
    const a    = data.address || {};
    const road = a.road || '';
    const num  = a.house_number || '';
    const area = a.suburb || a.city_district || '';
    const addr = [num ? `${num} ${road}` : road, area].filter(Boolean).join(', ');
    cache.set(key, addr);
    return addr;
  } catch {
    cache.set(key, '');
    return '';
  }
}

async function geocodeAddress(address) {
  if (!address) return null;
  const key = `geo:${address}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { headers: NOMINATIM_HEADERS });
    const data = await res.json();
    if (!data.length) { cache.set(key, null); return null; }
    const result = { lat: +data[0].lat, lon: +data[0].lon };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}

async function addressFromMaps(mapsUrl) {
  if (!mapsUrl) return '';
  let coords = extractCoords(mapsUrl);
  if (!coords) {
    const key = `redir:${mapsUrl}`;
    let resolved = cache.get(key);
    if (resolved === undefined) {
      try {
        const proxy = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(mapsUrl)}`;
        const res  = await fetch(proxy);
        const text = await res.text();
        const m = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        resolved = m ? `${m[1]},${m[2]}` : '';
      } catch { resolved = ''; }
      cache.set(key, resolved);
    }
    if (resolved) {
      const [lat, lon] = resolved.split(',');
      coords = { lat, lon };
    }
  }
  if (!coords) return '';
  return fetchAddress(coords.lat, coords.lon);
}

async function rowsTodays(rows, tripId) {
  const hasAddress = rows.some(r => r.address && r.address.trim());

  let amapCache = {};
  const amapCachePath = path.join(ROOT, 'data', `${tripId}-coords.json`);
  if (fs.existsSync(amapCachePath)) {
    amapCache = JSON.parse(fs.readFileSync(amapCachePath, 'utf8'));
  }

  const geoData = await Promise.all(rows.map(async row => {
    const { url, address: amapAddress } = normalizeMapsField(row.maps);

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

    const address = (row.address && row.address.trim())
      ? row.address.trim()
      : amapAddress || (hasAddress ? '' : await addressFromMaps(url));

    if ((!lat || !lon) && !url.includes('amap.com')) {
      const coords = await geocodeAddress(address);
      if (coords) { lat = coords.lat; lon = coords.lon; }
    }

    return { address, lat, lon, mapsUrl: url };
  }));

  const dateToDayNum = {};
  rows.forEach(row => {
    const day = parseInt(row.day);
    if (!isNaN(day) && row.date) dateToDayNum[row.date] = day;
  });
  [...new Set(rows.map(r => r.date).filter(Boolean))].sort()
    .forEach((date, i) => { if (!dateToDayNum[date]) dateToDayNum[date] = i + 1; });

  const byDay = {};
  const dayDates = {};
  rows.forEach((row, i) => {
    const day = parseInt(row.day) || dateToDayNum[row.date] || 1;
    if (!byDay[day]) byDay[day] = [];
    if (row.date && !dayDates[day]) dayDates[day] = row.date;

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
      day:  `DAY ${day}`,
      date: dayDates[day] || '',
      places,
    }));

  const dates = Object.values(dayDates).filter(Boolean).sort();
  let period = '';
  if (dates.length) {
    const first = dates[0];
    const last  = dates[dates.length - 1];
    if (first === last) {
      period = first;
    } else {
      const [fy, fm] = first.split('.');
      const lp = last.split('.');
      const shortLast = (lp[0] === fy && lp[1] === fm) ? lp.slice(1).join('.') : last;
      period = `${first} – ${shortLast}`;
    }
  }

  return { days, period };
}

// ── data.js 안의 특정 trip 블록에서 `key: [...]` 배열을 균형 괄호로 찾아 교체 ──
function replaceBalancedArray(text, searchFrom, key, newArrayLiteral) {
  const keyIdx = text.indexOf(`${key}: [`, searchFrom);
  if (keyIdx === -1) throw new Error(`"${key}: [" 를 찾을 수 없어요.`);
  const openIdx = text.indexOf('[', keyIdx);
  let depth = 0, i = openIdx;
  for (; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') { depth--; if (depth === 0) break; }
  }
  const closeIdx = i;
  return text.slice(0, openIdx) + newArrayLiteral + text.slice(closeIdx + 1);
}

async function main() {
  console.log(`📥  시트 다운로드: ${tripId}`);
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tripId)}`;
  const res = await fetch(csvUrl);
  if (!res.ok) { console.error('❌  시트를 불러올 수 없어요.'); process.exit(1); }
  const rows = parseCSV(await res.text());
  console.log(`  → ${rows.length}개 행 파싱 완료`);

  if (!rows.length) { console.error('❌  시트에 데이터가 없어요.'); process.exit(1); }

  const { days, period } = await rowsTodays(rows, tripId);
  console.log(`  → ${days.length}일, 총 ${days.flatMap(d => d.places).length}개 장소, 기간: ${period}`);

  const dataPath = path.join(ROOT, 'data.js');
  let data = fs.readFileSync(dataPath, 'utf8');

  const idIdx = data.indexOf(`id: '${tripId}'`);
  if (idIdx === -1) {
    console.error(`❌  data.js 에서 id: '${tripId}' 를 찾을 수 없어요.`);
    process.exit(1);
  }

  const daysLiteral = JSON.stringify(days, null, 2);
  data = replaceBalancedArray(data, idIdx, 'days', daysLiteral);

  if (period) {
    const periodPattern = new RegExp(`(id:\\s*'${tripId.replace(/-/g, '\\-')}'[\\s\\S]*?period:\\s*)'[^']*'`);
    data = data.replace(periodPattern, `$1'${period}'`);
  }

  fs.writeFileSync(dataPath, data);
  console.log(`✅  data.js 에 ${tripId} days/period 반영 완료`);
}

main().catch(e => { console.error('오류:', e.message); process.exit(1); });
