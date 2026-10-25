# OpenAI connection check

เก็บ key ใน GitHub Repo → Settings → Secrets and variables → Actions → Repository secret ชื่อ `OPENAI_API_KEY`

Workflow `OpenAI connection check` ใช้ secret เฉพาะขั้นเรียก API ไม่มีการอ่านค่ากลับมาแสดง ไม่ใส่ในเว็บหรือชีต

การตั้งค่าครั้งแรก: commit ชื่อ `Run one OpenAI connection check` ซึ่งเพิ่มไฟล์ workflow นี้จะเรียกหนึ่งครั้ง หลังจากนั้น workflow รันผ่านปุ่ม Run workflow เท่านั้น การแก้เว็บ/PR/push ปกติไม่เรียก API

ใช้ `gpt-4.1-mini`, Responses API, output สูงสุด 256 tokens และข้อความสมมติสั้นที่สร้างเพื่อการทดสอบ ไม่มี auto retry ไม่มีการเผยแพร่ข่าวหรือเปลี่ยนข้อมูลหน้าเว็บ

ผลทดสอบตรวจการเชื่อมต่อ รูปแบบข้อมูล และการมี quote ในหลักฐาน ไม่ได้ยืนยันคุณภาพการสรุปข่าวจริง การรันทดสอบใช้ API ที่อาจมีค่าใช้จ่ายและต้องมีสิทธิ/โควตาของ project

หากผลเป็น 401 ให้ตรวจ key; 403 ให้ตรวจสิทธิ project/key; 404 ให้ตรวจโมเดล; 429 ให้ตรวจ quota/billing หรือ rate limit อย่าส่ง key หรือ raw error response ในแชต

เอกสารโมเดล: https://developers.openai.com/api/docs/models/gpt-4.1-mini

เอกสาร Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses
