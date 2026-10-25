import {categories,topics,policy,score,selectEdition,safeUrl,validateEdition} from './core.js';
const $=s=>document.querySelector(s);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const key='oh-v1';let prefs=read(key,{region:'none',topics:[],quota:3});
if(!prefs||typeof prefs!=='object')prefs={region:'none',topics:[],quota:3};
if(!Array.isArray(prefs.topics))prefs.topics=[];
let saved=read('oh-saved',[]);if(!Array.isArray(saved))saved=[];
let data,category='all',view='today',edition,toastTimer;
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{toast('เครื่องนี้ไม่อนุญาตให้บันทึกข้อมูล การตั้งค่าจะใช้ได้ในครั้งนี้เท่านั้น');}}
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3000);}
function date(value){return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(value));}
function showDialog(id){const d=$(id);if(!d.open)d.showModal();}
function details(item){
 const body=$('#detail-body');body.replaceChildren();body.append(el('span',`${categories[item.category]} / ${item.topic}`,'tag'),el('h2',item.title),el('p',item.summary));
 body.append(el('h3','ทำไมคุณเห็นเรื่องนี้'),el('p',item.reason),el('p',`อยู่ในโควตา${categories[item.category]} · นโยบาย v${policy.version} · คะแนน ${Math.round(score(item)*100)}/100`,'subtle'));
 const labels={impact:'ผลกระทบ',urgency:'ความเร่งด่วน',publicValue:'ประโยชน์สาธารณะ',geography:'ความเกี่ยวข้องกับขอบเขตข่าว',freshness:'ความสด'};
 const table=el('table');for(const [key,w] of Object.entries(policy.weights)){const row=el('tr');row.append(el('td',labels[key]),el('td',`${Math.round(item.scores[key]*100)} × ${w*100}%`));table.append(row);}body.append(table);
 body.append(el('h3','หลักฐานและแหล่งต้นทาง'));
 if(data.demo)body.append(el('p','นี่คือสถานการณ์สมมติ คะแนนกำหนดไว้เพื่อทดลองการจัดอันดับ ไม่มีหลักฐานข่าวจริง และไม่ใช่ผลวิเคราะห์จาก AI','notice-text'));
 else {
  for(const sentence of item.sentences){body.append(el('p',sentence.text));for(const id of sentence.evidenceIds){const evidence=item.evidence.find(e=>e.id===id);if(evidence)body.append(el('blockquote',`[${id}] ${evidence.text}`));}}
  const url=safeUrl(item.url);if(url){const a=el('a',`อ่านต้นฉบับ: ${item.sourceName}`,'source-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}
 }
 body.append(el('p',`เวลาของข้อมูล: ${date(item.publishedAt)} (เวลาไทย)`,'subtle'));showDialog('#detail');
}
function render(){
 if(!data)return;edition=selectEdition(data.items,prefs);
 let items=view==='saved'?data.items.filter(x=>saved.includes(x.id)&&x.status==='approved'):edition.items;
 if(category!=='all')items=items.filter(x=>x.category===category);
 items=[...items].sort($('#sort').value==='latest'?(a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt):(a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 $('#view-title').firstChild.textContent=view==='saved'?'เรื่องที่บันทึกไว้ ':'ฉบับของคุณวันนี้ ';
 $('#story-count').textContent=`${items.length} เรื่อง`;$('#saved-count').textContent=data.items.filter(x=>saved.includes(x.id)).length;
 $('#edition-date').textContent=`${data.demo?'ฉบับตัวอย่าง':'อัปเดตฉบับ'} · ${date(data.generatedAt)} น.`;
 const missing=Object.keys(categories).filter(c=>edition.counts[c]<edition.quota).map(c=>`${categories[c]} ${edition.counts[c]}/${edition.quota}`);
 $('#coverage').textContent=missing.length?`พื้นที่ที่เลือก: ${prefs.region==='none'?'ยังไม่เลือกจังหวัด':prefs.region} · หมวดที่ยังไม่เต็ม: ${missing.join(' · ')} — เราไม่เติมข่าวอื่นแทนโดยไม่บอก`:`จัดครบ ${edition.quota} เรื่องต่อหมวด · กติกาเปิดเผย ไม่มีคะแนนจากยอดคลิก`;
 const container=$('#stories');container.replaceChildren();
 if(!items.length)container.append(el('p',view==='saved'?'ยังไม่มีเรื่องที่บันทึกในหมวดนี้ ลองกด “บันทึก” บนการ์ด':'ไม่มีเรื่องที่ผ่านเงื่อนไขในหมวดนี้ ลองเลือกจังหวัดหรือปรับหัวข้อที่สนใจ','empty'));
 items.forEach((item,i)=>{
  const card=el('article',undefined,`story ${item.category}`);const meta=el('div',undefined,'card-meta');meta.append(el('span',categories[item.category],'category'),el('span',item.topic),el('span',String(i+1).padStart(2,'0'),'story-number'));
  const heading=el('h3');const title=el('button',item.title,'story-title');title.onclick=()=>details(item);heading.append(title);
  const reason=el('p',`↗ ${item.reason}`,'card-reason');const bottom=el('div',undefined,'card-bottom');const explain=el('button','ทำไมฉันเห็นเรื่องนี้ ↗','explain');explain.onclick=()=>details(item);
  const bookmark=el('button',saved.includes(item.id)?'บันทึกแล้ว ✓':'บันทึก +','bookmark');bookmark.setAttribute('aria-pressed',String(saved.includes(item.id)));bookmark.setAttribute('aria-label',`${saved.includes(item.id)?'ยกเลิกบันทึก':'บันทึก'} ${item.title}`);bookmark.onclick=()=>{saved=saved.includes(item.id)?saved.filter(id=>id!==item.id):[...saved,item.id];store('oh-saved',saved);render();};
  bottom.append(explain,bookmark);card.append(meta,heading,el('p',item.summary,'card-summary'),reason,el('p',data.demo?'ข้อมูลตัวอย่าง · ยังไม่ใช่ข่าวจริง':`${item.sourceName} · ผ่านการตรวจ`,'card-source'),bottom);container.append(card);
 });
 document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('selected',b.dataset.category===category);b.setAttribute('aria-pressed',String(b.dataset.category===category));});
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}
document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;render();});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;category='all';render();});
$('#region').value=prefs.region;$('#region').onchange=e=>{prefs.region=e.target.value;store(key,prefs);render();};$('#sort').onchange=render;
$('#settings-open').onclick=()=>{const options=$('#topic-options');options.replaceChildren();topics.forEach(topic=>{const label=el('label',undefined,'topic-option');const input=el('input');input.type='checkbox';input.name='topic';input.value=topic;input.checked=prefs.topics.includes(topic);label.append(input,el('span',topic));options.append(label);});$('#preferences').elements.quota.value=prefs.quota||3;showDialog('#settings');};
$('#preferences').onsubmit=e=>{e.preventDefault();const values=new FormData(e.target);prefs={...prefs,topics:values.getAll('topic'),quota:Number(values.get('quota'))};store(key,prefs);$('#settings').close();render();toast('ใช้การตั้งค่าใหม่แล้ว');};
$('#policy-open').onclick=()=>{const body=$('#detail-body');body.replaceChildren();body.append(el('h2','กติกาที่คุณตรวจสอบได้'),el('p','เราเลือกความสำคัญและความหลากหลาย โดยไม่ใช้ยอดคลิก เวลาอ่าน หรือการแชร์มาจัดอันดับ'),el('h3','น้ำหนักคะแนน'),el('p','ผลกระทบ 30% · ความเร่งด่วน 20% · ประโยชน์สาธารณะ 20% · ความเกี่ยวข้องกับขอบเขตข่าว 15% · ความสด 15%'),el('h3','โควตาและช่องว่าง'),el('p','เริ่มต้นหมวดละ 3 เรื่อง เปลี่ยนจำนวนได้ใน “การรับรู้ของฉัน” ข่าวท้องถิ่นใช้จังหวัดที่คุณเลือก ข่าวเปิดขอบฟ้าตัดหัวข้อที่คุณระบุว่าสนใจออก ข่าวไม่พอแสดงช่องว่างโดยไม่เติมเงียบ ๆ'),el('h3','ข้อมูลและความเป็นส่วนตัว'),el('p','ต้นแบบนี้เก็บเฉพาะการตั้งค่าและรายการบันทึกในเบราว์เซอร์ ไม่มีบัญชี ไม่มีการติดตามการอ่าน และไม่มี API key อยู่ในหน้าเว็บ'),el('p',`นโยบายเวอร์ชัน ${policy.version} · คะแนนตัวอย่างเป็นค่าที่กำหนดไว้เพื่อทดลอง ไม่ใช่การประเมินข่าวจริง`,'subtle'));showDialog('#detail');};
$('#reset').onclick=()=>{prefs={region:'none',topics:[],quota:3};saved=[];store(key,prefs);store('oh-saved',saved);$('#region').value='none';render();toast('ล้างข้อมูลที่บันทึกในเครื่องแล้ว');};
function network(){$('#network-status').hidden=navigator.onLine;}
addEventListener('online',network);addEventListener('offline',network);network();
try{const response=await fetch(new URL('../data/edition.json',import.meta.url),{cache:'no-cache'});if(!response.ok)throw new Error('load');data=validateEdition(await response.json());if(!data.demo){$('#data-notice').replaceChildren(el('strong','ฉบับผ่านการตรวจ'),el('span','สรุปจากหลักฐานต้นทาง · ตรวจเวลาอัปเดตและแหล่งข่าวก่อนใช้ตัดสินใจ'));}render();}catch{$('#stories').append(el('p','ยังโหลดฉบับข่าวไม่ได้ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วเปิดใหม่','empty'));}
if('serviceWorker' in navigator)navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname}).catch(()=>{});
