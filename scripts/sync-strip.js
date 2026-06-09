#!/usr/bin/env node
// 사용법: node scripts/sync-strip.js [trip-id]
// 예시:   node scripts/sync-strip.js taipei-2026-04
//
// strip/ 폴더의 이미지 파일을 읽어서 data.js photos 배열을 자동 업데이트합니다.
// 파일명 순서 = 스트립 순서 (01.jpg → 첫 번째)

const fs   = require('fs');
const path = require('path');

const tripId = process.argv[2];
if (!tripId) {
  console.error('❌  trip ID를 입력해주세요.\n   예: node scripts/sync-strip.js taipei-2026-04');
  process.exit(1);
}

const stripDir = path.join(__dirname, '..', 'images', tripId, 'strip');
if (!fs.existsSync(stripDir)) {
  console.error(`❌  폴더를 찾을 수 없어요: ${stripDir}`);
  process.exit(1);
}

// 이미지 파일 목록 (이름순 정렬)
const exts  = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const files = fs.readdirSync(stripDir)
  .filter(f => exts.has(path.extname(f).toLowerCase()))
  .sort()
  .map(f => `images/${tripId}/strip/${f}`);

if (files.length === 0) {
  console.error(`❌  ${stripDir} 에 이미지가 없어요.`);
  process.exit(1);
}

// data.js 읽기
const dataPath = path.join(__dirname, '..', 'data.js');
let data = fs.readFileSync(dataPath, 'utf8');

// 해당 trip의 photos 배열 교체
// id: 'taipei-2026-04' ... photos: [ ... ] 블록을 찾아서 교체
const photosStr = files.map(f => `      '${f}'`).join(',\n');
const newBlock  = `photos: [\n${photosStr},\n    ]`;

// id: 'taipei-2026-04' 이후의 photos: [ ... ] 를 교체
const idPattern = new RegExp(
  `(id:\\s*'${tripId.replace(/-/g, '\\-')}'[\\s\\S]*?)(photos:\\s*\\[[\\s\\S]*?\\])`,
  'm'
);

if (!idPattern.test(data)) {
  console.error(`❌  data.js 에서 id: '${tripId}' 를 찾을 수 없어요.`);
  process.exit(1);
}

data = data.replace(idPattern, `$1${newBlock}`);
fs.writeFileSync(dataPath, data, 'utf8');

console.log(`✅  ${tripId} 스트립 업데이트 완료! (${files.length}장)`);
files.forEach((f, i) => console.log(`   ${String(i+1).padStart(2,'0')}. ${path.basename(f)}`));
