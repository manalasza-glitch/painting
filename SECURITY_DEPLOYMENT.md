# การติดตั้งระบบล็อกอินอย่างปลอดภัย

เว็บรุ่นนี้ต้องเผยแพร่ผ่าน Cloudflare Pages เพราะ GitHub Pages ไม่มีโค้ดฝั่งเซิร์ฟเวอร์และไม่สามารถออกคุกกี้ `HttpOnly` ได้

## 1. สร้าง Cloudflare Pages และ D1

1. เชื่อม Pages project กับ GitHub repository นี้
2. ตั้งค่า Build command เป็นค่าว่าง และ Output directory เป็น `.`
3. สร้าง D1 database ชื่อ `painting-auth`
4. ผูก D1 กับ Pages Functions โดยตั้งชื่อตัวแปรว่า `DB`
5. รัน migration `migrations/0001_auth.sql` กับฐานข้อมูล D1 ก่อนเปิดเว็บ

## 2. ตั้งค่า Secrets ใน Pages project

ตั้งค่าต่อไปนี้ใน Production environment และห้ามใส่ค่าจริงลง Git:

- `PASSWORD_PEPPER` — สุ่มอย่างน้อย 32 ไบต์
- `ADMIN_BOOTSTRAP_TOKEN` — รหัสลับใช้สร้าง Super Admin ครั้งแรก
- `SHEETS_API_URL` — URL deployment ของ Google Apps Script
- `APPS_SCRIPT_SHARED_SECRET` — สุ่มอย่างน้อย 32 ไบต์ และต้องตรงกับค่าใน Apps Script

หลังแก้ binding หรือ secret ให้ Redeploy Pages project หนึ่งครั้ง

## 3. ล็อก Google Apps Script

1. อัปเดต Apps Script ด้วยไฟล์ `appscript/code.gs`
2. เปิด Project Settings > Script Properties
3. เพิ่ม property ชื่อ `API_SHARED_SECRET`
4. ค่า property ต้องตรงกับ `APPS_SCRIPT_SHARED_SECRET` ใน Cloudflare
5. Deploy เป็น Web App เวอร์ชันใหม่

เมื่อทำขั้นตอนนี้แล้ว การเรียก Apps Script โดยตรงโดยไม่มี secret จะได้ `Unauthorized`

## 4. สร้าง Super Admin คนแรก

1. เปิด URL ของ Cloudflare Pages
2. ระบบจะแสดงหน้าสร้าง Super Admin อัตโนมัติเมื่อยังไม่มีผู้ดูแล
3. กรอกรหัสพนักงาน ชื่อ แผนก รหัสผ่าน และ `ADMIN_BOOTSTRAP_TOKEN`
4. หลังสร้างสำเร็จ ให้เข้าสู่ระบบด้วยรหัสพนักงานและรหัสผ่าน
5. ลบหรือหมุนค่า `ADMIN_BOOTSTRAP_TOKEN` หลังสร้าง Super Admin สำเร็จ

## 5. การสมัครของพนักงาน

พนักงานกรอกรหัสพนักงาน ชื่อ แผนก และตั้งรหัสผ่านเอง บัญชีจะเป็น `pending` และยังเข้าถึงข้อมูลไม่ได้จนกว่า Super Admin จะอนุมัติและเลือกสิทธิ์

## ข้อควรระวัง

- อย่าเผยแพร่รุ่นล็อกอินบน GitHub Pages อย่างเดียว เพราะ `/api/*` จะทำงานไม่ได้
- อย่าเก็บ `PASSWORD_PEPPER`, `ADMIN_BOOTSTRAP_TOKEN` หรือ `APPS_SCRIPT_SHARED_SECRET` ใน repository
- ต้องตรวจสอบตัวตนของผู้สมัครก่อนอนุมัติ เพราะรหัสพนักงานอาจถูกผู้อื่นทราบได้
