#!/usr/bin/env node
// 사용법:
//   npm install sharp
//   node scripts/convert-webp.js
//
// images/ 폴더의 JPG/PNG를 WebP로 변환하고 data.js 경로를 자동 업데이트합니다.
// 원본 파일은 변환 후 삭제됩니다.

const path = require('path');
const fs   = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('\n❌  sharp가 설치되지 않았어요. 먼저 실행하세요:\n    npm install sharp\n');
  process.exit(1);
}

const ROOT       = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const QUALITY    = 82;   // WebP 품질 (0-100), 80-85가 육안 무손실 구간
const MAX_PX     = 2000; // 가로/세로 최대 px (초과 시 비율 유지 축소)
const EXTS       = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);

function walk(dir) {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory())                                    out.push(...walk(p));
    else if (EXTS.has(path.extname(item.name).toLowerCase())) out.push(p);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`\n❌  images/ 폴더를 찾을 수 없어요: ${IMAGES_DIR}\n`);
    process.exit(1);
  }

  const files = walk(IMAGES_DIR);
  if (files.length === 0) {
    console.log('\n변환할 이미지가 없어요.\n');
    return;
  }

  console.log(`\n이미지 ${files.length}장 변환 시작 (WebP ${QUALITY}%, 최대 ${MAX_PX}px)\n`);

  let totalOrig = 0, totalNew = 0, errors = 0;

  for (const src of files) {
    const ext      = path.extname(src);
    const dest     = src.slice(0, -ext.length) + '.webp';
    const origSize = fs.statSync(src).size;
    const rel      = path.relative(IMAGES_DIR, src);

    try {
      // 이미 .webp로 변환된 파일이 있으면 스킵
      if (fs.existsSync(dest)) {
        console.log(`  ⏭   ${rel}  (이미 변환됨)`);
        continue;
      }

      const pipeline      = sharp(src).rotate(); // EXIF 회전 자동 적용
      const { width, height } = await pipeline.metadata();
      const needsResize   = Math.max(width, height) > MAX_PX;

      if (needsResize) {
        pipeline.resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true });
      }

      const { size: newSize } = await pipeline.webp({ quality: QUALITY }).toFile(dest);
      fs.unlinkSync(src);

      totalOrig += origSize;
      totalNew  += newSize;

      const saved   = ((1 - newSize / origSize) * 100).toFixed(0);
      const sizeStr = `${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB  (-${saved}%)`;
      const tag     = needsResize ? `  [${width}×${height} 축소]` : '';
      console.log(`  ✅  ${rel}${tag}\n      ${sizeStr}`);
    } catch (err) {
      console.error(`  ❌  ${rel}: ${err.message}`);
      errors++;
    }
  }

  // data.js 경로 업데이트 (.jpg/.jpeg/.png → .webp)
  const dataPath = path.join(ROOT, 'data.js');
  if (fs.existsSync(dataPath)) {
    const updated = fs.readFileSync(dataPath, 'utf8')
      .replace(/\.(jpg|jpeg|png)(?=['"])/gi, '.webp');
    fs.writeFileSync(dataPath, updated);
  }

  const totalSaved = ((1 - totalNew / totalOrig) * 100).toFixed(0);
  console.log(`\n${'━'.repeat(46)}`);
  console.log(`완료: ${files.length - errors}장 변환${errors ? `  (실패 ${errors}장)` : ''}`);
  console.log(`용량: ${(totalOrig / 1024 / 1024).toFixed(1)}MB → ${(totalNew / 1024 / 1024).toFixed(1)}MB  (-${totalSaved}%)`);
  console.log(`data.js 경로 업데이트 완료  (.jpg → .webp)\n`);
}

main().catch(err => {
  console.error('\n오류:', err.message);
  process.exit(1);
});
