/**
 * 从 design/icon.svg 生成桌面端（Windows .ico）与网页所需的全部图标资源。
 * 依赖 puppeteer-core + 本机 Chrome。
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = process.cwd();
const SVG = fs.readFileSync(path.join(ROOT, 'design/icon.svg'), 'utf8');
const OUT = path.join(ROOT, 'assets/icons');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
  defaultViewport: { width: 1200, height: 1200, deviceScaleFactor: 1 },
});
const page = await browser.newPage();

const png = {};
for (const size of SIZES) {
  const html = `<!doctype html><html><body style="margin:0;background:transparent">
    <div style="width:${size}px;height:${size}px;overflow:hidden">${
      SVG.replace(/width="512" height="512"/, `width="${size}" height="${size}"`)
    }</div></body></html>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const buf = await page.screenshot({
    type: 'png',
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  png[size] = buf;
  fs.writeFileSync(path.join(OUT, `${size}x${size}.png`), buf);
  process.stdout.write(`${size} `);
}
await browser.close();
console.log('\nPNG 完成');

/* -------- Tauri 命名约定 -------- */
fs.writeFileSync(path.join(OUT, '128x128@2x.png'), png[256]);
fs.writeFileSync(path.join(OUT, 'icon.png'), png[512]);
fs.writeFileSync(path.join(OUT, 'Square30x30Logo.png'), png[32]);
fs.writeFileSync(path.join(OUT, 'Square44x44Logo.png'), png[48]);
fs.writeFileSync(path.join(OUT, 'Square71x71Logo.png'), png[64]);
fs.writeFileSync(path.join(OUT, 'Square89x89Logo.png'), png[128]);
fs.writeFileSync(path.join(OUT, 'Square107x107Logo.png'), png[128]);
fs.writeFileSync(path.join(OUT, 'Square142x142Logo.png'), png[256]);
fs.writeFileSync(path.join(OUT, 'Square150x150Logo.png'), png[256]);
fs.writeFileSync(path.join(OUT, 'Square284x284Logo.png'), png[512]);
fs.writeFileSync(path.join(OUT, 'Square310x310Logo.png'), png[512]);
fs.writeFileSync(path.join(OUT, 'StoreLogo.png'), png[64]);
fs.writeFileSync(path.join(OUT, 'icon_32.png'), png[32]);

/* -------- ICO（PNG 内嵌，Vista+ 支持） -------- */
function buildICO(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + count * 16;
  const bodies = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    bodies.push(data);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...bodies]);
}

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
fs.writeFileSync(
  path.join(OUT, 'icon.ico'),
  buildICO(icoSizes.map(s => ({ size: s, data: png[s] })))
);
console.log('ICO 完成', fs.statSync(path.join(OUT, 'icon.ico')).size, 'bytes');

/* -------- ICNS（PNG 内嵌） -------- */
function buildICNS(images) {
  const chunks = [];
  for (const { type, size } of images) {
    const d = png[size];
    const head = Buffer.alloc(8);
    head.write(type, 0, 4, 'ascii');
    head.writeUInt32BE(d.length + 8, 4);
    chunks.push(head, d);
  }
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(8);
  head.write('icns', 0, 4, 'ascii');
  head.writeUInt32BE(body.length + 8, 4);
  return Buffer.concat([head, body]);
}

fs.writeFileSync(
  path.join(OUT, 'icon.icns'),
  buildICNS([
    { type: 'ic07', size: 128 },
    { type: 'ic08', size: 256 },
    { type: 'ic09', size: 512 },
    { type: 'ic10', size: 1024 },
    { type: 'ic11', size: 32 },
    { type: 'ic12', size: 64 },
    { type: 'ic13', size: 256 },
    { type: 'ic14', size: 512 },
  ])
);
console.log('ICNS 完成', fs.statSync(path.join(OUT, 'icon.icns')).size, 'bytes');

/* -------- Web favicon -------- */
fs.copyFileSync(path.join(ROOT, 'design/icon.svg'), path.join(ROOT, 'public/favicon.svg'));
fs.writeFileSync(path.join(ROOT, 'public/favicon-32.png'), png[32]);
console.log('favicon 完成');
