import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {refresh} from './headlines.mjs';
import {dayKey,storyKey} from '../src/history.js';
export async function runDaily(refreshFeed=refresh){
const path='public/data/edition.json',root='public/data/archive';mkdirSync(root,{recursive:true});
const previous=JSON.parse(readFileSync(path,'utf8'));
let index=existsSync(root+'/index.json')?JSON.parse(readFileSync(root+'/index.json','utf8')):[];
function archive(edition){const day=dayKey(edition.generatedAt);writeFileSync(root+'/'+day+'.json',JSON.stringify(edition));index=[{day,generatedAt:edition.generatedAt,count:edition.items.length},...index.filter(e=>e.day!==day)].sort((a,b)=>b.day.localeCompare(a.day)).slice(0,30);writeFileSync(root+'/index.json',JSON.stringify(index));}
archive(previous);
try{
 await refreshFeed();const next=JSON.parse(readFileSync(path,'utf8'));const today=dayKey(next.generatedAt);
 const seen=new Set(index.filter(e=>e.day!==today).flatMap(e=>JSON.parse(readFileSync(root+'/'+e.day+'.json','utf8')).items.map(storyKey)));
 next.items=next.items.filter(i=>!seen.has(storyKey(i)));
 if(!next.items.length)throw Error('No new headlines; latest edition retained');
 writeFileSync(path,JSON.stringify(next,null,2));archive(next);
 console.log('Daily edition: '+today+' / '+next.items.length+' new candidates');
}catch(error){writeFileSync(path,JSON.stringify(previous,null,2));console.error(error.message);throw error;}

}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)runDaily().catch(()=>{process.exitCode=1;});
