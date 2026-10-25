import {test} from 'node:test';import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
test('news and PWA files resolve on both raw GitHub Pages and built hosting',()=>{
 execFileSync(process.execPath,['scripts/build.mjs']);
 const app=readFileSync('src/app.js','utf8');assert(app.includes("new URL('../public/data/'+file,import.meta.url)"));
 for(const root of ['.','dist'])for(const path of ['index.html','src/app.js','src/core.js','public/data/edition.json','public/data/ranking-policy.json','public/icon.svg','public/manifest.webmanifest','public/sw.js','sw.js'])assert(existsSync(`${root}/${path}`),`${root}/${path} must exist`);
 const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
 assert.equal(new URL(manifest.start_url,'https://example.github.io/MySocial/public/manifest.webmanifest').pathname,'/MySocial/');
});
