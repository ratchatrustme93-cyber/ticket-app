# Ticket App

Kanban-style task tracker for small teams. Built for self-hosting on a local server.

## Features

### Board
- **Kanban Board** — drag-and-drop cards across TODO / In Progress / Blocked / Done, reorder within columns
- **WIP Limits** — set a max ticket count per column; header turns red and shows a warning when exceeded (stored per-browser)
- **Bulk Actions** — select multiple tickets via checkboxes → change status, assign, or delete in one step
- **Keyboard Shortcuts** — `N` new ticket · `?` shortcut help · `Esc` deselect all
- **Filter Persistence** — search / assignee / label filters are saved in the URL (shareable links)
- **Global Search** — instant client-side search across title and description
- **CSV Export** — download the current filtered ticket list as a spreadsheet

### Tickets
- **Fields** — title, description (Markdown), status, priority, assignee, due date, labels
- **Subtasks** — checklist inside a ticket with progress bar; completion shown on the card
- **Relations** — link tickets as *blocks*, *relates to*, or *duplicate of*
- **Notes** — add notes to any ticket; type `@name` to mention a teammate (autocomplete + highlight)
- **Activity Log** — records status, priority, and assignee changes with relative timestamps
- **Due Date Badge** — color-coded on cards: overdue=red / today=orange / ≤3 days=amber / future=gray

### People
- **User Colors** — each user picks a personal color; shown on all avatars across the board
- **Roles** — first registered user is Admin; regular users can only edit their own tickets
- **User Management** — Admin can promote/demote roles and delete accounts from the UI (no Prisma Studio needed)
- **Multi-user** — JWT authentication, team members share the same board

### Other Pages
- **Daily Standup** — per-person ticket summary
- **Calendar** — monthly view with Thai public holidays and ticket due dates
- **Notes/Memo** — standalone personal notes with pin support
- **Markdown** — description field supports bold, italic, code, lists, blockquotes

## Roles

| Action | User | Admin |
|---|---|---|
| Create tickets | ✅ | ✅ |
| Edit / delete own tickets | ✅ | ✅ |
| Edit / delete any ticket | ❌ | ✅ |
| Drag cards on board | own only | any |
| Add notes to any ticket | ✅ | ✅ |
| Create labels | ✅ | ✅ |
| Delete labels | ❌ | ✅ |
| Manage users (promote / delete) | ❌ | ✅ |

The **first account registered** automatically becomes Admin. Additional admins can be promoted from **Sidebar → Users**.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Drag & Drop | @hello-pangea/dnd |
| Markdown | react-markdown + remark-gfm |
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
│   │   └── schema.prisma            # User, Ticket, Note, Subtask, TicketRelation, Label, Activity, Memo
│   └── src/
│       ├── controllers/
│       │   ├── authController.js    # Register, login, /me, PATCH /me (user color)
│       │   ├── ticketController.js  # CRUD + notes + activity logging
│       │   ├── subtaskController.js # Subtask CRUD
│       │   ├── relationController.js# Ticket relation CRUD
│       │   ├── labelController.js   # Label CRUD (delete: admin only)
│       │   ├── memoController.js    # Standalone user notes
│       │   └── userController.js    # List users, update role, delete (admin)
│       ├── middleware/
│       │   └── auth.js              # JWT verification → req.user (id, email, role)
│       ├── routes/
│       └── index.js
└── frontend/
    └── src/
        ├── components/
        │   ├── TicketCard.jsx       # Due date badge, subtask progress, label chips, bulk checkbox
        │   ├── TicketModal.jsx      # Edit, subtasks, relations, notes (@mention), activity, markdown
        │   ├── KanbanColumn.jsx     # WIP limit config + warning
        │   ├── Sidebar.jsx          # Nav, admin link, user color picker
        │   └── Layout.jsx
        ├── pages/
        │   ├── Board.jsx            # Kanban + filters (URL) + bulk actions + shortcuts + CSV export
        │   ├── AdminUsers.jsx       # User management (admin only)
        │   ├── Daily.jsx            # Standup view
        │   ├── Calendar.jsx         # Monthly calendar with Thai holidays
        │   └── Notes.jsx            # Standalone memos
        ├── context/
        │   └── AuthContext.jsx      # user object: id, name, email, role, color
        ├── services/
        │   └── api.js               # Axios + JWT interceptor + 401 redirect
        └── data/
            └── thaiHolidays.js      # Thai public holidays (fixed + Buddhist lunar)
```

## API Endpoints

All endpoints except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <token>`.

| Method | Path | Permission | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account (first = Admin) |
| POST | `/api/auth/login` | — | Login, returns JWT + user |
| GET | `/api/auth/me` | auth | Current user profile (includes color) |
| PATCH | `/api/auth/me` | auth | Update own profile (color) |
| GET | `/api/tickets` | auth | List tickets |
| POST | `/api/tickets` | auth | Create ticket |
| GET | `/api/tickets/:id` | auth | Ticket detail with subtasks, relations, activities |
| PUT | `/api/tickets/:id` | creator / admin | Update ticket |
| DELETE | `/api/tickets/:id` | creator / admin | Delete ticket |
| POST | `/api/tickets/:id/notes` | auth | Add note |
| DELETE | `/api/tickets/:id/notes/:noteId` | auth | Delete note |
| POST | `/api/tickets/:id/subtasks` | auth | Add subtask |
| PATCH | `/api/tickets/:id/subtasks/:subtaskId` | auth | Toggle / rename subtask |
| DELETE | `/api/tickets/:id/subtasks/:subtaskId` | auth | Delete subtask |
| POST | `/api/tickets/:id/relations` | auth | Link tickets |
| DELETE | `/api/tickets/:id/relations/:relationId` | auth | Remove relation |
| GET | `/api/labels` | auth | List all labels |
| POST | `/api/labels` | auth | Create label |
| PUT | `/api/labels/:id` | auth | Update label |
| DELETE | `/api/labels/:id` | admin | Delete label |
| GET | `/api/users` | auth | List all users (includes role, color) |
| PATCH | `/api/users/:id/role` | admin | Promote / demote user |
| DELETE | `/api/users/:id` | admin | Delete user |
| GET | `/api/memos` | auth | List own memos |
| POST | `/api/memos` | auth | Create memo |
| PUT | `/api/memos/:id` | auth | Update memo |
| DELETE | `/api/memos/:id` | auth | Delete memo |

## Database Schema

```
User        id, email, name, password, role, color
Ticket      id, title, description, status, priority, dueDate, position, creatorId, assigneeId
Subtask     id, title, completed, position, ticketId
TicketRelation  id, type (blocks|relates_to|duplicate_of), fromId, toId
Note        id, content, ticketId, userId
Label       id, name, color
Activity    id, action, fromValue, toValue, ticketId, userId
Memo        id, title, content, pinned, userId
```

## Useful Scripts

```bash
# From project root
npm run backend      # Start backend with nodemon (port 3000)
npm run frontend     # Start Vite dev server (port 5173)

# From backend/
npm run db:push      # Sync schema to DB (use during development)
npm run db:studio    # Open Prisma Studio (visual DB browser at :5555)
```
