export const categories = {world:'โลก',thailand:'ไทย',local:'ท้องถิ่น',discovery:'เปิดขอบฟ้า'};
export const topics = ['สิ่งแวดล้อม','เทคโนโลยี','เศรษฐกิจ','สุขภาพ','สังคม','วิทยาศาสตร์','วัฒนธรรม','การศึกษา'];
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
  const quota = [1,2,3].includes(Number(prefs.quota)) ? Number(prefs.quota) : policy.quotaPerCategory;
  const selected=[]; const counts={}; const sourceCounts={};
  const sorted=[...items].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
  for(const category of Object.keys(categories)) {
    let count=0;
    for(const item of sorted) {
      if(count>=quota)break;
      if(item.category!==category || item.status!=='approved')continue;
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
export function safeUrl(value) {
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validateEdition(data) {
  if(!data || !Array.isArray(data.items) || typeof data.demo!=='boolean' || !Number.isFinite(Date.parse(data.generatedAt)))throw new Error('Invalid edition');
  if(data.items.length>500)throw new Error('Too many items');
  const ids=new Set();
  for(const item of data.items){
    if(!item.id||ids.has(item.id)||!categories[item.category]||!topics.includes(item.topic)||typeof item.title!=='string'||typeof item.summary!=='string'||!item.scores||!Number.isFinite(Date.parse(item.publishedAt)))throw new Error('Invalid story');
    ids.add(item.id);
    for(const key of Object.keys(policy.weights)) if(typeof item.scores[key]!=='number'||item.scores[key]<0||item.scores[key]>1)throw new Error('Invalid score');
    if(!data.demo && (item.status!=='approved'||!item.sourceName||!safeUrl(item.url)||!Array.isArray(item.sentences)||!item.sentences.length||!Array.isArray(item.evidence)))throw new Error('Unreviewed story');
    if(!data.demo)for(const sentence of item.sentences){
      if(!sentence.text||!Array.isArray(sentence.evidenceIds)||!sentence.evidenceIds.length||sentence.evidenceIds.some(id=>!item.evidence.some(e=>e.id===id&&e.text)))throw new Error('Missing evidence');
    }
  }
  return data;
}
