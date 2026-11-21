# MERN Blog – Containerization, Cloud Deployment & CI/CD (Assignment 4)

A MERN blog (MongoDB · Express · React · Node) with TanStack Query, packaged with
Docker, orchestrated locally with Docker Compose, deployed to Google Cloud Run
/ Render (images on Docker Hub, data on MongoDB Atlas) and automated with GitHub Actions.

```
Assignment 4/
├── backend/                 Express + Mongoose REST API
│   ├── src/app.js           routes, CORS, error handling
│   ├── src/server.js        DB connection + listen on $PORT
│   ├── src/models/Post.js   Post schema
│   ├── src/routes/posts.js  CRUD /api/v1/posts
│   ├── tests/posts.test.js  Jest + Supertest + mongodb-memory-server
│   ├── Dockerfile, .dockerignore, eslint.config.js
├── frontend/                React (Vite) + TanStack Query
│   ├── src/api/posts.js     fetch helpers (relative /api/v1)
│   ├── src/components/      CreatePost, PostList, Post, PostFilter, PostSorting
│   ├── nginx/default.conf.template   serves SPA + proxies /api -> $BACKEND_URL
│   ├── Dockerfile (multi-stage), .dockerignore
├── docker-compose.yml       mongo + backend + frontend
├── .github/workflows/
│   ├── backend-ci.yml       install → lint → test   (push / PR)
│   ├── frontend-ci.yml      install → lint → build  (push / PR)
│   └── cd.yml               test → build & push to Docker Hub → deploy to Render (main)
├── render.yaml              Render Blueprint (both web services)
└── REPORT.md                deployment procedure, challenges, roles of each tool
```

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | API + database status |
| GET | `/api/v1/posts?author=&tag=&sortBy=&sortOrder=` | list posts |
| GET | `/api/v1/posts/:id` | single post |
| POST | `/api/v1/posts` | create `{title, author, contents, tags[]}` |
| PATCH | `/api/v1/posts/:id` | update |
| DELETE | `/api/v1/posts/:id` | delete |

## 1. Run without Docker (development)

```powershell
cd backend; npm install; npm run dev      # needs MongoDB on localhost:27017
cd frontend; npm install; npm run dev     # http://localhost:5173 (proxies /api to :3001)
```

## 2. Docker – individual images and containers

```powershell
docker network create blog-net
docker run -d --name blog-mongo --network blog-net mongo:7
docker build -t blog-backend ./backend
docker build -t blog-frontend ./frontend
docker run -d --name blog-backend --network blog-net -p 3001:3001 -e DATABASE_URL=mongodb://blog-mongo:27017/blog blog-backend
docker run -d --name blog-frontend --network blog-net -p 3000:8080 -e BACKEND_URL=http://blog-backend:3001 blog-frontend
```

Open http://localhost:3000 – the green **API: online (db: connected)** badge proves
the frontend reaches the backend.

## 3. Docker Compose

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose down          # add -v to wipe the database volume
```

Frontend http://localhost:3000 · Backend http://localhost:3001 · MongoDB localhost:27017

## 4. Cloud deployment – Render (used for this submission)

1. MongoDB Atlas free M0 cluster, network access `0.0.0.0/0`, copy the connection string.
2. Push this repo to GitHub.
3. dashboard.render.com → **New → Blueprint** → select the repo (`render.yaml` defines both services).
4. Enter `DATABASE_URL` (Atlas string) and `BACKEND_URL` (`https://blog-backend-oqz6.onrender.com`, or the real backend URL Render shows) → **Apply**.
5. Open `https://blog-frontend-26rr.onrender.com` and create a post.

## 4b. Alternative: Google Cloud Run (manual, first time)

1. **MongoDB Atlas** – create a free M0 cluster, a database user, allow network
   access `0.0.0.0/0` (Cloud Run has no fixed IP), copy the connection string:
   `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/blog?retryWrites=true&w=majority`
2. **Docker Hub** – create repos `blog-backend` and `blog-frontend`, then:
   ```powershell
   docker login
   docker build -t <dockerhub-user>/blog-backend:latest ./backend
   docker build -t <dockerhub-user>/blog-frontend:latest ./frontend
   docker push <dockerhub-user>/blog-backend:latest
   docker push <dockerhub-user>/blog-frontend:latest
   ```
3. **Google Cloud Run** (install the gcloud CLI, `gcloud auth login`,
   `gcloud config set project <PROJECT_ID>`, `gcloud services enable run.googleapis.com`):
   ```powershell
   gcloud run deploy blog-backend --image docker.io/<dockerhub-user>/blog-backend:latest --region asia-south1 --allow-unauthenticated --port 8080 --set-env-vars "DATABASE_URL=<atlas-uri>,CORS_ORIGIN=*"
   ```
   ```powershell
   gcloud run deploy blog-frontend --image docker.io/<dockerhub-user>/blog-frontend:latest --region asia-south1 --allow-unauthenticated --port 8080 --set-env-vars "BACKEND_URL=<backend-url-from-previous-step>"
   ```
4. Open the frontend URL, create a post, refresh – it is stored in Atlas.

## 5. CI/CD (GitHub Actions)

Push the project to GitHub, then add **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Account settings → Personal access tokens) |
| `RENDER_BACKEND_DEPLOY_HOOK` | Render → blog-backend → Settings → Deploy Hook |
| `RENDER_FRONTEND_DEPLOY_HOOK` | Render → blog-frontend → Settings → Deploy Hook |

Repository **variable** `RENDER_FRONTEND_URL` = `https://blog-frontend-26rr.onrender.com` (used for the smoke test).

* Every push / pull request → **Backend CI** and **Frontend CI** (install, lint, test/build).
* Every push or merged PR to `main` → **CD** (tests → Docker Hub push tagged `latest` + commit SHA → Render deploy hooks → smoke test).
