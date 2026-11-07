import {execFileSync} from 'node:child_process';import {readFileSync,readdirSync,mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
const paths=['index.html','sw.js','public/sw.js','public/icon.svg','public/manifest.webmanifest','public/data/edition.json','public/data/cves.json','public/data/ranking-policy.json',...readdirSync('src').filter(p=>/\.(js|css)$/.test(p)).map(p=>'src/'+p)];
const mime={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8',webmanifest:'application/manifest+json',svg:'image/svg+xml'};
const assets=Object.fromEntries(paths.map(p=>['/'+p,{type:mime[p.split('.').at(-1)],body:readFileSync(p,'utf8')}])) ;
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js','const STATIC_ASSETS='+JSON.stringify(assets)+';\n'+readFileSync('worker/index.js','utf8'));copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built private Site Worker with protected email watchlist API');
