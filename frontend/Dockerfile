# ---------- Stage 1: build the React app with Vite ----------
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Stage 2: serve the static build with nginx ----------
FROM nginx:1.27-alpine

# nginx renders /etc/nginx/templates/*.template into /etc/nginx/conf.d/ at start-up
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Defaults; override with -e / docker-compose / Cloud Run env vars
ENV PORT=8080
ENV BACKEND_URL=http://backend:3001
# Only substitute our own variables (leave nginx's $uri, $scheme ... untouched)
ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"

EXPOSE 8080
