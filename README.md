# Ticket App

Kanban-style task tracker for small teams. Built for self-hosting on a local server.

## Features

- **Kanban Board** — drag-and-drop cards across TODO / In Progress / Blocked / Done, reorder within columns
- **Tickets** — title, description, status, priority, assignee, due date, labels, notes
- **Labels/Tags** — colored labels with board filter
- **Activity Log** — records status, priority, and assignee changes per ticket
- **Due Date Badge** — color-coded on cards (overdue / today / soon / future)
- **Global Search** — instant client-side search across title and description
- **Daily Standup** — per-person ticket summary for standups
- **Calendar** — monthly view with Thai public holidays and ticket due dates
- **Notes/Memo** — standalone personal notes with pin support
- **Multi-user** — JWT authentication, team members share the same board

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

Open http://localhost:5173, register an account, and start creating tickets.

## Project Structure

```
ticket-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database models
│   └── src/
│       ├── controllers/         # Business logic
│       │   ├── authController.js
│       │   ├── ticketController.js
│       │   ├── labelController.js
│       │   ├── memoController.js
│       │   └── userController.js
│       ├── middleware/
│       │   └── auth.js          # JWT verification
│       ├── routes/              # Express routers
│       └── index.js             # App entry point
└── frontend/
    └── src/
        ├── components/
        │   ├── TicketCard.jsx   # Kanban card with due date badge + labels
        │   ├── TicketModal.jsx  # Ticket detail, notes, activity log, label picker
        │   ├── KanbanColumn.jsx
        │   ├── Sidebar.jsx
        │   └── Layout.jsx
        ├── pages/
        │   ├── Board.jsx        # Kanban board with search + filters
        │   ├── Daily.jsx        # Standup view
        │   ├── Calendar.jsx     # Monthly calendar
        │   └── Notes.jsx        # Standalone memos
        ├── context/
        │   └── AuthContext.jsx  # Global auth state
        ├── services/
        │   └── api.js           # Axios instance with JWT interceptor
        └── data/
            └── thaiHolidays.js  # Thai public holidays (fixed + Buddhist)
```

## API Endpoints

All endpoints except `/api/auth/*` require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/tickets` | List tickets (supports `?assigneeId=`, `?labelId=`) |
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets/:id` | Get ticket with activities |
| PUT | `/api/tickets/:id` | Update ticket (status, position, labels, etc.) |
| DELETE | `/api/tickets/:id` | Delete ticket |
| POST | `/api/tickets/:id/notes` | Add note |
| DELETE | `/api/tickets/:id/notes/:noteId` | Delete note |
| GET | `/api/labels` | List all labels |
| POST | `/api/labels` | Create label |
| DELETE | `/api/labels/:id` | Delete label |
| GET | `/api/memos` | List user's memos |
| POST | `/api/memos` | Create memo |
| PUT | `/api/memos/:id` | Update memo |
| DELETE | `/api/memos/:id` | Delete memo |
| GET | `/api/users` | List all users |

## Useful Scripts

```bash
# Backend
npm run dev          # Start with nodemon (auto-reload)
npm run db:push      # Sync schema to DB (development)
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:migrate   # Create migration file (production)
```
