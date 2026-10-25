import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify} from '../scripts/classify.mjs';
import {selectEdition} from '../src/core.js';
test('gold direct, macro, cyber and launches are distinct',()=>{
 for(const title of ['ช่องโหว่ PHP','PHP zero-day exploited'])assert.equal(classify(title,{}).topic,'ความปลอดภัยไซเบอร์');
 for(const title of ['Apple launches iPhone','Samsung announces phone','Tesla launches new vehicle'])assert.equal(classify(title,{}).topic,'เทคโนโลยี');
 assert.equal(classify('Gold falls before Fed decision',{}).goldRelevance,'direct');
 assert.equal(classify('US Dollar rises',{}).goldRelevance,'macro');
 assert.equal(classify('Samsung launches phone',{}).goldRelevance,null);
});
test('gold focus reserves room within daily limit, can be disabled, never fabricates missing gold',()=>{
 const items=Array.from({length:50},(_,n)=>({id:String(n).padStart(2,'0'),status:'approved',category:'world',sourceId:'s'+n%8,topic:'สังคม',scores:{impact:.5,urgency:.5,publicValue:.5,geography:.5,freshness:1-n/100},goldRelevance:n>=47?'direct':null}));
 const focused=selectEdition(items,{dailyLimit:24,goldFocus:true});
 assert.equal(focused.items.length,24);assert.equal(focused.items.filter(i=>i.goldRelevance==='direct').length,3);
 assert.equal(selectEdition(items,{dailyLimit:24,goldFocus:false}).items.filter(i=>i.goldRelevance).length,0);
 assert.equal(selectEdition(items.slice(0,40),{dailyLimit:24}).items.filter(i=>i.goldRelevance).length,0);
 assert.equal(selectEdition(items,{dailyLimit:24}).items.length,new Set(focused.items.map(i=>i.id)).size);
});

test('cyber focus coexists with gold within daily budget and can be disabled',()=>{
 const items=Array.from({length:45},(_,n)=>({id:String(n).padStart(2,'0'),status:'approved',category:'world',sourceId:'s'+n%8,topic:n>=39&&n<42?'ความปลอดภัยไซเบอร์':'สังคม',goldRelevance:n>=42?'direct':null,scores:{impact:.5,urgency:.5,publicValue:.5,geography:.5,freshness:1-n/100}}));
 for(const dailyLimit of [20,24,30]){const result=selectEdition(items,{dailyLimit});assert.equal(result.items.length,dailyLimit);assert.equal(result.items.filter(i=>i.topic==='ความปลอดภัยไซเบอร์').length,3);assert.equal(result.items.filter(i=>i.goldRelevance==='direct').length,3);assert.equal(new Set(result.items.map(i=>i.id)).size,dailyLimit);}
 assert.equal(selectEdition(items,{dailyLimit:24,cyberFocus:false}).items.filter(i=>i.topic==='ความปลอดภัยไซเบอร์').length,0);
});
