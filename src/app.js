import {categories,topics,policy,score,selectEdition,safeUrl,validateEdition,configurePolicy,isPublishable,coverageDetails} from './core.js?v=0.3.2';
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
 if(item.kind==='headline')body.append(el('p','รุ่นนี้ใช้ค่ากลาง 50% สำหรับมิติที่ยังไม่ได้ประเมิน และให้ความสดเป็นตัวแยกลำดับ ไม่ใช่คะแนนความสำคัญที่ตรวจโดยบรรณาธิการหรือ AI','notice-text'));
 const labels={impact:'ผลกระทบ',urgency:'ความเร่งด่วน',publicValue:'ประโยชน์สาธารณะ',geography:'ความเกี่ยวข้องกับขอบเขตข่าว',freshness:'ความสด'};
 const table=el('table');for(const [key,w] of Object.entries(policy.weights)){const row=el('tr');row.append(el('td',labels[key]),el('td',`${Math.round(item.scores[key]*100)} × ${w*100}%`));table.append(row);}body.append(table);
 body.append(el('h3','หลักฐานและแหล่งต้นทาง'));
 if(data.demo)body.append(el('p','นี่คือสถานการณ์สมมติ คะแนนกำหนดไว้เพื่อทดลองการจัดอันดับ ไม่มีหลักฐานข่าวจริง และไม่ใช่ผลวิเคราะห์จาก AI','notice-text'));
 else {
  for(const sentence of item.sentences){body.append(el('p',sentence.text));for(const id of sentence.evidenceIds){const evidence=item.evidence.find(e=>e.id===id);if(evidence)body.append(el('blockquote',`[${id}] ${evidence.text}`));}}
  const url=safeUrl(item.url);if(url){const a=el('a',`อ่านต้นฉบับ: ${item.sourceName}`,'source-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}
 }
 body.append(el('p',`เวลาที่ต้นทางเผยแพร่: ${date(item.publishedAt)} (เวลาไทย)`,'subtle'));showDialog('#detail');
}
function render(){
 if(!data)return;edition=selectEdition(data.items,prefs);
 let items=view==='saved'?data.items.filter(x=>saved.includes(x.id)&&isPublishable(x)):edition.items;
 if(category!=='all')items=items.filter(x=>x.category===category);
 items=[...items].sort($('#sort').value==='latest'?(a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt):(a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 $('#view-title').firstChild.textContent=view==='saved'?'เรื่องที่บันทึกไว้ ':'ฉบับของคุณวันนี้ ';
 $('#story-count').textContent=`แสดง ${items.length} เรื่อง${view==='today'?'ตามการตั้งค่าของคุณ':''}`;$('#saved-count').textContent=data.items.filter(x=>saved.includes(x.id)).length;
 $('#edition-date').textContent=`${data.demo?'ฉบับตัวอย่าง':'อัปเดตฉบับ'} · ${date(data.generatedAt)} น.`;
 const coverage=$('#coverage');coverage.replaceChildren();
 coverage.append(el('strong',`ฉบับของคุณคัดได้ ${edition.items.length} เรื่อง · ตั้งไว้สูงสุด ${edition.quota*4} เรื่อง (หมวดละ ${edition.quota})`),el('p',`รับมา ${data.items.length} พาดหัวในฉบับนี้ ก่อนคัดตามการตั้งค่าและกติกา จำนวนที่แต่ละคนเห็นจึงอาจต่างกัน${category!=='all'?` · ขณะนี้แสดงเฉพาะหมวด ${categories[category]}`:''}`));
 const list=el('ul',undefined,'coverage-list');
 for(const detail of coverageDetails(data.items,prefs,edition)){const row=el('li');row.append(el('strong',`${detail.label}: ${detail.count} จาก ${detail.target} เรื่อง`),el('span',detail.reason));list.append(row);}
 coverage.append(list,el('p','หมวดเปิดขอบฟ้าหมายถึงเรื่องนอกหัวข้อที่คุณเลือกสนใจ เมื่อข่าวไม่พอ เราจะแจ้งเหตุผลและไม่เติมข่าวหมวดอื่นแทนโดยอัตโนมัติ'));
 const adjust=el('button','ปรับหัวข้อที่สนใจ','text-button');adjust.onclick=()=>$('#settings-open').click();coverage.append(adjust);
 const container=$('#stories');container.replaceChildren();
 if(!items.length)container.append(el('p',view==='saved'?'ยังไม่มีเรื่องที่บันทึกในหมวดนี้ ลองกด “บันทึก” บนการ์ด':'ไม่มีเรื่องที่ผ่านเงื่อนไขในหมวดนี้ ลองเลือกจังหวัดหรือปรับหัวข้อที่สนใจ','empty'));
 items.forEach((item,i)=>{
  const card=el('article',undefined,`story ${item.category}`);const meta=el('div',undefined,'card-meta');meta.append(el('span',categories[item.category],'category'),el('span',item.topic),el('span',String(i+1).padStart(2,'0'),'story-number'));
  const heading=el('h3');const title=el('button',item.title,'story-title');title.onclick=()=>details(item);heading.append(title);
  const reason=el('p',`↗ ${item.reason}`,'card-reason');const bottom=el('div',undefined,'card-bottom');const explain=el('button','ทำไมฉันเห็นเรื่องนี้ ↗','explain');explain.onclick=()=>details(item);
  const bookmark=el('button',saved.includes(item.id)?'บันทึกแล้ว ✓':'บันทึก +','bookmark');bookmark.setAttribute('aria-pressed',String(saved.includes(item.id)));bookmark.setAttribute('aria-label',`${saved.includes(item.id)?'ยกเลิกบันทึก':'บันทึก'} ${item.title}`);bookmark.onclick=()=>{saved=saved.includes(item.id)?saved.filter(id=>id!==item.id):[...saved,item.id];store('oh-saved',saved);render();};
  bottom.append(explain,bookmark);card.append(meta,heading,el('p',item.summary,'card-summary'),reason,el('p',data.demo?'ข้อมูลตัวอย่าง · ยังไม่ใช่ข่าวจริง':`${item.sourceName} · ${date(item.publishedAt)}${item.kind==='headline'?' · พาดหัวต้นทาง ไม่มีสรุป AI':' · ผ่านการตรวจ'}`,'card-source'));
  if(item.kind==='headline'&&safeUrl(item.url)){const link=el('a','อ่านข่าวที่ต้นทาง ↗','source-link');link.href=safeUrl(item.url);link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
  card.append(bottom);container.append(card);
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
$('#policy-open').onclick=()=>{const body=$('#detail-body');body.replaceChildren();const labels={impact:'ผลกระทบ',urgency:'ความเร่งด่วน',publicValue:'ประโยชน์สาธารณะ',geography:'ความเกี่ยวข้องกับขอบเขตข่าว',freshness:'ความสด'};body.append(el('h2','กติกาที่คุณตรวจสอบได้'),el('p','เราเลือกความสำคัญและความหลากหลาย โดยไม่ใช้ยอดคลิก เวลาอ่าน หรือการแชร์มาจัดอันดับ'),el('h3','น้ำหนักคะแนน'),el('p',Object.entries(policy.weights).map(([key,w])=>`${labels[key]} ${Math.round(w*100)}%`).join(' · ')),el('h3','โควตาและช่องว่าง'),el('p',`เริ่มต้นหมวดละ ${policy.quotaPerCategory} เรื่อง เปลี่ยนจำนวนได้ใน “การรับรู้ของฉัน” ข่าวท้องถิ่นใช้จังหวัดที่คุณเลือก ข่าวเปิดขอบฟ้าตัดหัวข้อที่คุณระบุว่าสนใจออก ข่าวไม่พอแสดงช่องว่างโดยไม่เติมเงียบ ๆ`),el('h3','ที่มาของกติกา'),el('p',policy.origin?`นำเข้าจาก Google Sheet เมื่อ ${date(policy.origin.capturedAt)} (เวลาไทย) เป็นสำเนาที่ตรวจแล้ว การแก้ในชีตยังไม่อัปเดตเว็บไซต์อัตโนมัติ`:'กติกาตั้งต้นของระบบ'),el('h3','ข้อมูลและความเป็นส่วนตัว'),el('p','ต้นแบบนี้เก็บเฉพาะการตั้งค่าและรายการบันทึกในเบราว์เซอร์ ไม่มีบัญชี ไม่มีการติดตามการอ่าน และไม่มี API key อยู่ในหน้าเว็บ'),el('p',`นโยบายเวอร์ชัน ${policy.version} · คะแนนเบื้องต้น ไม่ใช่คำรับรองความสำคัญหรือความถูกต้องของข่าว`,'subtle'));showDialog('#detail');};
$('#reset').onclick=()=>{prefs={region:'none',topics:[],quota:3};saved=[];store(key,prefs);store('oh-saved',saved);$('#region').value='none';render();toast('ล้างข้อมูลที่บันทึกในเครื่องแล้ว');};
function network(){$('#network-status').hidden=navigator.onLine;}
addEventListener('online',network);addEventListener('offline',network);network();
try{const [response,policyResponse]=await Promise.all(['edition.json','ranking-policy.json'].map(file=>fetch(new URL('../public/data/'+file,import.meta.url),{cache:'no-cache'})));if(!response.ok||!policyResponse.ok)throw new Error('load');configurePolicy(await policyResponse.json());if(!read(key,null))prefs.quota=policy.quotaPerCategory;data=validateEdition(await response.json());if(!data.demo){$('#data-notice').replaceChildren(el('strong',data.mode==='headlines'?'ข่าวจริง · พาดหัวและลิงก์ต้นทาง':'ฉบับผ่านการตรวจ'),el('span',data.mode==='headlines'?`ดึงล่าสุด ${date(data.generatedAt)} · ยังไม่มีสรุป AI · ฉบับนี้ไม่ได้อัปเดตแบบเรียลไทม์`:'สรุปจากหลักฐานต้นทาง · ตรวจเวลาอัปเดตและแหล่งข่าวก่อนใช้ตัดสินใจ'));}$('#policy-status').textContent=policy.origin?`กติกาจาก Google Sheet · นำเข้า ${date(policy.origin.capturedAt)} · ยังไม่ซิงก์อัตโนมัติ`:'';render();}catch{$('#stories').append(el('p','ยังโหลดฉบับข่าวหรือกติกาที่ตรวจแล้วไม่ได้ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วเปิดใหม่','empty'));}
if('serviceWorker' in navigator)navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname}).catch(()=>{});
