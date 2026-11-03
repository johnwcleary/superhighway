// Generates public/og.png (1200×630): the accent colour with the wordmark
// centred at 2× (bilinear). No dependencies; run with `node scripts/make-og.mjs`
// whenever public/wordmark-green.png changes, then commit the result.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

const SRC = new URL('../public/wordmark-green.png', import.meta.url);
const OUT = new URL('../public/og.png', import.meta.url);
const W = 1200;
const H = 630;
const SCALE = 2;
const BG = [0x21, 0x9d, 0x50]; // --accent, matches the wordmark's own fill

function decodePng(buf) {
  let pos = 8;
  let width, height, colorType;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error('need 8-bit, non-interlaced PNG');
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    pos += 12 + len;
  }
  const bpp = { 2: 3, 6: 4 }[colorType];
  if (!bpp) throw new Error(`unsupported PNG colour type ${colorType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = (line[x] + pred) & 0xff;
    }
  }
  // Normalise to RGB, compositing any alpha over the background colour.
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const alpha = bpp === 4 ? px[i * 4 + 3] / 255 : 1;
    for (let k = 0; k < 3; k++) {
      rgb[i * 3 + k] = Math.round(px[i * bpp + k] * alpha + BG[k] * (1 - alpha));
    }
  }
  return { width, height, rgb };
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const raw = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const src = decodePng(readFileSync(SRC));
const dw = src.width * SCALE;
const dh = src.height * SCALE;
const ox = Math.round((W - dw) / 2);
const oy = Math.round((H - dh) / 2);
const out = Buffer.alloc(W * H * 3);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    const dx = x - ox;
    const dy = y - oy;
    if (dx < 0 || dy < 0 || dx >= dw || dy >= dh) {
      out.set(BG, o);
      continue;
    }
    // Bilinear sample at the source pixel centre.
    const sx = Math.min(Math.max((dx + 0.5) / SCALE - 0.5, 0), src.width - 1);
    const sy = Math.min(Math.max((dy + 0.5) / SCALE - 0.5, 0), src.height - 1);
    const x0 = Math.floor(sx), y0 = Math.floor(sy);
    const x1 = Math.min(x0 + 1, src.width - 1), y1 = Math.min(y0 + 1, src.height - 1);
    const fx = sx - x0, fy = sy - y0;
    for (let k = 0; k < 3; k++) {
      const p = (xx, yy) => src.rgb[(yy * src.width + xx) * 3 + k];
      const top = p(x0, y0) * (1 - fx) + p(x1, y0) * fx;
      const bottom = p(x0, y1) * (1 - fx) + p(x1, y1) * fx;
      out[o + k] = Math.round(top * (1 - fy) + bottom * fy);
    }
  }
}

writeFileSync(OUT, encodePng(W, H, out));
console.log(`wrote ${OUT.pathname} (${W}×${H})`);
