# TaskDep - Task Dependency Manager

TaskDep is a full-stack web application for managing project tasks with dependency-aware planning, analytics, and collaboration-focused workflow tools.

## Current Progress (March 2026)

### Completed
- Core task CRUD with authentication and per-user data isolation
- Dependency-aware task logic with circular dependency validation
- Status workflow with history and restore support
- Analytics, dependency graph, Gantt view, and Kanban board UI
- Attachments upload/delete via Cloudinary integration
- Export support for CSV, JSON, and TXT
- Server-side validation with Zod and API hardening (Helmet, CORS, rate limiting)
- Initial automated test setup (Jest/Supertest for server, Vitest configured for client)
- Route-based code splitting and skeleton loaders in key frontend areas

### In Progress
- Finalizing server-driven pagination behavior in dashboard experience
- Expanding test coverage (server and client)
- Continued performance and deployment polish

### Planning Artifacts
- `IMPLEMENTATION_PLAN.md`
- `PROGRESS_CHECKLIST.md`
- `DEPLOYMENT.md`

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- React Router
- React Flow (`@xyflow/react`)
- Chart.js / Recharts
- Axios
- Sonner

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Zod validation
- Helmet, CORS, express-rate-limit
- Cloudinary + Multer
- Nodemailer

## Project Structure

```text
dependency manger/
|-- client/                     # React frontend
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   `-- utils/
|   `-- package.json
|-- server/                     # Express API
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- tests/
|   |-- utils/
|   `-- package.json
|-- DEPLOYMENT.md
|-- IMPLEMENTATION_PLAN.md
|-- PROGRESS_CHECKLIST.md
|-- TaskDep_Manager_API_Collection.json
|-- package.json
|-- render.yaml
|-- run.ps1
`-- stop.ps1
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB (local or Atlas)

## Environment Setup

Create `server/.env` from `server/.env.example` and configure:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/task-dependency-manager
JWT_SECRET=replace-with-a-secure-secret
CLIENT_URL=http://localhost:5173

# Optional integrations
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=
FROM_EMAIL=
```

## Getting Started

### 1) Install dependencies

```bash
npm run install-all
```

### 2) Run the app

Recommended on Windows:

```bash
npm start
```

Alternative manual start:

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

### 3) Open application

- Frontend: `http://localhost:5173`
- API base: `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

## Available Scripts

### Root
- `npm start` - start app through `run.ps1`
- `npm run stop` - stop running processes via `stop.ps1`
- `npm run dev` - run client and server concurrently
- `npm run install-all` - install root/server/client dependencies
- `npm run build` - build client production bundle
- `npm run preview` - preview client production build
- `npm run clean` - remove `node_modules` folders
- `npm test` - run server + client tests concurrently

### Server (`server/`)
- `npm run dev` - start API with nodemon
- `npm start` - start API in production mode
- `npm test` - run Jest + Supertest tests

### Client (`client/`)
- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm test` - run Vitest suite

## Core Features

- User registration/login with JWT
- Dependency-aware task management
- Circular dependency prevention
- Analytics dashboard and trend insights
- Gantt timeline and dependency graph views
- Kanban board workflow
- Task history and restore
- Attachments support
- Export in CSV/JSON/TXT

## API Testing

Use `TaskDep_Manager_API_Collection.json` in Thunder Client or compatible API clients.

Suggested variables:
- `baseUrl`: `http://localhost:5000`
- `authToken`: JWT from login/register
- `taskId`: created task id for update/delete flows

## Deployment

Deployment documentation is available in `DEPLOYMENT.md`.

Default deployment split:
- Frontend: Vercel (`client/`)
- Backend: Render (`server/`)
- Database: MongoDB Atlas

## License

This project is licensed under the MIT License. See `LICENSE`.
