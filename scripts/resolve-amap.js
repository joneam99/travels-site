#!/usr/bin/env node
// Amap 단축 URL → 위도/경도 변환 후 data/<tripId>-coords.json 생성
// 사용법: node scripts/resolve-amap.js shanghai-2026-06
//
// 생성된 JSON은 sheets.js가 자동으로 로드하여 루트맵에 사용함

const fs   = require('fs');
const path = require('path');
const https = require('https');

const SPREADSHEET_ID = '1K1uOuPAZuaFXvWfRHTX4xeTPflV-53HsjrHK00fRfEA';

const tripId = process.argv[2];
if (!tripId) {
  console.error('사용법: node scripts/resolve-amap.js <sheet-name>');
  console.error('예시:   node scripts/resolve-amap.js shanghai-2026-06');
  process.exit(1);
}

// Amap ?p= 파라미터에서 lat/lon 추출
// 형식: ?p=POI_ID,lat,lon,name,...
function extractAmapCoords(url) {
  const m = url.match(/[?&]p=[^,]+,([0-9.]+),([0-9.]+)/);
  return m ? { lat: parseFloat(m[1]), lon: parseFloat(m[2]) } : null;
}

// URL에서 최종 리다이렉트 URL 추적 (Node.js - CORS 없음)
function resolveRedirect(url, depth = 0) {
  if (depth > 10) return Promise.resolve(url);
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : require('http');
    const req = mod.get(url, { timeout: 8000 }, res => {
      res.resume(); // body 무시
      const loc = res.headers['location'];
      if ((res.statusCode === 301 || res.statusCode === 302) && loc) {
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        resolve(resolveRedirect(next, depth + 1));
      } else {
        resolve(url);
      }
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// CSV 파싱 (멀티라인 셀 지원)
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

async function main() {
  // 시트 CSV 다운로드
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tripId)}`;
  console.log(`📥 시트 다운로드: ${tripId}`);
  const csvResp = await fetch(csvUrl);
  if (!csvResp.ok) { console.error('시트를 불러올 수 없습니다.'); process.exit(1); }
  const csvText = await csvResp.text();

  const rows = parseCSV(csvText);
  console.log(`  → ${rows.length}개 행 파싱 완료`);

  // URL 추출 및 좌표 해석
  const coords = {}; // key: surl, value: {lat, lon}
  let resolved = 0, failed = 0;

  for (const row of rows) {
    const mapsVal = row.maps || '';
    const urlMatch = mapsVal.match(/https?:\/\/\S+/);
    if (!urlMatch) continue;
    const shortUrl = urlMatch[0];
    if (!shortUrl.includes('amap.com')) continue;
    if (coords[shortUrl]) continue; // 중복 스킵

    process.stdout.write(`  해석 중: ${shortUrl.slice(0, 50)}... `);
    try {
      const finalUrl = await resolveRedirect(shortUrl);
      const c = extractAmapCoords(finalUrl);
      if (c) {
        coords[shortUrl] = c;
        console.log(`✓ ${c.lat}, ${c.lon}`);
        resolved++;
      } else {
        console.log(`✗ 좌표 없음 (${finalUrl.slice(0, 60)})`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ 오류: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✅ 완료: ${resolved}개 성공, ${failed}개 실패`);

  // data/ 디렉토리에 JSON 저장
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

  const outPath = path.join(dataDir, `${tripId}-coords.json`);
  fs.writeFileSync(outPath, JSON.stringify(coords, null, 2));
  console.log(`💾 저장됨: data/${tripId}-coords.json`);
  console.log(`\n이제 브라우저에서 상하이 페이지를 새로고침하면 지도가 표시됩니다.`);
}

main().catch(e => { console.error(e); process.exit(1); });
