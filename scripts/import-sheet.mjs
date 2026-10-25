import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {importSnapshot,applyReviews} from './sheets-lib.mjs';
const path=process.argv[2];if(!path)throw new Error('Usage: node scripts/import-sheet.mjs private/sheets-snapshot.json [private/drafts.json]');
const imported=importSnapshot(JSON.parse(readFileSync(path,'utf8')));
const target='public/data/ranking-policy.json';
if(existsSync(target)){
 const previous=JSON.parse(readFileSync(target,'utf8'));
 if(previous.version===imported.policy.version&&(JSON.stringify(previous.weights)!==JSON.stringify(imported.policy.weights)||previous.quotaPerCategory!==imported.policy.quotaPerCategory))throw new Error('Policy changed: increment version in all Policy rows first.');
}
const reviewed=process.argv[3]?applyReviews(JSON.parse(readFileSync(process.argv[3],'utf8')),imported.reviews):null;
mkdirSync('private',{recursive:true});mkdirSync('config',{recursive:true});
writeFileSync(target,JSON.stringify(imported.policy,null,2));
writeFileSync('config/sources.json',JSON.stringify(imported.sources,null,2));
if(reviewed)writeFileSync('private/reviewed.json',JSON.stringify(reviewed,null,2));
console.log(`Imported policy v${imported.policy.version}; ${imported.sources.filter(s=>s.enabled).length} enabled sources; ${imported.reviews.length} review decisions. Snapshot only: no live connection or AI calls.`);
