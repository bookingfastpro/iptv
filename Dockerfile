# ── Étape 1 : Build React/Vite ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les dépendances en premier (cache Docker)
COPY package*.json ./
RUN npm ci

# URL publique du proxy (ex: https://proxy.mondomaine.com)
ARG VITE_PROXY_URL=http://localhost:4000
ENV VITE_PROXY_URL=$VITE_PROXY_URL

COPY . .
RUN npm run build

# ── Étape 2 : Servir avec nginx ────────────────────────────────────────────────
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
