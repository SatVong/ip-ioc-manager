# Stage 1: Build React app with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.config.ts ./
COPY index.html ./
COPY src/ ./src/

# Собираем production bundle
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Копируем собранный bundle из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]