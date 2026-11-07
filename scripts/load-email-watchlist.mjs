import {appendFileSync} from 'node:fs';import {pathToFileURL} from 'node:url';
export async function loadWatchlist({url,token,readKey,legacy='',fetchFn=fetch}={}){
 if(!url)return {ids:legacy.split(/[\s,]+/).filter(Boolean),scope:'legacy'};
 const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='open-horizon-mysocial.darmmunginsa.chatgpt.site'||u.pathname!=='/api/email-watchlist'||u.search||u.hash)throw Error('Unexpected private Site endpoint');
 if(!token||!readKey)throw Error('Missing private Site service credentials');
 const response=await fetchFn(u.href,{headers:{'OAI-Sites-Authorization':'Bearer '+token,'X-OH-Watch-Service-Key':readKey},redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Saved email watchlist unavailable');const body=await response.json();
 if(!Array.isArray(body.ids)||body.ids.length>30||body.ids.some(id=>typeof id!=='string'||!/^CVE-\d{4}-\d{4,}$/.test(id))||body.configured!==true||!Number.isInteger(body.revision))throw Error('Invalid saved email watchlist');
 return {ids:body.ids,scope:'watchlist',revision:body.revision};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)loadWatchlist({url:process.env.CVE_WATCH_SITE_URL,token:process.env.CVE_WATCH_SITE_TOKEN,readKey:process.env.CVE_WATCH_READ_KEY,legacy:process.env.CVE_WATCH_IDS}).then(result=>{if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'ids='+result.ids.join(',')+'\nscope='+result.scope+'\n');console.log(JSON.stringify({scope:result.scope,count:result.ids.length,revision:result.revision??null}));}).catch(()=>{console.error('Saved email watchlist unavailable. Email will be skipped; no fallback to all CVEs.');process.exitCode=1;});
