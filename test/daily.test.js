import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runDaily} from '../scripts/daily.mjs';
test('daily refresh archives old edition, excludes repeated URLs and restores latest on failure',async()=>{
 const cwd=process.cwd(),tmp=mkdtempSync(join(tmpdir(),'oh-daily-'));process.chdir(tmp);
 try{mkdirSync('public/data',{recursive:true});const old={generatedAt:'2026-10-25T10:00:00Z',items:[{id:'old',url:'https://example.com/a?x=1'}]};writeFileSync('public/data/edition.json',JSON.stringify(old));
 await runDaily(async()=>writeFileSync('public/data/edition.json',JSON.stringify({generatedAt:'2026-10-26T01:00:00Z',items:[{id:'duplicate',url:'https://example.com/a?x=2'},{id:'new',url:'https://example.com/b'}]})));
 const latest=JSON.parse(readFileSync('public/data/edition.json'));assert.deepEqual(latest.items.map(i=>i.id),['new']);assert.equal(JSON.parse(readFileSync('public/data/archive/2026-10-25.json')).items[0].id,'old');
 await assert.rejects(runDaily(async()=>{throw Error('network unavailable');}));assert.deepEqual(JSON.parse(readFileSync('public/data/edition.json')),latest);
 await assert.rejects(runDaily(async()=>writeFileSync('public/data/edition.json',JSON.stringify({generatedAt:'2026-10-27T01:00:00Z',items:[{id:'new',url:'https://example.com/b'}]}))));assert.deepEqual(JSON.parse(readFileSync('public/data/edition.json')),latest);
 }finally{process.chdir(cwd);}
});
