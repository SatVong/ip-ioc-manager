#!/bin/bash

echo "🔄 ОБНОВЛЕНИЕ КОДА (БД не трогаем)"

source .env

# Пересобираем образы (без удаления тома БД)
docker compose -f docker-compose.yml build --no-cache

# Перезапускаем контейнеры (том БД остаётся нетронутым)
docker compose -f docker-compose.yml up -d --force-recreate

# Перезапускаем
docker compose -f docker-compose.yml restart

echo "✅ Обновление завершено!"