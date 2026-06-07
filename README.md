# Ticket App

ระบบจัดการงานแบบ Kanban สำหรับทีมขนาดเล็ก รันบนเซิร์ฟเวอร์ภายในองค์กร

## ฟีเจอร์

### บอร์ด
- **Kanban Board** — ลากการ์ดข้ามคอลัมน์ TODO / กำลังทำ / ติดขัด / เสร็จแล้ว และเรียงลำดับภายในคอลัมน์ได้
- **WIP Limit** — กำหนดจำนวน ticket สูงสุดต่อคอลัมน์ หัวคอลัมน์จะเปลี่ยนเป็นสีแดงเมื่อเกิน (บันทึกต่อเบราว์เซอร์)
- **Bulk Actions** — เลือกหลาย ticket พร้อมกันผ่าน checkbox แล้วเปลี่ยน status / assignee / ลบทีเดียว
- **Keyboard Shortcuts** — `N` สร้าง ticket · `?` ดู shortcut ทั้งหมด · `Esc` ยกเลิกการเลือก
- **Filter ใน URL** — ตัวกรอง search / assignee / label ถูกบันทึกใน URL สามารถแชร์ลิงก์ได้
- **ค้นหาแบบ real-time** — ค้นหาจาก title และ description ทันทีโดยไม่ต้องโหลดหน้าใหม่
- **Export CSV** — ดาวน์โหลด ticket ที่กำลังแสดงอยู่เป็นไฟล์ spreadsheet

### Ticket
- **ข้อมูล** — ชื่อ, รายละเอียด (Markdown), สถานะ, ความสำคัญ, ผู้รับผิดชอบ, วันกำหนด, label
- **Subtasks** — รายการงานย่อยพร้อม progress bar แสดงบนการ์ดด้วย
- **Relations** — เชื่อม ticket ว่า *blocks*, *relates to* หรือ *duplicate of*
- **Notes** — ใส่ note ใน ticket ได้ทุกคน พิมพ์ `@ชื่อ` เพื่อ mention เพื่อนร่วมทีม (autocomplete + highlight)
- **Activity Log** — บันทึกการเปลี่ยนแปลง status, priority, assignee พร้อม timestamp
- **Due Date Badge** — สีบนการ์ด: เกินกำหนด=แดง / วันนี้=ส้ม / ≤3 วัน=เหลือง / ปกติ=เทา

### ผู้ใช้งาน
- **User Color** — แต่ละคนเลือกสีประจำตัวได้ แสดงบน avatar ทุกจุดในระบบ
- **สิทธิ์** — ผู้ใช้แก้ไขได้เฉพาะ ticket ของตัวเอง Admin แก้ไขได้ทุก ticket
- **User Management** — Admin จัดการสิทธิ์และลบบัญชีได้จาก UI โดยตรง ไม่ต้องใช้ Prisma Studio
- **Multi-user** — ยืนยันตัวตนด้วย JWT ทุกคนในทีมใช้บอร์ดร่วมกัน

### หน้าอื่น ๆ
- **Daily Standup** — สรุปงานแยกตามคนสำหรับ standup ประจำวัน
- **ปฏิทิน** — มุมมองรายเดือน แสดงวันหยุดไทยและวันกำหนดส่งงาน
- **Notes / Memo** — บันทึกส่วนตัว ปักหมุดได้
- **Markdown** — รายละเอียด ticket รองรับ bold, italic, code, list, blockquote

## สิทธิ์การใช้งาน

| การกระทำ | User | Admin |
|---|---|---|
| สร้าง ticket | ✅ | ✅ |
| แก้ไข / ลบ ticket ของตัวเอง | ✅ | ✅ |
| แก้ไข / ลบ ticket ของคนอื่น | ❌ | ✅ |
| ลาก ticket บนบอร์ด | เฉพาะของตัวเอง | ทุก ticket |
| เพิ่ม note ใน ticket | ✅ | ✅ |
| สร้าง label | ✅ | ✅ |
| ลบ label | ❌ | ✅ |
| จัดการผู้ใช้ (เพิ่มสิทธิ์ / ลบบัญชี) | ❌ | ✅ |

**บัญชีแรกที่ลงทะเบียน** จะได้สิทธิ์ Admin โดยอัตโนมัติ Admin เพิ่มเติมสามารถตั้งได้จาก **Sidebar → Users**

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Backend | Node.js, Express |
| ORM | Prisma |
| ฐานข้อมูล | PostgreSQL |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Drag & Drop | @hello-pangea/dnd |
| Markdown | react-markdown + remark-gfm |
| Auth | JWT (หมดอายุ 7 วัน, เก็บใน localStorage) |

## ความต้องการของระบบ

- Node.js 18+
- PostgreSQL (รันอยู่บนเครื่อง)

## วิธีติดตั้ง

**1. Clone และติดตั้ง dependencies**
```bash
git clone <repo-url>
cd ticket-app
npm run install:all
```

**2. ตั้งค่า backend**
```bash
cd backend
cp .env.example .env
```

แก้ไขไฟล์ `backend/.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ticketapp"
JWT_SECRET="ใส่ random string ยาว ๆ ตรงนี้"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**3. สร้างฐานข้อมูล**
```bash
createdb ticketapp
```

**4. สร้างตารางในฐานข้อมูล**
```bash
cd backend
npm run db:push
```

**5. รัน development server**

เปิด terminal 2 หน้า:
```bash
# Terminal 1
npm run backend

# Terminal 2
npm run frontend
```

เปิด http://localhost:5173 แล้วลงทะเบียน — บัญชีแรกจะได้สิทธิ์ Admin ทันที

## โครงสร้างโปรเจค

```
ticket-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma            # โมเดล: User, Ticket, Subtask, TicketRelation, Note, Label, Activity, Memo
│   └── src/
│       ├── controllers/
│       │   ├── authController.js    # Register, login, /me, PATCH /me (สี user)
│       │   ├── ticketController.js  # CRUD + notes + บันทึก activity
│       │   ├── subtaskController.js # CRUD subtask
│       │   ├── relationController.js# CRUD ticket relation
│       │   ├── labelController.js   # CRUD label (ลบ: admin เท่านั้น)
│       │   ├── memoController.js    # บันทึกส่วนตัว
│       │   └── userController.js    # ดูรายชื่อ, เปลี่ยนสิทธิ์, ลบ (admin)
│       ├── middleware/
│       │   └── auth.js              # ตรวจสอบ JWT → req.user (id, email, role)
│       ├── routes/
│       └── index.js
└── frontend/
    └── src/
        ├── components/
        │   ├── TicketCard.jsx       # Due date badge, subtask progress, label chips, bulk checkbox
        │   ├── TicketModal.jsx      # แก้ไข ticket, subtasks, relations, notes (@mention), activity, markdown
        │   ├── KanbanColumn.jsx     # ตั้งค่า WIP limit + แจ้งเตือน
        │   ├── Sidebar.jsx          # เมนู, ลิงก์ admin, เลือกสี user
        │   └── Layout.jsx
        ├── pages/
        │   ├── Board.jsx            # Kanban + filter (URL) + bulk actions + shortcuts + export CSV
        │   ├── AdminUsers.jsx       # จัดการผู้ใช้ (admin เท่านั้น)
        │   ├── Daily.jsx            # มุมมอง standup
        │   ├── Calendar.jsx         # ปฏิทินรายเดือนพร้อมวันหยุดไทย
        │   └── Notes.jsx            # บันทึกส่วนตัว
        ├── context/
        │   └── AuthContext.jsx      # user: id, name, email, role, color
        ├── services/
        │   └── api.js               # Axios + JWT interceptor + redirect เมื่อ 401
        └── data/
            └── thaiHolidays.js      # วันหยุดไทย (คงที่ + จันทรคติ)
```

## API Endpoints

ทุก endpoint ยกเว้น `/api/auth/register` และ `/api/auth/login` ต้องใส่ `Authorization: Bearer <token>`

| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST | `/api/auth/register` | — | สร้างบัญชี (คนแรก = Admin) |
| POST | `/api/auth/login` | — | เข้าสู่ระบบ คืน JWT + ข้อมูล user |
| GET | `/api/auth/me` | auth | ข้อมูล user ปัจจุบัน (รวมสี) |
| PATCH | `/api/auth/me` | auth | อัปเดตโปรไฟล์ตัวเอง (สี) |
| GET | `/api/tickets` | auth | ดูรายการ ticket |
| POST | `/api/tickets` | auth | สร้าง ticket |
| GET | `/api/tickets/:id` | auth | ดูรายละเอียด ticket (subtasks, relations, activities) |
| PUT | `/api/tickets/:id` | ผู้สร้าง / admin | แก้ไข ticket |
| DELETE | `/api/tickets/:id` | ผู้สร้าง / admin | ลบ ticket |
| POST | `/api/tickets/:id/notes` | auth | เพิ่ม note |
| DELETE | `/api/tickets/:id/notes/:noteId` | auth | ลบ note |
| POST | `/api/tickets/:id/subtasks` | auth | เพิ่ม subtask |
| PATCH | `/api/tickets/:id/subtasks/:subtaskId` | auth | tick / เปลี่ยนชื่อ subtask |
| DELETE | `/api/tickets/:id/subtasks/:subtaskId` | auth | ลบ subtask |
| POST | `/api/tickets/:id/relations` | auth | เชื่อม ticket |
| DELETE | `/api/tickets/:id/relations/:relationId` | auth | ลบ relation |
| GET | `/api/labels` | auth | ดู label ทั้งหมด |
| POST | `/api/labels` | auth | สร้าง label |
| PUT | `/api/labels/:id` | auth | แก้ไข label |
| DELETE | `/api/labels/:id` | admin | ลบ label |
| GET | `/api/users` | auth | ดูรายชื่อ user ทั้งหมด (รวม role, สี) |
| PATCH | `/api/users/:id/role` | admin | เพิ่ม / ลด สิทธิ์ user |
| DELETE | `/api/users/:id` | admin | ลบ user |
| GET | `/api/memos` | auth | ดู memo ของตัวเอง |
| POST | `/api/memos` | auth | สร้าง memo |
| PUT | `/api/memos/:id` | auth | แก้ไข memo |
| DELETE | `/api/memos/:id` | auth | ลบ memo |

## โครงสร้างฐานข้อมูล

```
User            id, email, name, password, role, color
Ticket          id, title, description, status, priority, dueDate, position, creatorId, assigneeId
Subtask         id, title, completed, position, ticketId
TicketRelation  id, type (blocks|relates_to|duplicate_of), fromId, toId
Note            id, content, ticketId, userId
Label           id, name, color
Activity        id, action, fromValue, toValue, ticketId, userId
Memo            id, title, content, pinned, userId
```

## คำสั่งที่ใช้บ่อย

```bash
# จาก root ของโปรเจค
npm run backend      # รัน backend ด้วย nodemon (port 3000)
npm run frontend     # รัน Vite dev server (port 5173)

# จาก backend/
npm run db:push      # sync schema กับฐานข้อมูล (ใช้ระหว่าง development)
npm run db:studio    # เปิด Prisma Studio ดูข้อมูลในฐานข้อมูล (port 5555)
```
