# Ticket App

Kanban-style task tracker for small teams. Built for self-hosting on a local server.

## Features

- **Kanban Board** — drag-and-drop cards across TODO / In Progress / Blocked / Done, reorder within columns
- **Tickets** — title, description, status, priority, assignee, due date, labels, notes
- **Labels/Tags** — colored labels, filter on board, create inline from ticket modal
- **Activity Log** — records status, priority, and assignee changes per ticket with timestamps
- **Due Date Badge** — color-coded on cards (overdue=red / today=orange / soon=amber / future=gray)
- **Global Search** — instant client-side search across title and description
- **Daily Standup** — per-person ticket summary for standups
- **Calendar** — monthly view with Thai public holidays and ticket due dates
- **Notes/Memo** — standalone personal notes with pin support
- **Roles** — first registered user is Admin; regular users can only edit their own tickets
- **Multi-user** — JWT authentication, team members share the same board

## Roles

| Action | User | Admin |
|---|---|---|
| Create tickets | ✅ | ✅ |
| Edit / delete own tickets | ✅ | ✅ |
| Edit / delete any ticket | ❌ | ✅ |
| Drag cards on board | own only | ✅ any |
| Add notes to any ticket | ✅ | ✅ |
| Create labels | ✅ | ✅ |
| Delete labels | ❌ | ✅ |

The **first account registered** automatically becomes Admin. Additional admins can be assigned via Prisma Studio.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Drag & Drop | @hello-pangea/dnd |
| Auth | JWT (7-day expiry, localStorage) |

## Prerequisites

- Node.js 18+
- PostgreSQL (running locally)

## Setup

**1. Clone and install**
```bash
git clone <repo-url>
cd ticket-app
npm run install:all
```

**2. Configure backend**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ticketapp"
JWT_SECRET="replace-with-a-long-random-string"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**3. Create the database**
```bash
# In PostgreSQL
createdb ticketapp
```

**4. Push schema to database**
```bash
cd backend
npm run db:push
```

**5. Run development servers**

In two separate terminals:
```bash
# Terminal 1
npm run backend

# Terminal 2
npm run frontend
```

Open http://localhost:5173 and register — the first account created is automatically Admin.

## Project Structure

```
ticket-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database models
│   └── src/
│       ├── controllers/
│       │   ├── authController.js    # Register (first user = ADMIN), login, /me
│       │   ├── ticketController.js  # CRUD + notes + activity logging
│       │   ├── labelController.js   # Label CRUD (delete: admin only)
│       │   ├── memoController.js    # Standalone user notes
│       │   └── userController.js
│       ├── middleware/
│       │   └── auth.js          # JWT verification → req.user (id, email, role)
│       ├── routes/
│       └── index.js
└── frontend/
    └── src/
        ├── components/
        │   ├── TicketCard.jsx   # Due date badge, label chips, drag/quick-action guards
        │   ├── TicketModal.jsx  # Full edit, notes, activity log, label picker
        │   ├── KanbanColumn.jsx
        │   ├── Sidebar.jsx      # Admin badge
        │   └── Layout.jsx
        ├── pages/
        │   ├── Board.jsx        # Kanban + search + client-side filters
        │   ├── Daily.jsx        # Standup view
        │   ├── Calendar.jsx     # Monthly calendar with Thai holidays
        │   └── Notes.jsx        # Standalone memos
        ├── context/
        │   └── AuthContext.jsx  # user object includes role
        ├── services/
        │   └── api.js           # Axios + JWT interceptor + 401 redirect
        └── data/
            └── thaiHolidays.js  # Thai public holidays (fixed + Buddhist)
```

## API Endpoints

All endpoints except `/api/auth/*` require `Authorization: Bearer <token>`.

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account (first = Admin) |
| POST | `/api/auth/login` | — | Login, returns JWT + user with role |
| GET | `/api/auth/me` | ✅ | Current user profile |
| GET | `/api/tickets` | ✅ | List tickets (`?assigneeId=`, `?labelId=`) |
| POST | `/api/tickets` | ✅ | Create ticket |
| GET | `/api/tickets/:id` | ✅ | Get ticket detail with activities |
| PUT | `/api/tickets/:id` | ✅ creator/admin | Update ticket |
| DELETE | `/api/tickets/:id` | ✅ creator/admin | Delete ticket |
| POST | `/api/tickets/:id/notes` | ✅ | Add note |
| DELETE | `/api/tickets/:id/notes/:noteId` | ✅ note owner | Delete note |
| GET | `/api/labels` | ✅ | List all labels |
| POST | `/api/labels` | ✅ | Create label |
| PUT | `/api/labels/:id` | ✅ | Update label |
| DELETE | `/api/labels/:id` | ✅ admin | Delete label |
| GET | `/api/memos` | ✅ | List own memos |
| POST | `/api/memos` | ✅ | Create memo |
| PUT | `/api/memos/:id` | ✅ | Update memo |
| DELETE | `/api/memos/:id` | ✅ | Delete memo |
| GET | `/api/users` | ✅ | List all users |

## Useful Scripts

```bash
# Backend
npm run dev          # Start with nodemon (auto-reload)
npm run db:push      # Sync schema to DB (development)
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:migrate   # Create migration file (production)
```
