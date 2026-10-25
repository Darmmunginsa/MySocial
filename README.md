# Open Horizon · เปิดขอบฟ้าการรับรู้

ต้นแบบ Web/PWA ภาษาไทยสำหรับ Information Autonomy ไม่มี dependency ที่ต้องติดตั้ง ใช้ Node.js 22 ขึ้นไป

## เริ่มดูเว็บ

```sh
node --test
node scripts/build.mjs
node scripts/serve.mjs
```

เปิด http://127.0.0.1:4173 เว็บเริ่มด้วย **สถานการณ์สมมติทั้งหมด** ไม่ใช่ข่าวจริง ไม่เรียก API และไม่ใช้ key

มีหมวดโลก ไทย ท้องถิ่น และเปิดขอบฟ้า ปรับจังหวัด/หัวข้อ/จำนวนเรื่อง ดูเหตุผลและคะแนน บันทึกในเครื่อง และอ่านฉบับที่เคยเปิดเมื่อออฟไลน์หลัง service worker ติดตั้งสำเร็จ

## สถานะจริงของรุ่นนี้

- ใช้งานแล้ว: หน้าเว็บ responsive, deterministic ranking, local preferences/bookmarks, explanation, mock edition, offline cache พื้นฐาน
- เตรียมไว้: OpenAI Responses CLI พร้อม schema และ quote validation; human-review publication gate
- ยังไม่เชื่อม: Google Sheet ของผู้ใช้, RSS ingestion, extraction, clustering, authentication, production editorial workflow
- ยังไม่รับรอง: คุณภาพสรุปข่าวจริง, semantic grounding อัตโนมัติ, installability ทุกอุปกรณ์, offline เต็มรูปแบบทุก browser
- น้ำหนัก ranking กำหนดใน `src/core.js`; CSV Policy เป็นแบบตารางสำหรับเชื่อมในขั้นถัดไป ยังไม่ซิงก์โดยอัตโนมัติ

## Google Sheet

ชีตเป้าหมาย: https://docs.google.com/spreadsheets/d/1EPCjlVVQORWxzeOFOlqyWXw5nmgd7vm69D_NRkxneck/edit

ยังไม่ได้อ่านหรือแก้ชีต เพราะ connector ไม่พร้อมใช้งาน และ browser ต้องลงชื่อเข้าใช้ ไม่จำเป็นต้องเปิดชีตเป็นสาธารณะ

เตรียม `config/Sources.csv`, `Policy.csv`, `Review.csv` ให้ import เป็น **แท็บใหม่** หลังตรวจว่าไม่ทับข้อมูลเดิม ห้ามเก็บ API key ในชีต

ขั้นถัดไป: ยืนยันชื่อแท็บ/คอลัมน์จริงและเลือกช่องทางอ่านแบบมีสิทธิ (Google service account หรือ Apps Script ที่ตรวจสิทธิแล้ว) ก่อนเชื่อม live ไม่ถือว่า connector ของแชตใช้แทน credentials ของแอปได้

## OpenAI — ใช้เฉพาะฝั่ง CLI/server

1. คัดลอก `.env.example` เป็น `.env` ตั้ง `OPENAI_API_KEY` และ `OPENAI_MODEL` ด้วยตัวเอง ห้าม commit key
2. เลือกโมเดลในบัญชีที่รองรับ Responses และ Structured Outputs
3. เตรียม `private/evidence.json` ตาม `config/evidence.example.json` ด้วยเนื้อหาที่ตรวจสิทธิแล้ว
4. ตั้งงบในบัญชีและ `OPENAI_MAX_CALLS` (ค่าเริ่มต้น 12 สูงสุด 24 ครั้ง/รัน)
5. รัน:

```sh
node --env-file-if-exists=.env scripts/draft.mjs private/evidence.json
```

ผลอยู่ใน `private/drafts.json` ที่ถูก ignore สคริปต์ไม่มี auto retry และไม่แก้เว็บโดยอัตโนมัติ เพดานต่อรันไม่ใช่เพดานค่าใช้จ่ายรายเดือน

ผู้ตรวจต้องตรวจความจริง การอ้างอิง สิทธิ และตัวเลขด้วยตนเอง การพบ quote ในต้นฉบับไม่ได้พิสูจน์ว่า AI สรุปถูก ต้องแก้ `status` เป็น `approved` และเพิ่ม `reviewedBy`, `reviewedAt` (ISO date) หลังตรวจจริง จากนั้น:

```sh
node scripts/publish-reviewed.mjs private/reviewed.json
node --test
node scripts/build.mjs
```

คำสั่งนี้เตรียมฉบับในเครื่อง ไม่ deploy เอง อย่าใช้ข้อมูลตัวอย่างแล้วตั้ง `demo:false` เพื่อให้ดูเหมือนข่าวจริง

อ้างอิง: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

## การเผยแพร่

`dist/` เป็นเว็บ static นำไปใช้กับ GitHub Pages หรือ static hosting ได้ โดยไม่มี key ในเว็บ Workflow `check.yml` ตรวจและสร้าง artifact เท่านั้น ไม่เปิด public Pages หรือเรียก AI

Sites preview ใช้ `.openai/hosting.json` ที่ผูกกับ private Site แยกจาก GitHub Repo การ sync แก้ไขครั้งถัดไปต้องทำทั้งสองปลายทาง

## ข้อจำกัดก่อนใช้กับข่าวจริง

ยังต้องเพิ่ม source rights registry จริง, ingest/cluster, audit snapshots, correction/tombstone, source exclusion, security review และการตรวจคุณภาพด้วยมนุษย์ ฉบับออฟไลน์เก่าอาจยังมีข้อมูลที่ถูกแก้ไขแล้วจนกว่าจะออนไลน์อีกครั้ง ฟอนต์ภายนอกอาจใช้ไม่ได้ออฟไลน์และจะ fallback เป็นฟอนต์ระบบ
