const QRCode = require('qrcode');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function test() {
  const size = 1200;
  const qr = QRCode.create('https://rosapasionclub.com', { errorCorrectionLevel: 'H' });
  const matrix = qr.modules;
  const modCount = matrix.size;
  const margin = 4;
  const totalMods = modCount + margin * 2;
  const modSize = size / totalMods;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="100%" height="100%" fill="#FFFFFF" rx="32"/>`;

  // Center area to clear for logo: middle 28%
  const centerSize = Math.floor(modCount * 0.28);
  const centerStart = Math.floor((modCount - centerSize) / 2);
  const centerEnd = centerStart + centerSize;

  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd) {
        continue;
      }
      const isTopLeftFinder = r < 7 && c < 7;
      const isTopRightFinder = r < 7 && c >= modCount - 7;
      const isBottomLeftFinder = r >= modCount - 7 && c < 7;

      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
        continue;
      }

      if (matrix.get(r, c)) {
        const x = (c + margin) * modSize;
        const y = (r + margin) * modSize;
        const dotR = modSize * 0.45;
        svg += `<rect x="${x + 0.4}" y="${y + 0.4}" width="${modSize - 0.8}" height="${modSize - 0.8}" rx="${dotR}" fill="#0D0D0D"/>`;
      }
    }
  }

  function drawFinder(row, col) {
    const x = (col + margin) * modSize;
    const y = (row + margin) * modSize;
    const w = 7 * modSize;
    const rOuter = modSize * 2.2;
    const rInner = modSize * 1.2;

    svg += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${rOuter}" fill="#0D0D0D"/>`;
    const gapX = x + modSize;
    const gapY = y + modSize;
    const gapW = 5 * modSize;
    svg += `<rect x="${gapX}" y="${gapY}" width="${gapW}" height="${gapW}" rx="${rOuter * 0.75}" fill="#FFFFFF"/>`;
    const eyeX = x + 2 * modSize;
    const eyeY = y + 2 * modSize;
    const eyeW = 3 * modSize;
    svg += `<rect x="${eyeX}" y="${eyeY}" width="${eyeW}" height="${eyeW}" rx="${rInner}" fill="#0D0D0D"/>`;
  }

  drawFinder(0, 0);
  drawFinder(0, modCount - 7);
  drawFinder(modCount - 7, 0);

  // Center white badge
  const badgeX = (centerStart + margin - 0.5) * modSize;
  const badgeY = (centerStart + margin - 0.5) * modSize;
  const badgeW = (centerSize + 1) * modSize;
  svg += `<rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeW}" rx="${modSize * 1.6}" fill="#FFFFFF" stroke="#F5ECE1" stroke-width="2"/>`;

  svg += `</svg>`;

  const qrPng = await sharp(Buffer.from(svg)).png().toBuffer();
  
  const logoW = Math.round(badgeW * 0.85);
  const logoH = Math.round(badgeW * 0.85);
  const logoResized = await sharp(path.resolve('public/logo-vertical.png'))
    .resize(logoW, logoH, { fit: 'inside' })
    .toBuffer();

  const finalPng = await sharp(qrPng)
    .composite([{ input: logoResized, gravity: 'center' }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.resolve('public/qr-rosapasionclub.png'), finalPng);
  console.log('Saved qr-rosapasionclub.png successfully!');
}

test().catch(console.error);
