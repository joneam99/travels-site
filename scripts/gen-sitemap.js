#!/usr/bin/env node
// 사용법: node scripts/gen-sitemap.js
//
// data.js의 trips 목록을 읽어서 sitemap.xml을 생성합니다.
// 새 trip을 추가한 뒤 다시 실행해서 갱신하세요.

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT     = path.join(__dirname, '..');
const BASE_URL = 'https://from-j.vercel.app';

const dataSrc = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(dataSrc + '\nthis.trips = trips;', sandbox);
const trips = sandbox.trips;

const urls = [
  `${BASE_URL}/`,
  ...trips.map(t => `${BASE_URL}/trip.html?id=${t.id}`),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`✅  sitemap.xml 생성 완료 (${urls.length}개 URL)`);
