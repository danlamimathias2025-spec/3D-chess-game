import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function generatePNG(width, height, renderPixel) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawLines = Buffer.alloc(height * (width * 4 + 1));
  let idx = 0;

  for (let y = 0; y < height; y++) {
    rawLines[idx++] = 0; // filter byte: None
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const [r, g, b, a] = renderPixel(nx, ny, width, height, x, y);
      rawLines[idx++] = Math.min(255, Math.max(0, Math.round(r)));
      rawLines[idx++] = Math.min(255, Math.max(0, Math.round(g)));
      rawLines[idx++] = Math.min(255, Math.max(0, Math.round(b)));
      rawLines[idx++] = Math.min(255, Math.max(0, Math.round(a)));
    }
  }

  const idatCompressed = zlib.deflateSync(rawLines, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function renderWizardChessIcon(nx, ny, w, h, px, py, isMaskable = false) {
  // Center padding for maskable
  let cx = nx - 0.5;
  let cy = ny - 0.5;
  
  if (isMaskable) {
    // Scale down central art to fit safe zone
    cx /= 0.75;
    cy /= 0.75;
  }

  const distFromCenter = Math.sqrt(cx * cx + cy * cy);
  
  // Base dark background gradient
  let r = 10 + (1 - distFromCenter * 1.5) * 15;
  let g = 12 + (1 - distFromCenter * 1.5) * 20;
  let b = 20 + (1 - distFromCenter * 1.5) * 30;
  let a = 255;

  // Outer gold frame border
  const cornerR = isMaskable ? 0 : 0.18;
  const absX = Math.abs(nx - 0.5);
  const absY = Math.abs(ny - 0.5);
  if (!isMaskable && (absX > 0.46 || absY > 0.46) && absX < 0.49 && absY < 0.49) {
    r = 212; g = 175; b = 55;
  }

  // Gothic Arch background shape
  const archX = cx * 2; // -1 to 1
  const archY = cy * 2; // -1 to 1
  const archTop = -0.6 + Math.pow(Math.abs(archX), 1.6) * 0.5;
  if (archY > archTop && archY < 0.6 && Math.abs(archX) < 0.6) {
    // Arch glow gradient
    const archFactor = (0.6 - archY);
    r += 60 * archFactor;
    g += 30 * archFactor;
    b += 120 * archFactor;
  }

  // Central Knight/King Pawn Silhouette & Crown
  const pX = cx * 2;
  const pY = cy * 2;

  // Base of piece
  if (pY >= 0.4 && pY <= 0.65 && Math.abs(pX) <= 0.4 + (pY - 0.4) * 0.3) {
    r = 245; g = 215; b = 110;
  }
  // Neck and head
  const headDist = Math.sqrt(pX * pX + (pY - (-0.05)) * (pY - (-0.05)));
  if (headDist <= 0.28) {
    r = 230; g = 190; b = 70;
  }
  // Spikes of crown
  if (pY >= -0.45 && pY <= -0.2 && Math.abs(pX) <= 0.35) {
    const spike = Math.sin(pX * 25) * 0.1 - 0.3;
    if (pY > spike) {
      r = 245; g = 215; b = 110;
    }
  }

  // Glowing cyan/blue eye orb
  const eyeDist = Math.sqrt((pX - (-0.08)) * (pX - (-0.08)) + (pY - (-0.08)) * (pY - (-0.08)));
  if (eyeDist <= 0.06) {
    r = 78; g = 168; b = 222;
    if (eyeDist <= 0.025) {
      r = 255; g = 255; b = 255;
    }
  }

  // Sparkles
  const sp1 = Math.sqrt((pX - 0.45) * (pX - 0.45) + (pY - (-0.35)) * (pY - (-0.35)));
  if (sp1 < 0.04) { r = 255; g = 235; b = 150; }
  const sp2 = Math.sqrt((pX - (-0.45)) * (pX - (-0.45)) + (pY - 0.3) * (pY - 0.3));
  if (sp2 < 0.03) { r = 78; g = 168; b = 222; }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

fs.writeFileSync(
  path.join(publicDir, 'pwa-192x192.png'),
  generatePNG(192, 192, (nx, ny, w, h, px, py) => renderWizardChessIcon(nx, ny, w, h, px, py, false))
);

fs.writeFileSync(
  path.join(publicDir, 'pwa-512x512.png'),
  generatePNG(512, 512, (nx, ny, w, h, px, py) => renderWizardChessIcon(nx, ny, w, h, px, py, false))
);

fs.writeFileSync(
  path.join(publicDir, 'pwa-maskable-512x512.png'),
  generatePNG(512, 512, (nx, ny, w, h, px, py) => renderWizardChessIcon(nx, ny, w, h, px, py, true))
);

fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon.png'),
  generatePNG(180, 180, (nx, ny, w, h, px, py) => renderWizardChessIcon(nx, ny, w, h, px, py, false))
);

console.log('All PWA icons successfully generated.');
