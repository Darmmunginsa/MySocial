export function validIds(value){return Array.isArray(value)&&value.length<=30&&value.every(id=>typeof id==='string'&&/^CVE-\d{4}-\d{4,}$/.test(id))&&new Set(value).size===value.length;}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});}
export function makeWorker(assets={}){return {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/email-watchlist'){
  const user=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
  // Dispatch enforces the owner-private Site for ALL requests. Authenticated
  // visitor operations additionally verify the configured owner email.
  const owner=!!user&&!!email&&email.toLowerCase()===String(env.CVE_OWNER_EMAIL||'').toLowerCase();
  const service=request.headers.get('x-oh-watch-service-key');
  const serviceRead=!!env.CVE_WATCH_READ_KEY&&service===env.CVE_WATCH_READ_KEY;
  if(!owner&&!(request.method==='GET'&&serviceRead))return json({error:'owner_sign_in_required'},401);
  if(!env.DB)return json({error:'storage_unavailable'},503);
  try{
   if(request.method==='GET'){
    const row=await env.DB.prepare('SELECT ids_json, revision, updated_at FROM email_watchlist WHERE id = 1').first();
    const initial=(env.INITIAL_CVE_WATCH_IDS||'').split(/[\s,]+/).filter(Boolean);
    const ids=row?JSON.parse(row.ids_json):initial;if(!validIds(ids))return json({error:'invalid_saved_list'},503);
    return json({ids,revision:row?.revision||0,updatedAt:row?.updated_at||null,configured:true});
   }
   if(request.method!=='PUT')return json({error:'method_not_allowed'},405);
   if(!owner)return json({error:'owner_sign_in_required'},401);
   if(request.headers.get('origin')!==url.origin||!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'same_origin_required'},403);
   const text=await request.text();if(text.length>4096)return json({error:'too_large'},413);
   let body;try{body=JSON.parse(text);}catch{return json({error:'invalid_json'},400);}
   if(!validIds(body.ids)||!Number.isInteger(body.revision)||body.revision<0)return json({error:'invalid_list'},400);
   const at=new Date().toISOString();
   const result=body.revision===0
    ?await env.DB.prepare('INSERT INTO email_watchlist (id, ids_json, revision, updated_at, updated_by) VALUES (1, ?, 1, ?, ?) ON CONFLICT(id) DO NOTHING').bind(JSON.stringify(body.ids),at,user).run()
    :await env.DB.prepare('UPDATE email_watchlist SET ids_json = ?, revision = revision + 1, updated_at = ?, updated_by = ? WHERE id = 1 AND revision = ?').bind(JSON.stringify(body.ids),at,user,body.revision).run();
   if(result.meta.changes!==1)return json({error:'version_conflict'},409);
   return json({ids:body.ids,revision:body.revision+1,updatedAt:at,configured:true});
  }catch{return json({error:'storage_unavailable'},503);}
 }
 if(url.pathname.startsWith('/api/'))return json({error:'not_found'},404);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const path=url.pathname==='/'?'/index.html':url.pathname;
 if(path.startsWith('/public/data/')&&!path.includes('..')){
  try{const r=await fetch('https://raw.githubusercontent.com/Darmmunginsa/MySocial/main'+path,{signal:AbortSignal.timeout(15000)});if(r.ok)return new Response(request.method==='HEAD'?null:r.body,{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff'}});}catch{}
 }
 const item=assets[path];if(!item)return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:item.body,{headers:{'content-type':item.type,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://raw.githubusercontent.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"}});
}};}
export default makeWorker(typeof STATIC_ASSETS==='undefined'?{}:STATIC_ASSETS);
