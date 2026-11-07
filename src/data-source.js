// The private preview reads the same PUBLIC snapshots produced by GitHub Actions.
// No visitor settings, watch tags, email addresses or credentials are transmitted.
export async function dataFetch(file,options={}){
 if(!/^[a-zA-Z0-9/._-]+$/.test(file)||file.includes('..'))throw Error('Invalid data path');
 const local=new URL('../public/data/'+file,import.meta.url);
 if(location.hostname.endsWith('.chatgpt.site')){
  try{const r=await fetch('https://raw.githubusercontent.com/Darmmunginsa/MySocial/main/public/data/'+file,{...options,signal:AbortSignal.timeout(15000)});if(r.ok)return r;}catch{}
 }
 return fetch(local,options);
}
