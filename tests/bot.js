const { chromium } = require('playwright');
const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const pg=await b.newPage({viewport:{width:900,height:600}});
await pg.goto('file://'+path.resolve('index.html'));
const r=await pg.evaluate(()=>{const out=[];for(let run=0;run<5;run++){const t=__tzs;t.start();
 for(let i=0;i<60*60*10;i++){const G=t.G,p=G.p;
  // bot: flee from nearest enemy cluster
  let fx=0,fy=0;for(const e of G.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<200){fx-=(e.x-p.x)/d/(d+20);fy-=(e.y-p.y)/d/(d+20);}}
  const m=Math.hypot(fx,fy)||1;window.dispatchEvent(new KeyboardEvent('keyup',{key:'a'}));
  p.x+=fx/m*p.speed/60*0.9;p.y+=fy/m*p.speed/60*0.9;
  t.update(1/60);if(t.state==='levelup')t.press('1');if(t.state==='dead')break;}
 out.push([Math.round(t.G.t),t.G.p.lvl,t.G.kills]);}return out;});
console.log(JSON.stringify(r));await b.close();})();
