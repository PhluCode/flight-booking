# AERIS — Flight & Car Booking UI

เว็บไซต์จองตั๋วเครื่องบิน (และรถเช่า) โทนขาว-ดำ-เทาสไตล์มินิมอล
ออกแบบตาม reference ของ TUXIMO พร้อมปุ่มสลับภาษา **ไทย / อังกฤษ**

> สถานะปัจจุบัน: **UI / Frontend เท่านั้น** — ยังไม่มี backend, database หรือระบบจ่ายเงิน
> ข้อมูลทั้งหมดถูกแยกไว้ใน `js/data.js` เพื่อให้ต่อยอดเป็น API จริงได้ภายหลัง

## วิธีเปิดดู (How to run)

ไม่ต้องติดตั้งอะไรเลย — **ดับเบิลคลิกที่ `index.html`** เปิดในเบราว์เซอร์ได้ทันที
(ทุกอย่างเป็น HTML/CSS/JavaScript ล้วน ไม่ต้องใช้เซิร์ฟเวอร์)

ถ้าต้องการรันผ่าน local server (เช่นเตรียมต่อ API ในอนาคต):

```bash
# Python
python -m http.server 5500
# หรือ Node
npx serve .
```

## หน้าเว็บ (Pages)

| ไฟล์ | หน้า | รายละเอียด |
|------|------|-----------|
| `index.html`    | หน้าแรก          | ฮีโร่ "จะบินไปไหนดี?" + การ์ดค้นหา (เที่ยวบิน / รถเช่า), จุดหมายยอดนิยม |
| `flights.html`  | ผลการค้นหาเที่ยวบิน | render จากข้อมูล + ตัวกรอง (จุดแวะ/สายการบิน/ราคา/เวลา) + ค้นหาแบบ debounce + เรียงลำดับ |
| `login.html`    | เข้าสู่ระบบ / สมัคร | สลับโหมด login–register, validation ฝั่ง client, แสดง/ซ่อนรหัสผ่าน |
| `profile.html`  | โปรไฟล์           | ข้อมูลส่วนตัว (แก้ไขได้), ความชอบการเดินทาง, ไมล์สะสม |
| `bookings.html` | ประวัติการจอง     | รายการจองจาก localStorage + ตัวกรองตามสถานะ |

## โครงสร้างไฟล์

```
Flight_Project/
├── index.html, flights.html, login.html, profile.html, bookings.html
├── css/styles.css            # design system (tokens + components)
└── js/
    ├── icons.js              # ชุดไอคอน SVG + ภาพประกอบ
    ├── i18n.js               # ดิกชันนารีไทย/อังกฤษ + ตัวแปลภาษา
    ├── data.js               # แหล่งข้อมูล (สนามบิน/สายการบิน/เที่ยวบิน/การจอง)
    ├── app.js                # navbar, footer, สลับภาษา, auth state, toast
    ├── home.js / flights.js / auth.js / profile.js / bookings.js
```

## หลักการที่ใช้ (อิงจากไฟล์อาจารย์ "Architectural Best Practice")

แม้จะยังเป็นแค่ UI แต่วางโครงให้ตรงเกณฑ์ไว้แล้ว:

- **Separation of Content & UI** — ข้อมูลอยู่ใน `data.js` แยกจาก HTML, render แบบ dynamic ทั้งหมด ไม่ hard-code
- **Event Delegation** — ใช้ listener เดียวบน container จัดการ tab/filter/ปุ่ม (ดู `flights.js`, `home.js`)
- **Debouncing** — ช่องค้นหาเที่ยวบินหน่วงเวลา 280ms ลดการ render ซ้ำ
- **Single Source of Truth & Continuity** — สถานะตัวกรองเก็บในอ็อบเจกต์เดียว, ภาษาและการจองเก็บใน `localStorage` (อยู่รอดเมื่อรีเฟรช)

## สิ่งที่จะทำต่อ (Next steps)

- เชื่อม `data.js` เข้ากับ REST API จริง (`fetch('/api/flights')`)
- ระบบ Auth จริง (bcrypt + JWT) ตาม Session 5–6
- หน้า checkout / placing an order ("bypass payment")
