import {test} from 'node:test';import assert from 'node:assert/strict';
import {checkOpenAI} from '../scripts/openai-check.mjs';
test('one request, server-only key, bounded output, no stored response',async()=>{
 let calls=0;const result=await checkOpenAI({key:'test-only-placeholder',fetchFn:async(url,request)=>{
  calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(request.headers.Authorization,'Bearer test-only-placeholder');
  const body=JSON.parse(request.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,256);assert(!JSON.stringify(body).includes('test-only-placeholder'));
  return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({product:'Open Horizon',summary:'ฉบับทดลองไม่ใช้ยอดคลิกจัดอันดับ',evidence_quote:'ไม่ใช้ยอดคลิกในการจัดอันดับ'})}]}],usage:{input_tokens:200,output_tokens:50,total_tokens:250}})};
 }});assert.equal(calls,1);assert.equal(result.status,'passed');assert(!JSON.stringify(result).includes('test-only-placeholder'));
});
test('missing secret never calls API',async()=>{let calls=0;await assert.rejects(checkOpenAI({key:'',fetchFn:()=>calls++}),/Missing/);assert.equal(calls,0);});
test('quota errors do not retry or reveal server response',async()=>{let calls=0;await assert.rejects(checkOpenAI({key:'test-only',fetchFn:async()=>{calls++;return {ok:false,status:429,json:()=>{throw Error('must not read');}};}}),/429/);assert.equal(calls,1);});
test('unsupported evidence is rejected',async()=>{await assert.rejects(checkOpenAI({key:'test-only',fetchFn:async()=>({ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({product:'Open Horizon',summary:'unsupported',evidence_quote:'not in the evidence'})}]}]})})}),/validation failed/);});
