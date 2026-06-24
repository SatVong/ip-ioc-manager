FROM node:20-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install --production

# Копируем исходный код бэкенда
COPY . .

# Порт, который слушает Express
EXPOSE 3000

# Запуск сервера
CMD ["node", "server.js"]