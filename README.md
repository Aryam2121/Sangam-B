# Sangam Backend

Node.js + Express + Mongoose REST API for project/task management, resources, reports, training, and geospatial path tracking.

## Features

- Auth: register, login, logout, refresh token, change password
- Projects & Tasks: CRUD, list by project/user
- Resources & Reports: upload and manage project/task reports (Multer uploads stored in `uploads/`)
- Training/Seminars
- ML Model metadata per project
- Path tracking:
  - Total Path (`/api/path`, `/api/path/:id`) with append/update
  - Completed Path (`/api/createcompletedpath`, `/api/getcompletedpathbyid/:id`, `/api/updatecompletepath/:id`)

## Tech Stack

- Node.js (ES Modules), Express
- MongoDB & Mongoose
- Multer for file uploads
- Cloudinary integration helpers
- JWT auth (access + refresh)
- CORS, Cookies, Rate limiting (scaffolded)
- Deployed on Vercel (serverless) using `vercel.json`

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas or local MongoDB

### Installation
1. Clone the repo
2. Install deps
3. Create environment file
4. Run the server

```bash
# 1) Clone
git clone https://github.com/harshitbhardwaj-09/Sangam.git
cd Sangam

# 2) Install
npm install

# 3) Configure env
cp .env.example .env
# edit .env with your credentials

# 4) Dev run (with auto-reload)
npm run dev
# or start
npm start
```

Server runs by default at PORT from `.env` (default 8000).

## Environment Variables

See `.env.example` for all variables. Required ones:
- PORT
- CORS_ORIGIN
- MONGODB_URI
- DB_NAME
- ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY
- REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY
- CLOUDINARY_* (if using Cloudinary)

## API Overview

Base URL
- Local: `http://localhost:8000`
- Root health: `GET /` → "Server is live"
- Admin routes prefix: `/admin`
- API routes prefix: `/api`

### Auth (`/admin`)
- POST `/register`
- POST `/login`
- POST `/logout` (JWT required)
- POST `/refresh-token`
- POST `/change-password` (JWT required)
- GET `/getalluser`
- GET `/getuserbyid`
- GET `/getuserbydepartmentId`

### Projects & Tasks (`/api`)
- POST `/project` (create)
- GET `/getprojectbyid/:id`
- PATCH `/updateproject/:projectId`
- DELETE `/deleteprojectbyid`
- POST `/project/task`
- GET `/project/getTaskById/:taskId`
- GET `/project/:projectId/tasks`
- PATCH `/project/task/:taskId`
- GET `/getalltasksbyuserid/:userId`
- GET `/getallprojects`
- GET `/getalltasks`

### Resources & Reports (`/api`)
- POST `/resource` (create)
- POST `/resource/assign` (assign to project)
- GET `/resource/:resourceId`
- GET `/project/:projectId/resources`
- GET `/getallresources`
- DELETE `/deleteresource/:id` (note: missing leading slash in router in code; consider fixing)

Reports (Multer: field name `report`)
- POST `/uploadProjectReport/:projectId`
- POST `/uploadtaskreport/:taskId`
- GET `/getReportByProjectId/:projectId`
- PATCH `/updateprojectreport/:projectId`
- PATCH `/updatetaskreport/:taskId`
- GET `/getreportbytaskid/:taskId`

### ML Model (`/api`)
- POST `/projectMLModel`
- GET `/projectMLModel/:id`
- PATCH `/projectMLModel/:id`

### Training/Seminars (`/api`)
- POST `/createseminar`
- GET `/getallseminars`

### Path Tracking (`/api`)
- Total Path
  - POST `/path` (create)
  - PATCH `/path/:id` (append/update)
  - GET `/getpathbyid/:id`
- New Path
  - POST `/newpath`
  - GET `/getnewpath/:id`
  - GET `/getallnewpaths`
- Completed Path
  - POST `/createcompletedpath`
  - GET `/getcompletedpathbyid/:id`
  - PATCH `/updatecompletepath/:id`

## Architecture Notes

- Entry: `index.js` sets up Express, CORS, JSON parsing, cookies, and routes.
- DB: `db/index.js` connects using `MONGODB_URI` + `DB_NAME`.
- Routes: `routes/auth.js`, `routes/api.js`
- Controllers: under `controllers/`
- Models: under `models/`
- Uploads: `uploads/` (gitignored), via Multer destination
- Vercel: `vercel.json` routes all to `index.js`

## Development Tips

- CORS: `CORS_ORIGIN=*` is fine for local, but restrict in production.
- JWT secrets: use strong random values; rotate if leaked.
- Don’t commit real `.env`; use `.env.example` as template.
- Rate limiting is scaffolded—enable it for production traffic.

## License

ISC © Harshit Bhardwaj
