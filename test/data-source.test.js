import {test} from 'node:test';import assert from 'node:assert/strict';import {dataFetch} from '../src/data-source.js';
test('preview fetches public live snapshots and falls back to local; GitHub uses local data path',async()=>{
 const beforeFetch=globalThis.fetch,beforeLocation=globalThis.location;let urls=[];
 try{globalThis.location={hostname:'preview.chatgpt.site'};globalThis.fetch=async u=>{urls.push(String(u));return {ok:true};};await dataFetch('cves.json');assert.equal(urls[0],'https://raw.githubusercontent.com/Darmmunginsa/MySocial/main/public/data/cves.json');
 urls=[];globalThis.fetch=async u=>{urls.push(String(u));if(urls.length===1)throw Error('offline');return {ok:true};};await dataFetch('archive/2026-11-07.json');assert.equal(urls.length,2);assert.ok(urls[1].endsWith('/public/data/archive/2026-11-07.json'));
 urls=[];globalThis.location={hostname:'darmmunginsa.github.io'};globalThis.fetch=async u=>{urls.push(String(u));return {ok:true};};await dataFetch('edition.json');assert.equal(urls.length,1);assert.ok(urls[0].endsWith('/public/data/edition.json'));await assert.rejects(dataFetch('../private/key'));assert.equal(urls.length,1);
 }finally{globalThis.fetch=beforeFetch;if(beforeLocation===undefined)delete globalThis.location;else globalThis.location=beforeLocation;}
});
