import {prioritizeTracked,followedIds} from './cve-watchlist.js?v=0.10.0';
import {dataFetch} from './data-source.js?v=0.10.0';
import {patchLabels,personalStates,https,isCve} from './cve-core.js?v=0.10.0';
const root=document.querySelector('#cve-panel');const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
let snapshot,local={},loaded=false,page=1;
try{local=JSON.parse(localStorage.getItem('oh-cve-watch'))||{};if(typeof local!=='object'||Array.isArray(local))local={};}catch{}
function save(){try{localStorage.setItem('oh-cve-watch',JSON.stringify(local));}catch{document.querySelector('#cve-status').textContent='บันทึกในเครื่องไม่ได้ การเปลี่ยนสถานะอาจหายเมื่อปิดหน้า';}}
function time(value){return value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'}):'ไม่ทราบ';}
function renderWatchlist(){
 const sidebar=document.querySelector('#cve-followed-list');sidebar.replaceChildren();const ids=followedIds(local);document.querySelector('#cve-followed-count').textContent=String(ids.length);
 if(!ids.length)sidebar.append(el('p','ยังไม่ได้ติดตาม CVE กด “ติดตาม CVE นี้” บนการ์ด แล้วรายการจะมาอยู่ตรงนี้','subtle'));
 for(const id of ids){const item=snapshot?.items.find(i=>i.id===id),state=local[id];const button=el('button',undefined,'cve-followed-link');button.append(el('strong',id),el('span',personalStates[state.state]||personalStates.watching));
 if(item)button.append(el('small',patchLabels[item.patchStatus]));else button.append(el('small','ไม่อยู่ในชุดข้อมูลปัจจุบัน'));
 if(state.tags)button.append(el('small',state.tags));button.disabled=!item;
 button.onclick=()=>{document.querySelector('#cve-query').value=id;document.querySelector('#cve-filter').value='all';page=1;render();const card=document.getElementById('card-'+id);if(card){card.scrollIntoView({behavior:'smooth',block:'start'});card.querySelector('h3').focus({preventScroll:true});}};sidebar.append(button);
 }
}
function render(){
 if(!snapshot)return;renderWatchlist();const query=document.querySelector('#cve-query').value.toLowerCase();const filter=document.querySelector('#cve-filter').value;
 let rows=snapshot.items.filter(i=>[i.id,i.title,i.kev?.vendor,i.kev?.product,...i.packages.map(p=>p.name),local[i.id]?.tags].join(' ').toLowerCase().includes(query));
 rows=rows.filter(i=>filter==='all'||filter==='tracked'&&local[i.id]?.tracked||filter==='kev'&&i.knownExploited||filter==='critical'&&i.severity==='critical'||filter==='patch'&&['available','partial'].includes(i.patchStatus)||filter==='open'&&local[i.id]?.tracked&&!['verified','not_affected'].includes(local[i.id]?.state));
 rows=prioritizeTracked(rows,local);
 const container=document.querySelector('#cve-list');container.replaceChildren();document.querySelector('#cve-count').textContent=rows.length+' CVE · แสดง '+Math.min(rows.length,page*20)+' รายการ';
 for(const item of rows.slice(0,page*20)){const state=local[item.id]||{};const card=el('article',undefined,'cve-card');card.id='card-'+item.id;const title=el('h3',item.id);title.tabIndex=-1;card.append(title,el('p',item.title,'cve-title'));
  const tags=el('div',undefined,'cve-badges');for(const tag of [item.severity.toUpperCase()+' · CVSS '+(item.score??'ไม่ทราบ'),item.knownExploited?'CISA KEV · มีการโจมตีจริง':null,patchLabels[item.patchStatus],item.reviewed?'GitHub reviewed':item.advisoryUrl?'ยังไม่ผ่าน GitHub review':null].filter(Boolean))tags.append(el('span',tag));card.append(tags);
  const track=el('button',state.tracked?'ติดตามแล้ว ✓':'ติดตาม CVE นี้','filter');track.setAttribute('aria-pressed',String(!!state.tracked));track.onclick=()=>{local[item.id]={...local[item.id],tracked:!local[item.id]?.tracked,state:local[item.id]?.state||'watching'};save();render();};card.append(track);
  const label=el('label','สถานะระบบของฉัน ');const select=el('select');select.setAttribute('aria-label','สถานะของ '+item.id);for(const [key,text] of Object.entries(personalStates)){const option=el('option',text);option.value=key;select.append(option);}select.value=state.state||'watching';select.onchange=()=>{local[item.id]={...local[item.id],tracked:true,state:select.value,changedAt:new Date().toISOString()};save();render();};label.append(select);card.append(label);
  const tagLabel=el('label','แท็กของฉัน ');const input=el('input');input.placeholder='เช่น production, PHP, ทีมเว็บ';input.maxLength=160;input.value=state.tags||'';input.setAttribute('aria-label','แท็กของ '+item.id);input.oninput=()=>{local[item.id]={...local[item.id],tags:input.value,tracked:true};track.textContent='ติดตามแล้ว ✓';track.setAttribute('aria-pressed','true');save();renderWatchlist();};tagLabel.append(input);card.append(tagLabel);
  card.append(el('p','สถานะและแท็กนี้บันทึกเฉพาะเครื่อง ไม่ได้สแกนหรือยืนยันการแพตช์ให้ และไม่สมัครอีเมลอัตโนมัติ','subtle'));
  const details=el('details');details.append(el('summary','รุ่นที่กระทบ · แพตช์ · ประวัติความคืบหน้า'));
  if(!item.packages.length)details.append(el('p','ยังไม่มีข้อมูลแพ็กเกจ/รุ่นแก้ไขที่ยืนยันในแหล่งนี้ ไม่ได้แปลว่ายังไม่มีแพตช์'));
  for(const p of item.packages)details.append(el('p',p.ecosystem+' / '+p.name+' · รุ่นที่กระทบ: '+p.affected+' · รุ่นแก้ไขตามประกาศ: '+(p.fixed||'ไม่ระบุ')));
  if(item.kev)details.append(el('p','CISA required action (ต้นฉบับ): '+item.kev.requiredAction));
  for(const event of item.history||[])details.append(el('p',time(event.at)+' · '+({new:'เริ่มติดตามข้อมูล',patch:'ข้อมูลรุ่น/แพตช์เปลี่ยน',exploited:'เพิ่มหลักฐานการโจมตีจริง',updated:'ข้อมูลความเสี่ยงเปลี่ยน'}[event.kind]||event.kind)+' · '+patchLabels[event.patchStatus]));
  const links=[['GitHub Advisory',item.advisoryUrl],['CISA KEV',item.kev?.url],...item.references.map((u,n)=>['เอกสารอ้างอิง '+(n+1),u])];for(const [name,url] of links)if(https(url)){const a=el('a',name+' ↗','source-link');a.href=https(url);a.target='_blank';a.rel='noopener noreferrer';details.append(a);}
  details.append(el('p','แหล่งแก้ไขล่าสุด: '+time(item.updatedAt)+' · ตรวจข้อมูลประกาศ: '+time(item.advisoryCheckedAt||item.checkedAt),'subtle'));card.append(details);container.append(card);
 }
 if(!rows.length)container.append(el('p','ไม่พบ CVE ที่ตรงกับตัวกรองนี้'));document.querySelector('#cve-more').hidden=rows.length<=page*20;
}
export async function openCves(){root.hidden=false;if(!loaded){try{const r=await dataFetch('cves.json',{cache:'no-cache'});if(!r.ok)throw Error();snapshot=await r.json();if(!Array.isArray(snapshot.items)||snapshot.items.some(i=>!isCve(i.id)||!Array.isArray(i.packages)||!patchLabels[i.patchStatus]))throw Error();loaded=true;document.querySelector('#cve-status').textContent='ข้อมูล ณ '+time(snapshot.generatedAt)+' · ตั้งตรวจทุก 6 ชั่วโมง ไม่ใช่เรียลไทม์'+(snapshot.sources.some(s=>s.status!=='ok')?' · บางแหล่งดึงไม่ได้ ข้อมูลบางรายการอาจเก่า':'');document.querySelector('#cve-scope').textContent=snapshot.scope;}catch{document.querySelector('#cve-status').textContent='โหลดข้อมูล CVE ไม่ได้ กรุณาลองใหม่เมื่อออนไลน์';return;}}render();}
document.querySelector('#cve-query').oninput=()=>{page=1;render();};document.querySelector('#cve-filter').onchange=()=>{page=1;render();};document.querySelector('#cve-more').onclick=()=>{page++;render();};
document.querySelector('#cve-export').onclick=()=>{const ids=Object.keys(local).filter(id=>isCve(id)&&local[id].tracked);const blob=new Blob([JSON.stringify({cveIds:ids},null,2)],{type:'application/json'});const a=el('a');a.href=URL.createObjectURL(blob);a.download='open-horizon-cve-watch.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};

setInterval(()=>{if(!root.hidden&&document.visibilityState==='visible'&&navigator.onLine){loaded=false;openCves();}},300000);

document.querySelector('#cve-show-followed').onclick=()=>{document.querySelector('#cve-query').value='';document.querySelector('#cve-filter').value='tracked';page=1;render();};
