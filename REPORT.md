# Assignment 4 – Report
## Containerization, Cloud Deployment and CI/CD Automation of a MERN Stack Blog Application

### 1. Objective
Take the MERN blog (MongoDB, Express, React, Node.js + TanStack Query) and make it
portable (Docker), easy to run as a full stack (Docker Compose), publicly hosted
(Docker Hub + Google Cloud Run + MongoDB Atlas) and automatically tested and
deployed on every change (GitHub Actions).

### 2. Architecture

```
               Browser
                  │  https://blog-frontend-xxxx.run.app
                  ▼
   ┌──────────────────────────────┐
   │ frontend container (nginx)   │  serves React build,
   │  /        -> index.html      │  proxies /api/* to $BACKEND_URL
   │  /api/*   -> BACKEND_URL     │
   └──────────────┬───────────────┘
                  ▼
   ┌──────────────────────────────┐
   │ backend container (Node 20)  │  Express REST API on $PORT
   └──────────────┬───────────────┘
                  ▼
   MongoDB (container `mongo` locally  |  MongoDB Atlas in the cloud)
```

Because the React app always calls the **relative** path `/api/v1/...` and nginx
forwards it, the *same* frontend image works in Compose (`BACKEND_URL=http://backend:3001`)
and on Cloud Run (`BACKEND_URL=https://blog-backend-xxxx.run.app`) – only an
environment variable changes, nothing is rebuilt, and no CORS problems arise.

### 3. Deployment procedure

**Step 1 – Dockerfiles**
* `backend/Dockerfile`: `node:20-alpine`, copies `package*.json` first and runs
  `npm ci --omit=dev` (layer caching, small image), copies `src/`, runs as the
  non-root `node` user, honours `$PORT`.
* `frontend/Dockerfile`: multi-stage – stage 1 builds the Vite bundle with Node,
  stage 2 copies only `dist/` into `nginx:1.27-alpine` (~50 MB final image).
  The nginx config is a template rendered by `envsubst` at start-up
  (`NGINX_ENVSUBST_FILTER` restricts substitution to `PORT` and `BACKEND_URL`).
* `.dockerignore` in both folders excludes `node_modules`, `dist`, tests, `.env`
  and git data so the build context is small and secrets never enter an image.

**Step 2 – Docker Compose** – `docker-compose.yml` defines `mongo`, `backend`,
`frontend`; a named volume persists data; `backend` waits for Mongo's healthcheck
(`depends_on: condition: service_healthy`); services reach each other by name on
the default Compose network. `docker compose up -d --build` starts the stack.

**Step 3 – Cloud**
1. MongoDB Atlas M0 cluster → DB user → network access `0.0.0.0/0` → SRV connection string.
2. Docker Hub repositories `blog-backend`, `blog-frontend` → `docker push`.
3. `gcloud run deploy blog-backend` with `DATABASE_URL`; take its URL.
4. `gcloud run deploy blog-frontend` with `BACKEND_URL=<backend URL>`.
5. Open the frontend URL, create and view posts.

**Step 4 – CI** – `backend-ci.yml` (npm ci → ESLint → Jest tests against an
in-memory MongoDB) and `frontend-ci.yml` (npm ci → ESLint → `vite build`) run on
every push and pull request that touches their folder.

**Step 5 – CD** – `cd.yml` runs on push to `main` (i.e. after a PR is merged):
tests → build & push both images to Docker Hub (tags `latest` and the commit SHA)
→ deploy backend to Cloud Run → deploy frontend with the backend's freshly
reported URL → `curl` smoke test. Credentials come from repository secrets
`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `GCP_SA_KEY`, `DATABASE_URL`.

### 4. Role of each tool

| Tool | Role |
|---|---|
| **Docker** | Packages each service with its exact runtime and dependencies into an image, so it runs identically on a laptop, CI runner and the cloud. |
| **Docker Compose** | Declares the multi-container app (frontend, backend, MongoDB), its network, ports, env vars, volumes and start order, and starts it with one command. |
| **Docker Hub** | Registry that stores versioned images; Cloud Run pulls the images from here. |
| **GitHub Actions** | CI: lints/tests/builds every push and PR. CD: builds & pushes images and deploys to Cloud Run when `main` changes. |
| **Google Cloud Run** | Serverless container platform: runs the images over HTTPS with a public URL, autoscaling (to zero) and per-service env vars. |
| **MongoDB Atlas** | Managed cloud database used by the deployed backend. |

### 5. Challenges encountered and solutions

| Challenge | Solution |
|---|---|
| Frontend needs the backend URL, but Vite bakes `import.meta.env` in at build time, and the Cloud Run URL is only known after deploying. | Frontend calls relative `/api`; nginx proxies it to `$BACKEND_URL`, injected at container start. |
| nginx `envsubst` would also replace nginx variables like `$uri`. | `NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"`. |
| Proxying to an HTTPS Cloud Run backend failed TLS handshake (SNI). | `proxy_ssl_server_name on;` and keep the default `Host $proxy_host`. |
| Cloud Run requires listening on the `PORT` it injects (8080). | Both containers read `$PORT`; `--port 8080` on deploy. |
| Backend crashed on start in Compose because Mongo was not ready yet. | Mongo healthcheck + `depends_on: condition: service_healthy`. |
| Backend tests in CI need a database. | `mongodb-memory-server` starts a throwaway MongoDB inside the test process. |
| Atlas rejected connections from Cloud Run. | Allow `0.0.0.0/0` in Atlas Network Access (Cloud Run egress IPs are dynamic). |
| Keeping secrets out of the repo and images. | `.env` in `.gitignore`/`.dockerignore`; credentials stored as GitHub secrets / Cloud Run env vars. |

### 6. Source code implemented
See `README.md` for the full file tree. Key files: `backend/src/app.js`,
`backend/src/routes/posts.js`, `backend/tests/posts.test.js`,
`frontend/src/App.jsx`, `frontend/src/components/*`, `frontend/src/api/posts.js`,
both `Dockerfile`s and `.dockerignore`s, `frontend/nginx/default.conf.template`,
`docker-compose.yml`, `.github/workflows/{backend-ci,frontend-ci,cd}.yml`.

### 7. Submission links (fill in)
* GitHub repository: https://github.com/Aditya-18849/Blog-Application
* Docker Hub: `https://hub.docker.com/r/<user>/blog-backend`, `https://hub.docker.com/r/<user>/blog-frontend`
* Deployed application (Render): https://blog-frontend-26rr.onrender.com  — backend API: https://blog-backend-oqz6.onrender.com
