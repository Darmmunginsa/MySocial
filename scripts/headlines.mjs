import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {safeUrl,validateEdition} from '../src/core.js';
const yesterday=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()-86400000));
export const feeds=[{id:'bbc-thai',publisherId:'bbc',name:'BBC News ไทย',url:'https://feeds.bbci.co.uk/thai/rss.xml',hosts:['www.bbc.com','www.bbc.co.uk','bbc.com'],language:'th'},{id:'thaipbs',name:'Thai PBS',url:'https://www.thaipbs.th/news/today',hosts:['www.thaipbs.th'],language:'th',format:'html'},{id:'nasa',name:'NASA',url:'https://www.nasa.gov/feed/',hosts:['www.nasa.gov','science.nasa.gov','nasa.gov'],language:'en'},{id:'bbc-world',publisherId:'bbc',name:'BBC News World',url:'https://feeds.bbci.co.uk/news/world/rss.xml',hosts:['www.bbc.com','www.bbc.co.uk','bbc.com'],language:'en'},{id:'thaipbs-archive',publisherId:'thaipbs',name:'Thai PBS',url:'https://www.thaipbs.th/news/archive/'+yesterday,hosts:['www.thaipbs.th'],language:'th',format:'html'}];
export function plain(value){return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>{const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c>0&&c<=0x10ffff?String.fromCodePoint(c):'';}).replace(/&(amp|lt|gt|quot|apos);/g,(_,x)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[x])).trim();}
export function parseRSS(xml,source,now=new Date()){
 if(typeof xml!=='string'||xml.length>2000000||/<!DOCTYPE|<!ENTITY/i.test(xml)||!/<rss\b/i.test(xml))throw new Error('Unsupported RSS document');
 const result=[];const seen=new Set();
 for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const field=name=>plain(match[1].match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1]||'');
  const title=field('title');const url=safeUrl(field('link'));const time=Date.parse(field('pubDate'));const age=(now.getTime()-time)/3600000;
  if(!title||title.length>600||!url||!source.hosts.includes(new URL(url).hostname)||!Number.isFinite(time)||age<-.25||age>168||seen.has(url))continue;
  seen.add(url);
  const region=['กรุงเทพมหานคร','เชียงใหม่','ขอนแก่น'].find(r=>title.includes(r)||(r==='กรุงเทพมหานคร'&&/กรุงเทพ|กทม\./.test(title)))||null;
  const foreign=/สหรัฐ|อเมริกา|ทรัมป์|จีน|ญี่ปุ่น|เกาหลี|ยูเครน|รัสเซีย|อิสราเอล|กาซา|อังกฤษ|ยุโรป|เมียนมา|ไต้หวัน|อิหร่าน|ปาเลสไตน์|อาเซียน|ฝรั่งเศส|อินเดีย|ปารีส/.test(title);
  const explicitThai=/คนไทย|ประเทศไทย|รัฐบาลไทย|เศรษฐกิจไทย|สังคมไทย/.test(title);
  const category=source.id==='nasa'?'discovery':region?'local':(source.id==='thaipbs'||source.publisherId==='thaipbs')&&!foreign?'thailand':explicitThai?'thailand':'world';
  const topic=source.id==='nasa'?'วิทยาศาสตร์':/ฝุ่น|น้ำท่วม|อากาศ|โลกร้อน/.test(title)?'สิ่งแวดล้อม':/เศรษฐกิจ|เงิน|ราคา|ภาษี/.test(title)?'เศรษฐกิจ':/สุขภาพ|โรค|แพทย์/.test(title)?'สุขภาพ':'สังคม';
  result.push({id:'feed-'+createHash('sha256').update(url).digest('hex').slice(0,20),kind:'headline',status:'metadata',title,summary:`พาดหัวจาก ${source.name} — เปิดอ่านรายละเอียดและบริบทฉบับเต็มที่ต้นทาง`,url,sourceId:source.publisherId||source.id,sourceName:source.name,feedUrl:source.url,language:source.language,publishedAt:new Date(time).toISOString(),fetchedAt:now.toISOString(),category,topic,region,reason:`รับพาดหัวจาก ${source.name} · หมวดเบื้องต้นตามแหล่งและคำในพาดหัว${region?'ที่ระบุพื้นที่ตรงกับจังหวัดที่เลือก':''} · เรียงความสดโดยไม่ใช้ยอดคลิก`,scores:{impact:.5,urgency:.5,publicValue:.5,geography:.5,freshness:Math.exp(-Math.max(0,age)/48)},sentences:[],evidence:[]});
  if(result.length>=60)break;
 }
 return result;
}
export function parseThaiPBS(html,source,now=new Date()){
 const entries=[];for(const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
  const path=match[1].match(/href="(\/news\/content\/\d+)"/)?.[1];if(!path||!/<h3\b/.test(match[2]))continue;
  const title=plain(match[2]);const trailing=html.slice(match.index+match[0].length,match.index+match[0].length+2500);const date=trailing.match(/<time\b[^>]*datetime="([^"]+)"/)?.[1];if(!date)continue;
  entries.push(`<item><title><![CDATA[${title.replace(/\]\]>/g,']] >')}]]></title><link>https://www.thaipbs.th${path}</link><pubDate>${date}</pubDate></item>`);
 }
 return parseRSS('<rss>'+entries.join('')+'</rss>',source,now);
}
export async function refresh(){
 const now=new Date();const results=await Promise.allSettled(feeds.map(async source=>{
  const response=await fetch(source.url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'OpenHorizon/0.2 (headline-links-only)'}});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const reader=response.body.getReader();let length=0;const parts=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2000000){await reader.cancel();throw new Error('Feed too large');}parts.push(Buffer.from(value));}
  const text=Buffer.concat(parts).toString('utf8');const items=source.format==='html'?parseThaiPBS(text,source,now):parseRSS(text,source,now);if(!items.length)throw new Error('No recent valid headlines');return items;
 }));
 const items=[];const sourceStatus=[];for(let i=0;i<results.length;i++){const result=results[i];if(result.status==='fulfilled'){items.push(...result.value);sourceStatus.push({source:feeds[i].name,status:'ok',count:result.value.length});}else sourceStatus.push({source:feeds[i].name,status:'unavailable'});}
 if(!items.length)throw new Error('All feeds failed. Previous edition preserved.');
 const edition=validateEdition({demo:false,mode:'headlines',editionId:'headlines-'+Date.now(),generatedAt:now.toISOString(),sourceStatus,items});
 writeFileSync('public/data/edition.json.tmp',JSON.stringify(edition,null,2));renameSync('public/data/edition.json.tmp','public/data/edition.json');
 console.log(JSON.stringify({count:items.length,sourceStatus,titles:items.map(i=>({title:i.title,category:i.category,publishedAt:i.publishedAt}))},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)refresh().catch(error=>{console.error(error.message);process.exitCode=1;});
