import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

dotenv.config();

import { pool, ensureAdminExists } from './db/pool';
import { config } from './config';
import { authenticateToken } from './middleware/auth';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import swaggerSpec from './swagger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import recordsRoutes from './routes/records.routes';
import iocRecordsRoutes from './routes/iocRecords.routes';
import whiteIpRecordsRoutes from './routes/whiteIpRecords.routes';
import adminRoutes from './routes/admin.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();
const port = config.port;

// Для логов с IP адресом
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiter для всех API
app.use('/api', apiLimiter);

// Swagger документация (без авторизации)
// Используем swaggerUi.serve для раздачи статики swagger-ui-dist
// и swaggerUi.setup для генерации HTML-страницы
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'IP/IOC Manager API Docs',
}));

// Отдаём статические файлы из папки frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Маршруты авторизации (НЕ требуют токена)
app.use('/api/auth', authRoutes);

// Все следующие API маршруты требуют авторизацию
app.use('/api', authenticateToken);

// Маршруты
app.use('/api/users', userRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/ioc-records', iocRecordsRoutes);
app.use('/api/white-ip-records', whiteIpRecordsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Тестовый endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает!', time: new Date() });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Перенаправляем все не-API запросы на index.html
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
  } else {
    next();
  }
});

// Обработчик ошибок
app.use(errorHandler);

// Запуск сервера
app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET    /api/test`);
  console.log(`   GET    /api/health`);
  console.log(`   GET    /api/dashboard/stats`);
  console.log(`   GET    /api/dashboard/top-countries`);
  console.log(`   GET    /api/dashboard/timeline`);
  console.log(`   GET    /api/records`);
  console.log(`   GET    /api/records/paginated`);
  console.log(`   POST   /api/records`);
  console.log(`   PUT    /api/records/:id`);
  console.log(`   DELETE /api/records/:id`);
  console.log(`   ... (полный список в /api-docs)`);

  // Добавляем задержку перед проверкой администратора
  setTimeout(() => {
    ensureAdminExists();
  }, 3000);
});

export default app;