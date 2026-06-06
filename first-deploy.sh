#!/bin/bash

set -e

echo "🚀 Начало деплоя..."

# Загружаем переменные окружения
source .env

# Останавливаем старые контейнеры
echo "🛑 Остановка старых контейнеров..."
docker compose -f docker-compose.yml down -v 2>/dev/null || true

# Удаляем старый том (чистый старт)
docker volume rm ipioc_postgres 2>/dev/null || true

# Сборка образов
echo "🔄 Сборка новых образов..."
docker compose -f docker-compose.yml build --no-cache

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker compose -f docker-compose.yml up -d

# Перезапуск бэкенда для применения изменений
echo "🔄 Перезапуск бэкенда..."
docker compose -f docker-compose.yml restart backend

echo "🎉 Деплой завершён!"
echo "📌 Теперь выполните: ./create_tables.sh"
echo "🌐 Сайт доступен по адресу: http://$(hostname -I | awk '{print $1}')"