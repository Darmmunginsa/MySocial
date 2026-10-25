import {readFileSync,writeFileSync,renameSync} from 'node:fs';
import {validateEdition} from '../src/core.js';
const file=process.argv[2];if(!file)throw new Error('Supply a reviewed JSON array.');
const items=JSON.parse(readFileSync(file,'utf8'));
if(!Array.isArray(items)||!items.length||items.some(i=>i.status!=='approved'||!i.reviewedBy||!Number.isFinite(Date.parse(i.reviewedAt))))throw new Error('Every item needs approved status, reviewedBy and reviewedAt.');
const result=validateEdition({demo:false,editionId:`edition-${Date.now()}`,generatedAt:new Date().toISOString(),items});
// Allowlist public fields so private model metadata and reviewer identities never ship.
const publicKeys=['id','category','topic','region','title','summary','reason','sourceId','sourceName','url','publishedAt','scores','status','sentences','evidence','uncertainties'];
result.items=result.items.map(item=>Object.fromEntries(publicKeys.filter(k=>k in item).map(k=>[k,item[k]])));
writeFileSync('public/data/edition.json.tmp',JSON.stringify(result,null,2));renameSync('public/data/edition.json.tmp','public/data/edition.json');
console.log('Reviewed edition prepared locally. Run tests and build before deploying.');
