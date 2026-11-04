import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const html = `<body style="margin:0;background:#15181f;display:flex;gap:26px;padding:34px;align-items:flex-end;font-family:system-ui">
<div style="text-align:center"><img src="${b64('assets/icons/512x512.png')}" width="200" style="border-radius:44px"><div style="color:#7a8496;font-size:11px;margin-top:12px">512</div></div>
<div style="text-align:center"><img src="${b64('assets/icons/128x128.png')}" width="96" style="border-radius:22px"><div style="color:#7a8496;font-size:11px;margin-top:12px">128</div></div>
<div style="text-align:center"><img src="${b64('assets/icons/64x64.png')}" width="64"><div style="color:#7a8496;font-size:11px;margin-top:12px">64</div></div>
<div style="text-align:center"><img src="${b64('assets/icons/48x48.png')}" width="48"><div style="color:#7a8496;font-size:11px;margin-top:12px">48</div></div>
<div style="text-align:center"><img src="${b64('assets/icons/32x32.png')}" width="32"><div style="color:#7a8496;font-size:11px;margin-top:12px">32</div></div>
<div style="text-align:center"><img src="${b64('assets/icons/16x16.png')}" width="16"><div style="color:#7a8496;font-size:11px;margin-top:12px">16</div></div>
</body>`;
const b = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--mute-audio', '--no-sandbox'],defaultViewport:{width:640,height:300,deviceScaleFactor:2}});
const p = await b.newPage();
await p.setContent(html,{waitUntil:'networkidle0'});
await new Promise(r=>setTimeout(r,300));
await p.screenshot({path:'design/icon-preview.png'});
await b.close();
