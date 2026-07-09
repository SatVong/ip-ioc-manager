# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и устанавливаем ВСЕ зависимости (включая dev)
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY tsconfig.json ./
COPY src/ ./src/

# Компилируем TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Копируем только production зависимости
COPY package*.json ./
RUN npm install --production

# Копируем скомпилированный код из builder
COPY --from=builder /app/dist ./dist

# Порт, который слушает Express
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Запуск сервера
CMD ["node", "dist/index.js"]