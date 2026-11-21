# ---------- Backend: Node.js + Express API ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies (separate layer => better build cache)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the application source
COPY src ./src

# Locally the API listens on 3001; Cloud Run overrides PORT (8080)
ENV PORT=3001
EXPOSE 3001

# Run as the unprivileged "node" user that ships with the image
USER node

CMD ["node", "src/server.js"]
