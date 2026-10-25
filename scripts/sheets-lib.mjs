import {validatePolicy,safeUrl,categories} from '../src/core.js';
export const headers={Sources:['source_id','name','feed_url','category','region','language','rights_status','enabled','notes'],Policy:['version','key','value','description'],Review:['event_id','title','source_url','summary','evidence','status','reviewed_by','reviewed_at','notes']};
export function parseTable(text,delimiter='\t'){
 if(typeof text!=='string'||text.length>2000000)throw new Error('Invalid or oversized table');
 const rows=[];let row=[],cell='',quoted=false;
 const input=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 for(let i=0;i<input.length;i++){const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else if(quoted||cell==='')quoted=!quoted;else cell+=c;}else if(!quoted&&(c===delimiter||c==='\n')){row.push(cell);cell='';if(c==='\n'){rows.push(row);row=[];}}else cell+=c;}
 if(quoted)throw new Error('Unclosed quote');row.push(cell);if(row.some(v=>v!==''))rows.push(row);
 return rows;
}
export function tableObjects(text,type){
 const rows=parseTable(text);const expected=headers[type];if(!rows.length||JSON.stringify(rows[0])!==JSON.stringify(expected))throw new Error(`Unexpected ${type} headers`);
 return rows.slice(1).filter(r=>r.some(v=>v.trim())).map(row=>{if(row.length!==expected.length)throw new Error(`Wrong ${type} column count`);return Object.fromEntries(expected.map((key,i)=>[key,row[i]]));});
}
export function importSnapshot(snapshot){
 if(snapshot?.schemaVersion!==1||snapshot.spreadsheetId!=='1EPCjlVVQORWxzeOFOlqyWXw5nmgd7vm69D_NRkxneck'||!Number.isFinite(Date.parse(snapshot.capturedAt)))throw new Error('Wrong spreadsheet or snapshot format');
 const sources=tableObjects(snapshot.tabs?.Sources?.tsv,'Sources');const rows=tableObjects(snapshot.tabs?.Policy?.tsv,'Policy');const reviews=tableObjects(snapshot.tabs?.Review?.tsv,'Review');
 if(rows.length!==6||new Set(rows.map(r=>r.key)).size!==6||new Set(rows.map(r=>r.version)).size!==1)throw new Error('Policy requires six unique keys and one version');
 const keys=['impact','urgency','publicValue','geography','freshness'];if(rows.some(r=>![...keys,'quota_per_category'].includes(r.key)||!r.value.trim()))throw new Error('Unknown policy key or empty value');
 const values=Object.fromEntries(rows.map(r=>[r.key,Number(r.value)]));
 const policy=validatePolicy({version:rows[0].version,weights:Object.fromEntries(keys.map(k=>[k,values[k]])),quotaPerCategory:values.quota_per_category,origin:{type:'google-sheet-snapshot',capturedAt:snapshot.capturedAt}});
 const ids=new Set();for(const s of sources){
  if(!s.source_id||ids.has(s.source_id)||!s.name||!categories[s.category]||!['pending','approved','denied'].includes(s.rights_status)||!['TRUE','FALSE'].includes(s.enabled.toUpperCase()))throw new Error('Invalid source configuration');
  ids.add(s.source_id);s.enabled=s.enabled.toUpperCase()==='TRUE';
  if(s.enabled&&(s.rights_status!=='approved'||!safeUrl(s.feed_url)))throw new Error('Enabled source must have approved rights and an HTTPS feed');
 }
 const decisions=reviews.filter(r=>r.event_id||r.status);const eventIds=new Set();
 for(const r of decisions){if(!r.event_id||eventIds.has(r.event_id)||!['pending','approved','rejected'].includes(r.status))throw new Error('Invalid review decision');eventIds.add(r.event_id);if(r.status==='approved'&&(!r.reviewed_by.trim()||!Number.isFinite(Date.parse(r.reviewed_at))))throw new Error('Approval needs reviewer and ISO timestamp');}
 return {policy,sources,reviews:decisions};
}
export function applyReviews(drafts,reviews){
 if(!Array.isArray(drafts))throw new Error('Draft array required');const result=[];
 for(const r of reviews.filter(x=>x.status==='approved')){
  const draft=drafts.find(d=>d.id===r.event_id);if(!draft)throw new Error('Unknown draft ID');
  let evidence;try{evidence=JSON.parse(r.evidence);}catch{throw new Error('Evidence JSON required');}
  if(draft.title!==r.title||draft.url!==r.source_url||draft.summary!==r.summary||JSON.stringify(draft.evidence)!==JSON.stringify(evidence))throw new Error('Stale approval: content differs from draft');
  if(!r.reviewed_by?.trim()||!Number.isFinite(Date.parse(r.reviewed_at)))throw new Error('Reviewer required');
  result.push({...draft,status:'approved',reviewedBy:r.reviewed_by,reviewedAt:r.reviewed_at});
 }
 return result;
}
