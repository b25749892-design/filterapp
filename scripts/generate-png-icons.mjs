import fs from 'node:fs';
import zlib from 'node:zlib';

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
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function writePNG(width, height, getPixel) {
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const toCrc = Buffer.concat([typeBuf, data]);
    const crcVal = crc32(toCrc);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawWaterFilterIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates to -1 to 1
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Background color #090e17 -> #131c2e gradient
  const bgR = Math.round(9 + (19 - 9) * ((ny + 1) / 2));
  const bgG = Math.round(14 + (28 - 14) * ((ny + 1) / 2));
  const bgB = Math.round(23 + (46 - 23) * ((ny + 1) / 2));

  // Droplet scale
  const scale = isMaskable ? 0.72 : 0.85;
  const dx = nx / scale;
  const dy = (ny + 0.08) / scale;

  // Water droplet implicit geometry approximation:
  // Circular bottom centered around (0, 0.25) radius 0.48
  // Tapered top towards (0, -0.65)
  const distCircle = Math.sqrt(dx * dx + (dy - 0.2) * (dy - 0.2));
  let insideDrop = false;

  if (dy >= 0.2 && distCircle <= 0.48) {
    insideDrop = true;
  } else if (dy < 0.2 && dy >= -0.65) {
    const taperRatio = (0.2 - dy) / 0.85;
    const maxWidth = 0.48 * (1 - taperRatio * 0.95);
    if (Math.abs(dx) <= maxWidth) {
      insideDrop = true;
    }
  }

  if (insideDrop) {
    // Water gradient: #38bdf8 to #0284c7
    const t = Math.max(0, Math.min(1, (dy + 0.65) / 1.3));
    let r = Math.round(56 + (2 - 56) * t);
    let g = Math.round(189 + (132 - 189) * t);
    let b = Math.round(248 + (199 - 248) * t);

    // Droplet highlight shine on upper left
    if (dx < -0.06 && dx > -0.32 && dy > -0.2 && dy < 0.3) {
      const shine = Math.max(0, 1 - Math.abs(dx + 0.2) * 8 - Math.abs(dy - 0.05) * 4);
      r = Math.min(255, Math.round(r + shine * 140));
      g = Math.min(255, Math.round(g + shine * 140));
      b = 255;
    }

    // Filter ripple lines (horizontal stripes)
    const stripe1 = Math.abs(dy - 0.15) < 0.025 && Math.abs(dx) < 0.35;
    const stripe2 = Math.abs(dy - 0.30) < 0.022 && Math.abs(dx) < 0.30;
    const stripe3 = Math.abs(dy - 0.45) < 0.018 && Math.abs(dx) < 0.22;
    if (stripe1 || stripe2 || stripe3) {
      r = Math.min(255, r + 70);
      g = Math.min(255, g + 70);
      b = 255;
    }

    return [r, g, b, 255];
  }

  // Soft glow around droplet
  const distCenter = Math.sqrt(dx * dx + dy * dy);
  if (distCenter < 0.75) {
    const glow = (1 - distCenter / 0.75) * 0.35;
    const r = Math.round(bgR + 56 * glow);
    const g = Math.round(bgG + 189 * glow);
    const b = Math.round(bgB + 248 * glow);
    return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
  }

  return [bgR, bgG, bgB, 255];
}

const icons = [
  { file: 'public/pwa-192x192.png', size: 192, maskable: false },
  { file: 'public/pwa-512x512.png', size: 512, maskable: false },
  { file: 'public/apple-touch-icon.png', size: 180, maskable: false },
  { file: 'public/pwa-maskable-512x512.png', size: 512, maskable: true },
];

for (const icon of icons) {
  const buf = writePNG(icon.size, icon.size, (x, y, w, h) =>
    drawWaterFilterIcon(x, y, w, h, icon.maskable)
  );
  fs.writeFileSync(icon.file, buf);
  console.log(`Generated ${icon.file} (${icon.size}x${icon.size})`);
}
