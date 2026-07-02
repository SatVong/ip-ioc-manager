import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Создаём моки ДО импорта модулей
const mockGetDashboardStats = jest.fn();
const mockGetTopCountries = jest.fn();
const mockGetTimeline = jest.fn();

// Мокаем сервис дашборда
jest.mock('../../src/services/dashboard.service', () => ({
  getDashboardStats: mockGetDashboardStats,
  getTopCountries: mockGetTopCountries,
  getTimeline: mockGetTimeline,
}));

// Мокаем middleware авторизации — пропускаем всех
jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 1, username: 'test', role: 'admin' };
    next();
  },
}));

import dashboardRoutes from '../../src/routes/dashboard.routes';

// Создаём тестовое приложение
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Dashboard API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard stats', async () => {
      mockGetDashboardStats.mockResolvedValue({
        totalIpRecords: 1250,
        totalIocRecords: 340,
        totalWhiteIpRecords: 85,
        totalUsers: 5,
        activeUsers: 3,
      });

      const res = await request(app).get('/api/dashboard/stats');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalIpRecords: 1250,
        totalIocRecords: 340,
        totalWhiteIpRecords: 85,
        totalUsers: 5,
        activeUsers: 3,
      });
      expect(mockGetDashboardStats).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on service error', async () => {
      mockGetDashboardStats.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/dashboard/stats');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/dashboard/top-countries', () => {
    it('should return top countries with default limit', async () => {
      mockGetTopCountries.mockResolvedValue([
        { country: 'RU', count: 450 },
        { country: 'US', count: 200 },
        { country: 'CN', count: 150 },
        { country: 'DE', count: 80 },
        { country: 'GB', count: 60 },
      ]);

      const res = await request(app).get('/api/dashboard/top-countries');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
      expect(res.body[0]).toEqual({ country: 'RU', count: 450 });
      expect(mockGetTopCountries).toHaveBeenCalledWith(5);
    });

    it('should respect custom limit parameter', async () => {
      mockGetTopCountries.mockResolvedValue([
        { country: 'RU', count: 450 },
        { country: 'US', count: 200 },
      ]);

      const res = await request(app).get('/api/dashboard/top-countries?limit=2');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(mockGetTopCountries).toHaveBeenCalledWith(2);
    });

    it('should return 500 on service error', async () => {
      mockGetTopCountries.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/dashboard/top-countries');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/dashboard/timeline', () => {
    it('should return timeline data', async () => {
      mockGetTimeline.mockResolvedValue([
        { month: '2024-10', count: 50 },
        { month: '2024-11', count: 120 },
        { month: '2024-12', count: 200 },
      ]);

      const res = await request(app).get('/api/dashboard/timeline');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[1]).toEqual({ month: '2024-11', count: 120 });
      expect(mockGetTimeline).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on service error', async () => {
      mockGetTimeline.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/dashboard/timeline');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});