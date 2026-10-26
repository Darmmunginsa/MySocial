export const dayKey=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export const storyKey=item=>item.url?item.url.split('?')[0]:item.id;
export function mergeStories(editions){return [...new Map(editions.flatMap(e=>e.items).map(i=>[i.id,i])).values()];}
export function filterHistory(items,{query='',day='',state='all',read={}}={}){return items.filter(i=>(!query||[i.title,i.titleTh,i.topic,i.sourceName].join(' ').toLowerCase().includes(query.toLowerCase()))&&(!day||dayKey(i.publishedAt)===day)&&(state==='all'||(state==='read'?!!read[i.id]:!read[i.id])));}
