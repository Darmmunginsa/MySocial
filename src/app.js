import {dayKey,mergeStories,filterHistory} from './history.js?v=0.8.0';
import {categories,topics,policy,score,selectEdition,safeUrl,validateEdition,configurePolicy,isPublishable,coverageDetails} from './core.js?v=0.8.0';
const $=s=>document.querySelector(s);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const key='oh-v1';let prefs=read(key,{region:'none',topics:[],quota:3});
if(!prefs||typeof prefs!=='object')prefs={region:'none',topics:[],quota:3};
if(!Array.isArray(prefs.topics))prefs.topics=[];
if(typeof prefs.cyberFocus!=='boolean')prefs.cyberFocus=true;
if(typeof prefs.goldFocus!=='boolean')prefs.goldFocus=true;
let saved=read('oh-saved',[]);if(!Array.isArray(saved))saved=[];
if(![20,24,30].includes(Number(prefs.dailyLimit)))prefs.dailyLimit=24; if(typeof prefs.fillGaps!=='boolean')prefs.fillGaps=true;
let readStates=read('oh-read',{}),retained=read('oh-retained',{}),archiveData=null,archiveIndex=[];
if(!readStates||typeof readStates!=='object'||Array.isArray(readStates))readStates={};if(!retained||typeof retained!=='object'||Array.isArray(retained))retained={};
let data,category='all',view='today',edition,toastTimer;
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{toast('เครื่องนี้ไม่อนุญาตให้บันทึกข้อมูล การตั้งค่าจะใช้ได้ในครั้งนี้เท่านั้น');}}
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3000);}
function date(value){return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(value));}
function showDialog(id){const d=$(id);if(!d.open)d.showModal();}
function markRead(item,value=true){if(value){readStates[item.id]=new Date().toISOString();retained[item.id]=item;}else delete readStates[item.id];store('oh-read',readStates);store('oh-retained',retained);}
function trackLink(a,item){a.onclick=()=>{markRead(item);setTimeout(render,0);};}
function headline(item){return item.translation?.sourceTitle===item.title&&typeof item.titleTh==='string'?item.titleTh:item.title;}
function original(item){const d=el('details');d.append(el('summary','พาดหัวต้นฉบับ · แปลไทยด้วย AI อาจคลาดเคลื่อน'),el('p',item.title));return d;}
function details(item){
 const body=$('#detail-body');body.replaceChildren();body.append(el('span',`${categories[item.category]} / ${item.topic}`,'tag'),el('h2',headline(item)),el('p',item.summary));
 if(headline(item)!==item.title)body.append(original(item));
 body.append(el('h3','ทำไมคุณเห็นเรื่องนี้'),el('p',item.reason),el('p',`อยู่ในโควตา${categories[item.category]} · นโยบาย v${policy.version} · คะแนน ${Math.round(score(item)*100)}/100`,'subtle'));
 if(item.kind==='headline')body.append(el('p','รุ่นนี้ใช้ค่ากลาง 50% สำหรับมิติที่ยังไม่ได้ประเมิน และให้ความสดเป็นตัวแยกลำดับ ไม่ใช่คะแนนความสำคัญที่ตรวจโดยบรรณาธิการหรือ AI','notice-text'));
 const labels={impact:'ผลกระทบ',urgency:'ความเร่งด่วน',publicValue:'ประโยชน์สาธารณะ',geography:'ความเกี่ยวข้องกับขอบเขตข่าว',freshness:'ความสด'};
 const table=el('table');for(const [key,w] of Object.entries(policy.weights)){const row=el('tr');row.append(el('td',labels[key]),el('td',`${Math.round(item.scores[key]*100)} × ${w*100}%`));table.append(row);}body.append(table);
 body.append(el('h3','หลักฐานและแหล่งต้นทาง'));
 if(data.demo)body.append(el('p','นี่คือสถานการณ์สมมติ คะแนนกำหนดไว้เพื่อทดลองการจัดอันดับ ไม่มีหลักฐานข่าวจริง และไม่ใช่ผลวิเคราะห์จาก AI','notice-text'));
 else {
  for(const sentence of item.sentences){body.append(el('p',sentence.text));for(const id of sentence.evidenceIds){const evidence=item.evidence.find(e=>e.id===id);if(evidence)body.append(el('blockquote',`[${id}] ${evidence.text}`));}}
  const url=safeUrl(item.url);if(url){const a=el('a',`อ่านต้นฉบับ: ${item.sourceName}`,'source-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';trackLink(a,item);body.append(a);}
 }
 body.append(el('p',`เวลาที่ต้นทางเผยแพร่: ${date(item.publishedAt)} (เวลาไทย)`,'subtle'));showDialog('#detail');
}
function render(){
 if(!data)return;edition=selectEdition(data.items,prefs);
 const pool=mergeStories([{items:Object.values(retained)},data,...(archiveData?[archiveData]:[])]);
 let items=view==='archive'?(archiveData?.items||[]):view==='read'?pool.filter(i=>readStates[i.id]):view==='saved'?pool.filter(x=>saved.includes(x.id)&&isPublishable(x)):edition.items;
 if(view!=='today')items=filterHistory(items,{query:$('#history-query').value,state:$('#history-state').value,read:readStates});
 $('#history-controls').hidden=view==='today';$('#archive-day').hidden=view!=='archive';$('#coverage').hidden=view!=='today';
 if(category!=='all')items=items.filter(x=>x.category===category);
 items=[...items].sort($('#sort').value==='latest'?(a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt):(a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 $('#view-title').firstChild.textContent=view==='archive'?'คลังฉบับย้อนหลัง ':view==='read'?'อ่านแล้ว ':view==='saved'?'เรื่องที่บันทึกไว้ ':'ฉบับล่าสุดของคุณ ';
 $('#story-count').textContent=`แสดง ${items.length} เรื่อง${view==='today'?'ตามการตั้งค่าของคุณ':''}`;$('#saved-count').textContent=pool.filter(x=>saved.includes(x.id)).length;
 $('#edition-date').textContent=`${data.demo?'ฉบับตัวอย่าง':'อัปเดตฉบับ'} · ${date(data.generatedAt)} น.`;
 $('#edition-date').textContent+=(dayKey(data.generatedAt)!==dayKey(new Date())?' · ยังไม่มีฉบับใหม่ของวันนี้ ใช้ฉบับล่าสุด':'');
 const coverage=$('#coverage');coverage.replaceChildren();
 coverage.append(el('strong',`ฉบับของคุณคัดได้ ${edition.items.length} เรื่อง · เป้าหมาย ${edition.dailyLimit} เรื่องต่อวัน`),el('p',`รับมา ${data.items.length} พาดหัวในฉบับนี้ ก่อนคัดตามการตั้งค่าและกติกา จำนวนที่แต่ละคนเห็นจึงอาจต่างกัน${category!=='all'?` · ขณะนี้แสดงเฉพาะหมวด ${categories[category]}`:''}`));
 const cyber=el('section',undefined,'gold-focus cyber-focus');cyber.append(el('h3','ติดตามความปลอดภัยไซเบอร์'),el('p','กันพื้นที่ข่าวไซเบอร์สูงสุด 3 เรื่องภายในจำนวนข่าวต่อวัน ปิดได้ในการรับรู้ของฉัน · จำแนกจากแหล่งและคำในพาดหัว ยังไม่ยืนยันความรุนแรงหรือการโจมตีจริงจากบทความเต็ม'));
 const cyberItems=edition.items.filter(i=>i.topic==='ความปลอดภัยไซเบอร์');if(!prefs.cyberFocus)cyber.append(el('p','ปิดการกันพื้นที่ติดตามไซเบอร์แล้ว'));if(!cyberItems.length)cyber.append(el('p','ฉบับที่คัดยังไม่มีข่าวไซเบอร์ที่ผ่านเงื่อนไข ไม่สร้างข่าวทดแทน'));
 for(const item of cyberItems){const a=el('a',headline(item)+' · '+item.sourceName,'source-link');a.href=safeUrl(item.url);a.target='_blank';a.rel='noopener noreferrer';trackLink(a,item);cyber.append(a);}coverage.append(cyber);
 const focus=el('section',undefined,'gold-focus');focus.append(el('h3','ติดตามทองคำ'),el('p','กันพื้นที่ในฉบับสูงสุด 3 ข่าวทองคำโดยตรง + 2 ข่าวปัจจัยมหภาค ตามข่าวที่มีและข้อจำกัดแหล่งข่าว ปิดได้ในการรับรู้ของฉัน · คัดจากคำในพาดหัว ไม่ใช่การพยากรณ์ราคา'));
 const goldItems=edition.items.filter(i=>i.goldRelevance);if(!prefs.goldFocus)focus.append(el('p','ปิดการกันพื้นที่ติดตามทองคำแล้ว'));
 if(!goldItems.length)focus.append(el('p','ฉบับที่คัดยังไม่มีข่าวทองคำหรือปัจจัยมหภาคที่เข้าเงื่อนไข ไม่เติมข้อมูลราคาหรือแนวโน้มขึ้นเอง'));
 for(const item of goldItems){const a=el('a',(item.goldRelevance==='direct'?'ทองคำโดยตรง':'ปัจจัยมหภาค — ยังไม่ยืนยันผลต่อทองคำ')+' · '+headline(item)+' · '+item.sourceName,'source-link');a.href=safeUrl(item.url);a.target='_blank';a.rel='noopener noreferrer';trackLink(a,item);focus.append(a);}
 coverage.append(focus);
 const status=el('details');status.append(el('summary','แหล่งข่าวที่นำเข้าในฉบับนี้'));for(const source of data.sourceStatus||[])status.append(el('p',source.source+' · '+(source.status==='ok'?source.count+' พาดหัว':'ไม่พร้อมใช้งาน / ไม่มีข่าวใหม่ที่ผ่านเงื่อนไข')));coverage.append(status);
 const list=el('ul',undefined,'coverage-list');
 for(const detail of coverageDetails(data.items,prefs,edition)){const row=el('li');row.append(el('strong',`${detail.label}: ${detail.count} เรื่อง (สัดส่วนเริ่มต้น ${detail.target})`),el('span',detail.reason));list.append(row);}
 coverage.append(list,el('p','หมวดเปิดขอบฟ้าคือเรื่องนอกหัวข้อที่เลือกสนใจ หากเปิดตัวเลือกเติมข่าว ระบบจะเติมจากเรื่องที่ผ่านเงื่อนไขในหมวดอื่นและระบุจำนวนให้ทราบ โดยไม่เปลี่ยนจังหวัดหรือความสนใจของคุณ'));
 const adjust=el('button','ปรับหัวข้อที่สนใจ','text-button');adjust.onclick=()=>$('#settings-open').click();coverage.append(adjust);
 const container=$('#stories');container.replaceChildren();
 if(!items.length)container.append(el('p',view==='saved'?'ยังไม่มีเรื่องที่บันทึกในหมวดนี้ ลองกด “บันทึก” บนการ์ด':'ไม่มีเรื่องที่ผ่านเงื่อนไขในหมวดนี้ ลองเลือกจังหวัดหรือปรับหัวข้อที่สนใจ','empty'));
 items.forEach((item,i)=>{
  const card=el('article',undefined,`story ${item.category}`);const meta=el('div',undefined,'card-meta');meta.append(el('span',categories[item.category],'category'),el('span',item.topic),el('span',String(i+1).padStart(2,'0'),'story-number'));
  const heading=el('h3');const title=el('button',headline(item),'story-title');title.onclick=()=>details(item);heading.append(title);
  const reason=el('p',`↗ ${item.reason}`,'card-reason');const bottom=el('div',undefined,'card-bottom');const explain=el('button','ทำไมฉันเห็นเรื่องนี้ ↗','explain');explain.onclick=()=>details(item);
  const bookmark=el('button',saved.includes(item.id)?'บันทึกแล้ว ✓':'บันทึก +','bookmark');bookmark.setAttribute('aria-pressed',String(saved.includes(item.id)));bookmark.setAttribute('aria-label',`${saved.includes(item.id)?'ยกเลิกบันทึก':'บันทึก'} ${item.title}`);bookmark.onclick=()=>{retained[item.id]=item;store('oh-retained',retained);saved=saved.includes(item.id)?saved.filter(id=>id!==item.id):[...saved,item.id];store('oh-saved',saved);render();};
  const readButton=el('button',readStates[item.id]?'อ่านแล้ว ✓ · ยกเลิก':'ทำเครื่องหมายว่าอ่านแล้ว','bookmark');readButton.setAttribute('aria-pressed',String(!!readStates[item.id]));readButton.onclick=()=>{markRead(item,!readStates[item.id]);render();};bottom.append(explain,readButton,bookmark);card.append(meta,heading,el('p',item.summary,'card-summary'),reason,el('p',data.demo?'ข้อมูลตัวอย่าง · ยังไม่ใช่ข่าวจริง':`${item.sourceName} · ${date(item.publishedAt)}${item.kind==='headline'?' · พาดหัวต้นทาง ไม่มีสรุป AI':' · ผ่านการตรวจ'}`,'card-source'));
  if(item.kind==='headline'&&safeUrl(item.url)){const link=el('a','อ่านข่าวที่ต้นทาง ↗','source-link');link.href=safeUrl(item.url);link.target='_blank';link.rel='noopener noreferrer';trackLink(link,item);card.append(link);}
  if(headline(item)!==item.title)card.append(original(item));card.append(bottom);container.append(card);
 });
 document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('selected',b.dataset.category===category);b.setAttribute('aria-pressed',String(b.dataset.category===category));});
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}
document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;render();});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=async()=>{view=b.dataset.view;category='all';if(view==='archive')await loadArchive();render();});
async function loadArchive(){try{if(!archiveIndex.length){const r=await fetch(new URL('../public/data/archive/index.json',import.meta.url),{cache:'no-cache'});if(!r.ok)throw Error();archiveIndex=await r.json();const select=$('#archive-day');select.replaceChildren();for(const entry of archiveIndex.filter(e=>e.day!==dayKey(data.generatedAt))){if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.day))continue;const option=el('option',entry.day+' · '+entry.count+' พาดหัว');option.value=entry.day;select.append(option);}}const day=$('#archive-day').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return;const r=await fetch(new URL('../public/data/archive/'+day+'.json',import.meta.url));if(!r.ok)throw Error();archiveData=validateEdition(await r.json());}catch{toast('โหลดคลังไม่ได้ กรุณาลองใหม่เมื่อออนไลน์');}}
$('#archive-day').onchange=async()=>{await loadArchive();render();};$('#history-query').oninput=render;$('#history-state').onchange=render;
$('#region').value=prefs.region;$('#region').onchange=e=>{prefs.region=e.target.value;store(key,prefs);render();};$('#sort').onchange=render;
$('#settings-open').onclick=()=>{const options=$('#topic-options');options.replaceChildren();topics.forEach(topic=>{const label=el('label',undefined,'topic-option');const input=el('input');input.type='checkbox';input.name='topic';input.value=topic;input.checked=prefs.topics.includes(topic);label.append(input,el('span',topic));options.append(label);});$('#preferences').elements.cyberFocus.checked=prefs.cyberFocus;$('#preferences').elements.goldFocus.checked=prefs.goldFocus;$('#preferences').elements.dailyLimit.value=prefs.dailyLimit;$('#preferences').elements.fillGaps.checked=prefs.fillGaps;showDialog('#settings');};
$('#preferences').onsubmit=e=>{e.preventDefault();const values=new FormData(e.target);prefs={...prefs,topics:values.getAll('topic'),cyberFocus:values.has('cyberFocus'),goldFocus:values.has('goldFocus'),dailyLimit:Number(values.get('dailyLimit')),fillGaps:values.has('fillGaps')};store(key,prefs);$('#settings').close();render();toast('ใช้การตั้งค่าใหม่แล้ว');};
$('#policy-open').onclick=()=>{const body=$('#detail-body');body.replaceChildren();const labels={impact:'ผลกระทบ',urgency:'ความเร่งด่วน',publicValue:'ประโยชน์สาธารณะ',geography:'ความเกี่ยวข้องกับขอบเขตข่าว',freshness:'ความสด'};body.append(el('h2','กติกาที่คุณตรวจสอบได้'),el('p','เราเลือกความสำคัญและความหลากหลาย โดยไม่ใช้ยอดคลิก เวลาอ่าน หรือการแชร์มาจัดอันดับ'),el('h3','น้ำหนักคะแนน'),el('p',Object.entries(policy.weights).map(([key,w])=>`${labels[key]} ${Math.round(w*100)}%`).join(' · ')),el('h3','โควตาและช่องว่าง'),el('p',`เป้าหมายเริ่มต้น 24 เรื่องต่อวัน กระจายสัดส่วนเริ่มต้นระหว่าง 4 หมวด เปลี่ยนเป็น 20 หรือ 30 เรื่องได้ใน “การรับรู้ของฉัน” ข่าวท้องถิ่นใช้จังหวัดที่คุณเลือก ข่าวเปิดขอบฟ้าตัดหัวข้อที่คุณระบุว่าสนใจออก เมื่อเปิดตัวเลือกเติมข่าว ระบบจะแสดงจำนวนที่เติมจากหมวดอื่น โดยคงตัวกรองจังหวัดและความสนใจไว้`),el('h3','ที่มาของกติกา'),el('p',policy.origin?`นำเข้าจาก Google Sheet เมื่อ ${date(policy.origin.capturedAt)} (เวลาไทย) เป็นสำเนาที่ตรวจแล้ว การแก้ในชีตยังไม่อัปเดตเว็บไซต์อัตโนมัติ`:'กติกาตั้งต้นของระบบ'),el('h3','ข้อมูลและความเป็นส่วนตัว'),el('p','ต้นแบบนี้เก็บเฉพาะการตั้งค่าและรายการบันทึกในเบราว์เซอร์ ไม่มีบัญชี ประวัติอ่านและข่าวที่บันทึกเก็บเฉพาะเบราว์เซอร์เครื่องนี้ ไม่ส่งเพื่อจัดอันดับ และไม่มี API key อยู่ในหน้าเว็บ'),el('p',`นโยบายเวอร์ชัน ${policy.version} · คะแนนเบื้องต้น ไม่ใช่คำรับรองความสำคัญหรือความถูกต้องของข่าว`,'subtle'));showDialog('#detail');};
$('#reset').onclick=()=>{prefs={region:'none',topics:[],dailyLimit:24,fillGaps:true,goldFocus:true,cyberFocus:true};saved=[];readStates={};retained={};store('oh-read',readStates);store('oh-retained',retained);store(key,prefs);store('oh-saved',saved);$('#region').value='none';render();toast('ล้างข้อมูลที่บันทึกในเครื่องแล้ว');};
function network(){$('#network-status').hidden=navigator.onLine;}
addEventListener('online',network);addEventListener('offline',network);network();
try{const [response,policyResponse]=await Promise.all(['edition.json','ranking-policy.json'].map(file=>fetch(new URL('../public/data/'+file,import.meta.url),{cache:'no-cache'})));if(!response.ok||!policyResponse.ok)throw new Error('load');configurePolicy(await policyResponse.json());if(!read(key,null))prefs.quota=policy.quotaPerCategory;data=validateEdition(await response.json());if(!data.demo){$('#data-notice').replaceChildren(el('strong',data.mode==='headlines'?'ข่าวจริง · พาดหัวและลิงก์ต้นทาง':'ฉบับผ่านการตรวจ'),el('span',data.mode==='headlines'?`ดึงล่าสุด ${date(data.generatedAt)} · ยังไม่มีสรุป AI · ฉบับนี้ไม่ได้อัปเดตแบบเรียลไทม์`:'สรุปจากหลักฐานต้นทาง · ตรวจเวลาอัปเดตและแหล่งข่าวก่อนใช้ตัดสินใจ'));}$('#policy-status').textContent=policy.origin?`กติกาจาก Google Sheet · นำเข้า ${date(policy.origin.capturedAt)} · ยังไม่ซิงก์อัตโนมัติ`:'';render();}catch{$('#stories').append(el('p','ยังโหลดฉบับข่าวหรือกติกาที่ตรวจแล้วไม่ได้ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วเปิดใหม่','empty'));}
if('serviceWorker' in navigator)navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname}).catch(()=>{});

setInterval(async()=>{if(document.visibilityState!=='visible'||!navigator.onLine)return;try{const r=await fetch(new URL('../public/data/edition.json',import.meta.url),{cache:'no-cache'});if(!r.ok)return;const next=validateEdition(await r.json());if(next.generatedAt>data.generatedAt){data=next;render();toast('มีฉบับข่าวใหม่แล้ว');}}catch{}},300000);
