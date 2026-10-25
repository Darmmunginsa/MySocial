# Google Sheet connection — v0.2

ชีต MySocial ยังคงเป็น private ไม่เปลี่ยนการแชร์ ไม่ฝัง Google credentials และไม่เรียก OpenAI จากเบราว์เซอร์

## สิ่งที่เชื่อมแล้ว

- Sources: ทะเบียนผู้สมัครแหล่งข่าว 3 รายการ ยังปิดทั้งหมด ไม่มี feed URL ที่สมมติขึ้น
- Policy: weights รวม 1.0 และโควตาหมวดละ 3
- Review: ตารางตัดสินใจอนุมัติพร้อมแหล่งและหลักฐาน ยังไม่มีข่าวจริงที่อนุมัติ
- นำค่าที่อ่านกลับจากชีตผ่าน browser เป็น snapshot แล้วตรวจ schema ก่อนส่งกติกาให้เว็บ
- เว็บแสดงเวลานำเข้า และบอกว่าไม่ซิงก์อัตโนมัติ

## นำเข้าครั้งถัดไป

Snapshot แบบเดียวกับ `private/sheets-snapshot.json` ที่สร้างในเครื่องมีโครงสร้าง:

```json
{"schemaVersion":1,"spreadsheetId":"1EPCjlVVQORWxzeOFOlqyWXw5nmgd7vm69D_NRkxneck","capturedAt":"ISO UTC timestamp","tabs":{"Sources":{"gid":0,"tsv":"header and rows"},"Policy":{"gid":1248707157,"tsv":"header and rows"},"Review":{"gid":857889652,"tsv":"header and rows"}}}
```

`tsv` คือค่าจากช่วงที่มีข้อมูลของแต่ละแท็บ คัดลอกผ่านหน้า Google Sheets ที่ล็อกอินแล้ว ไม่ใช่เปิดเป็น public CSV

```sh
node scripts/import-sheet.mjs private/sheets-snapshot.json
node --test
node scripts/build.mjs
```

ถ้าแก้น้ำหนักหรือโควตา ให้เพิ่ม version ในทุกแถวของ Policy เช่น 0.1.1 มิฉะนั้น importer ปฏิเสธ เพื่อไม่ให้เวอร์ชันเดียวมีหลายกติกา

แถว Sources ที่ `enabled=TRUE` ต้องมี `rights_status=approved` และ HTTPS feed URL ที่ตรวจแล้ว แต่ importer นี้ยังไม่ fetch RSS

## เชื่อมการตรวจข่าว

Review ใช้ตัดสินใจจากร่างที่ระบบสร้าง ไม่ใช้เป็นที่พิมพ์ข่าวใหม่อย่างไม่มีหลักฐาน:

1. ใส่ `event_id`, `title`, `source_url`, `summary` ให้ตรงกับร่าง
2. `evidence` เป็น JSON ของ evidence array จากร่าง
3. ตรวจข้อเท็จจริงและสิทธิ แล้วเปลี่ยน `status` เป็น `approved`
4. กรอก `reviewed_by` และ `reviewed_at` แบบ ISO เช่น `2026-10-25T08:00:00+07:00`
5. อ่าน snapshot ใหม่แล้วรัน:

```sh
node scripts/import-sheet.mjs private/sheets-snapshot.json private/drafts.json
node scripts/publish-reviewed.mjs private/reviewed.json
```

Importer ปฏิเสธการอนุมัติหาก summary/title/url/evidence ไม่ตรงกับร่าง ป้องกันใช้ผลอนุมัติของเนื้อหาเก่า ทั้งนี้ยังต้องตรวจโดยมนุษย์ ไม่ใช่เครื่องยืนยันความจริง

## สิ่งที่ยังไม่เชื่อมอัตโนมัติ

การลงชื่อเข้า Google ในเบราว์เซอร์อนุญาตให้ทำงานผ่านหน้าเว็บ แต่ไม่ได้ให้ credential สำหรับ server หรือ GitHub Actions

การซิงก์แบบอัตโนมัติต้องเลือกการเชื่อมต่อแบบมีสิทธิ เช่น service account ที่ได้รับสิทธิอ่านเฉพาะไฟล์นี้ หรือ Apps Script ที่กำหนดขอบเขตและตัวตนผู้เรียกได้ก่อน ไม่เปิด anonymous endpoint และไม่ส่ง session/cookie จากเบราว์เซอร์ไปให้แอป

ไม่มีการเพิ่มสิทธิแอปหรือสร้าง credential ระหว่างการตั้งค่ารุ่นนี้
