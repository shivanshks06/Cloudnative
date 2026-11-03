# CloudNative — Full-stack application

CloudNative is a project and task management application built as the workload for an end-to-end DevOps project.

## Stack

- Frontend: React, Vite, Tailwind CSS v4, React Router, Axios
- Backend: Node.js, Express, JWT authentication
- Database: PostgreSQL with Prisma ORM
- Cache foundation: Redis

## Prerequisites

- WSL2 Ubuntu
- Node.js 20 or newer
- npm
- Docker Desktop with WSL integration, or Docker Engine + Compose plugin

## 1. Start PostgreSQL and Redis

From the repository root:

```bash
docker compose up -d
docker compose ps
```

## 2. Configure backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Backend: http://localhost:5000

Health check: http://localhost:5000/api/health

## 3. Configure frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: http://localhost:5173

## 4. Use the application

1. Open http://localhost:5173/register
2. Create an account.
3. Sign in.
4. Create a project.
5. Open the project and create tasks.
6. Update task statuses from the Tasks page or project page.

## API endpoints

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/` | No |
| GET | `/api/health` | No |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Yes |
| GET | `/api/projects` | Yes |
| POST | `/api/projects` | Yes |
| GET | `/api/projects/:id` | Yes |
| PATCH | `/api/projects/:id` | Yes |
| DELETE | `/api/projects/:id` | Yes |
| GET | `/api/tasks` | Yes |
| POST | `/api/tasks` | Yes |
| PATCH | `/api/tasks/:id` | Yes |
| DELETE | `/api/tasks/:id` | Yes |
| GET | `/api/activity` | Yes |

## Stop local services

```bash
docker compose down
```

To remove local database and Redis data too (destructive):

```bash
docker compose down -v
```

## Important security note

This is a learning and development baseline, not a production-ready authentication system. The browser token is stored in localStorage for simplicity. Before production, move to secure HttpOnly cookies, add CSRF protection where appropriate, strengthen validation and authorization, add automated tests, and review secrets and rate limits. Never commit `.env` files or production credentials.
