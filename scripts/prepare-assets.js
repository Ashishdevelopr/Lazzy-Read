#!/usr/bin/env node
/**
 * Copies build-time assets that cannot be committed to git:
 * - pdf.js worker (1.2MB binary) from node_modules -> public/
 * - PWA icons (generated programmatically)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');

// 1. Copy pdf.js worker
const workerSrc = path.join(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const workerDst = path.join(root, 'public/pdf.worker.min.mjs');

if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, workerDst);
  const size = (fs.statSync(workerDst).size / 1024).toFixed(0);
  console.log(`✓ Copied pdf.worker.min.mjs (${size} KB)`);
} else {
  console.warn('⚠ pdfjs-dist worker not found — run npm install first');
}

// 2. Generate PWA icons
const iconsDir = path.join(root, 'public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function makePng(size, r, g, b) {
  const chunk = (type, data) => {
    const typeB = Buffer.from(type);
    const lenB = Buffer.alloc(4);
    lenB.writeUInt32BE(data.length);
    const crc32 = require('zlib').crc32
      ? require('zlib').crc32(Buffer.concat([typeB, data]))
      : calcCrc32(Buffer.concat([typeB, data]));
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc32 >>> 0);
    return Buffer.concat([lenB, typeB, data, crcB]);
  };

  const calcCrc32 = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    return (buf) => {
      let crc = 0xffffffff;
      for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
      return (crc ^ 0xffffffff) >>> 0;
    };
  })();

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(2, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const row = Buffer.alloc(1 + size * 3);
  row[0] = 0;
  for (let i = 0; i < size; i++) {
    row[1 + i * 3] = r;
    row[2 + i * 3] = g;
    row[3 + i * 3] = b;
  }
  const rawData = Buffer.concat(Array(size).fill(row));
  const compressed = zlib.deflateSync(rawData);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ICON_COLOR = [99, 102, 241];
const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of icons) {
  const dst = path.join(iconsDir, name);
  if (!fs.existsSync(dst)) {
    fs.writeFileSync(dst, makePng(size, ...ICON_COLOR));
    console.log(`✓ Generated ${name}`);
  }
}

console.log('Assets ready.');
