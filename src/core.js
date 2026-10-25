export const categories = {world:'โลก',thailand:'ไทย',local:'ท้องถิ่น',discovery:'เปิดขอบฟ้า'};
export const topics = ['สิ่งแวดล้อม','เทคโนโลยี','เศรษฐกิจ','สุขภาพ','สังคม','วิทยาศาสตร์','วัฒนธรรม','การศึกษา','ความปลอดภัยไซเบอร์','ทองคำ'];
export const policy = {version:'0.1.0',quotaPerCategory:3,weights:{impact:.30,urgency:.20,publicValue:.20,geography:.15,freshness:.15}};
export function validatePolicy(value) {
  const keys=['impact','urgency','publicValue','geography','freshness'];
  if(!value||typeof value.version!=='string'||!/^\d+\.\d+\.\d+$/.test(value.version)||![1,2,3].includes(value.quotaPerCategory)||!value.weights||Object.keys(value.weights).length!==5)throw new Error('Invalid policy');
  for(const key of keys)if(typeof value.weights[key]!=='number'||!Number.isFinite(value.weights[key])||value.weights[key]<0||value.weights[key]>1)throw new Error('Invalid policy weight');
  if(Math.abs(keys.reduce((sum,key)=>sum+value.weights[key],0)-1)>0.000001)throw new Error('Policy weights must sum to 1');
  if(value.origin&&(!Number.isFinite(Date.parse(value.origin.capturedAt))||value.origin.type!=='google-sheet-snapshot'))throw new Error('Invalid policy provenance');
  return value;
}
export function configurePolicy(value){validatePolicy(value);policy.version=value.version;policy.weights={...value.weights};policy.quotaPerCategory=value.quotaPerCategory;policy.origin=value.origin||null;}
export function score(item) {
  return Object.entries(policy.weights).reduce((sum,[key,w])=>sum+w*Math.min(1,Math.max(0,Number(item.scores[key])||0)),0);
}
export function selectEdition(items,prefs={}) {
  if([20,24,30].includes(Number(prefs.dailyLimit)))return selectDailyEdition(items,prefs);
  const quota = [1,2,3].includes(Number(prefs.quota)) ? Number(prefs.quota) : policy.quotaPerCategory;
  const selected=[]; const counts={}; const sourceCounts={};
  const sorted=[...items].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
  for(const category of Object.keys(categories)) {
    let count=0;
    for(const item of sorted) {
      if(count>=quota)break;
      if(item.category!==category || !isPublishable(item))continue;
      if(category==='local' && item.region!==prefs.region)continue;
      if(category==='discovery' && (prefs.topics||[]).includes(item.topic))continue;
      if(selected.some(x=>x.id===item.id))continue;
      if(item.sourceId && (sourceCounts[item.sourceId]||0)>=4)continue;
      selected.push(item); count++;
      if(item.sourceId)sourceCounts[item.sourceId]=(sourceCounts[item.sourceId]||0)+1;
    }
    counts[category]=count;
  }
  return {items:selected,counts,quota,policyVersion:policy.version};
}
function selectDailyEdition(items,prefs){
 const dailyLimit=Number(prefs.dailyLimit);const keys=Object.keys(categories);const targets=Object.fromEntries(keys.map((k,i)=>[k,Math.floor(dailyLimit/4)+(i<dailyLimit%4?1:0)]));
 const eligible=items.filter(i=>isPublishable(i)&&(i.category!=='local'||i.region===prefs.region)&&(i.category!=='discovery'||!(prefs.topics||[]).includes(i.topic))).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 const selected=[];const counts=Object.fromEntries(keys.map(k=>[k,0]));const filled={...counts};const sources={};const seen=new Set();
 const add=item=>{const identity=item.url?safeUrl(item.url)?.split('?')[0]:item.id;if(seen.has(identity)||(sources[item.sourceId]||0)>=Math.ceil(dailyLimit/2))return false;seen.add(identity);selected.push(item);counts[item.category]++;sources[item.sourceId]=(sources[item.sourceId]||0)+1;return true;};
 if(prefs.cyberFocus!==false)for(const item of eligible.filter(i=>i.topic==='ความปลอดภัยไซเบอร์').slice(0,3))add(item);
 if(prefs.goldFocus!==false){const focus=[...eligible.filter(i=>i.goldRelevance==='direct').slice(0,3),...eligible.filter(i=>i.goldRelevance==='macro').slice(0,2)];for(const item of focus)add(item);}
 for(const key of keys)for(const item of eligible){if(counts[key]>=targets[key])break;if(item.category===key)add(item);}
 if(prefs.fillGaps!==false)for(const item of eligible){if(selected.length>=dailyLimit)break;if(add(item))filled[item.category]++;}
 return {items:selected,counts,quota:Math.floor(dailyLimit/4),targets,dailyLimit,filled,fillGaps:prefs.fillGaps!==false,policyVersion:policy.version};
}
export function safeUrl(value) {
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function coverageDetails(items,prefs,edition){
 return Object.entries(categories).map(([key,label])=>{
  const candidates=items.filter(i=>i.category===key&&isPublishable(i));
  const filtered=key==='discovery'?candidates.filter(i=>(prefs.topics||[]).includes(i.topic)):[];
  const available=candidates.filter(i=>(key!=='local'||i.region===prefs.region)&&(key!=='discovery'||!(prefs.topics||[]).includes(i.topic)));
  const count=edition.counts[key];const target=edition.targets?.[key]??edition.quota;let reason;
  if(key==='local'&&(!prefs.region||prefs.region==='none'))reason='ยังไม่ได้เลือกจังหวัด จึงยังไม่เลือกข่าวท้องถิ่น';
  else if(key==='local'&&!available.length)reason=`ไม่พบพาดหัวที่ระบุพื้นที่ ${prefs.region} ในฉบับนี้`;
  else if(key==='discovery'&&filtered.length&&!available.length)reason=`พาดหัวเปิดขอบฟ้า ${filtered.length} รายการในฉบับนี้อยู่ในหัวข้อ ${[...new Set(filtered.map(i=>i.topic))].join(' / ')} ซึ่งคุณเลือกเป็นความสนใจแล้ว จึงไม่เหลือเรื่องนอกความสนใจจากแหล่งที่มีอยู่`;
  else if(edition.filled?.[key])reason=`รวม ${edition.filled[key]} เรื่องที่เติมจากหมวดนี้ เพราะหมวดอื่นมีข่าวผ่านเงื่อนไขไม่พอ ตามตัวเลือกเติมข่าวที่เปิดไว้`;
  else if(count>=target)reason='ครบตามสัดส่วนเริ่มต้น';
  else if(!candidates.length)reason='ยังไม่มีพาดหัวในหมวดนี้จากแหล่งที่นำเข้า';
  else if(available.length>count)reason=`มี ${available.length} พาดหัวที่ผ่านเงื่อนไข แต่เลือกได้ ${count} เรื่องภายใต้ข้อจำกัดจำนวนข่าวต่อแหล่ง`;
  else reason=`มีพาดหัวผ่านเงื่อนไข ${available.length} รายการ${filtered.length?` หลังตัด ${filtered.length} รายการที่ตรงกับความสนใจเดิม`:''} จึงยังไม่ครบจำนวนที่ตั้งไว้`;
  return {key,label,count,target,excludedByInterest:filtered.length,reason};
 });
}
export function isPublishable(item){return item.status==='approved'||(item.kind==='headline'&&item.status==='metadata'&&!!safeUrl(item.url)&&!!item.sourceName);}
export function validateEdition(data) {
  if(!data || !Array.isArray(data.items) || typeof data.demo!=='boolean' || !Number.isFinite(Date.parse(data.generatedAt)))throw new Error('Invalid edition');
  if(data.items.length>500)throw new Error('Too many items');
  const ids=new Set();
  for(const item of data.items){
    if(!item.id||ids.has(item.id)||!categories[item.category]||!topics.includes(item.topic)||typeof item.title!=='string'||typeof item.summary!=='string'||!item.scores||!Number.isFinite(Date.parse(item.publishedAt)))throw new Error('Invalid story');
    ids.add(item.id);
    for(const key of Object.keys(policy.weights)) if(typeof item.scores[key]!=='number'||item.scores[key]<0||item.scores[key]>1)throw new Error('Invalid score');
    if(!data.demo&&item.kind==='headline'){
      if(data.mode!=='headlines'||item.status!=='metadata'||!item.sourceName||!safeUrl(item.url)||!safeUrl(item.feedUrl)||item.sentences?.length!==0||item.evidence?.length!==0)throw new Error('Invalid headline metadata');
      continue;
    }
    if(!data.demo && (item.status!=='approved'||!item.sourceName||!safeUrl(item.url)||!Array.isArray(item.sentences)||!item.sentences.length||!Array.isArray(item.evidence)))throw new Error('Unreviewed story');
    if(!data.demo)for(const sentence of item.sentences){
      if(!sentence.text||!Array.isArray(sentence.evidenceIds)||!sentence.evidenceIds.length||sentence.evidenceIds.some(id=>!item.evidence.some(e=>e.id===id&&e.text)))throw new Error('Missing evidence');
    }
  }
  return data;
}
