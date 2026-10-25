// Headline rules, not article verification or a price forecast.
export function classify(title,source){
 const gold=/ทองคำ|ราคาทอง|\bgold\b|bullion/i.test(title);
 const driver=/เงินเฟ้อ|ดอกเบี้ย|ดอลลาร์|ค่าเงินบาท|\binflation\b|interest rate|\bfed\b|federal reserve|\bdollar\b|\byields?\b|monetary policy|FOMC/i.test(title);
 const cyber=/ช่องโหว่|แรนซัมแวร์|มัลแวร์|ไซเบอร์|\bPHP\b|vulnerabilit|zero.day|ransomware|malware|exploit|cyber|security patch/i.test(title)||source.topic==='ความปลอดภัยไซเบอร์';
 const tech=/เทคโนโลยี|แอปเปิล|ซัมซุง|เทสลา|\bTesla\b|\bApple\b|\bSamsung\b|\biPhone\b|\bAI\b|software|smartphone/i.test(title);
 const topic=gold?'ทองคำ':cyber?'ความปลอดภัยไซเบอร์':tech?'เทคโนโลยี':driver?'เศรษฐกิจ':/ฝุ่น|น้ำท่วม|โลกร้อน|climate/i.test(title)?'สิ่งแวดล้อม':/เศรษฐกิจ|ราคา|ภาษี|econom|market|trade/i.test(title)?'เศรษฐกิจ':/สุขภาพ|โรค|แพทย์|health|disease/i.test(title)?'สุขภาพ':source.topic||'สังคม';
 return {topic,goldRelevance:gold?'direct':driver?'macro':null};
}
