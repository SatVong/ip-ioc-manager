import { Request, Response } from 'express';
import {
  getDashboardStats,
  getTopCountries,
  getTimeline,
  getAppearance,
} from '../services/dashboard.service';

// GET /api/dashboard/stats
export async function stats(req: Request, res: Response): Promise<void> {
  try {
    const data = await getDashboardStats();
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении статистики дашборда:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
}

// GET /api/dashboard/top-countries
export async function topCountries(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const data = await getTopCountries(limit);
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении топ-стран:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении топ-стран' });
  }
}

// GET /api/dashboard/timeline
export async function timeline(req: Request, res: Response): Promise<void> {
  try {
    const data = await getTimeline();
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении таймлайна:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении таймлайна' });
  }
}

// GET /api/dashboard/appearance?period=month&type=ip
export async function appearance(req: Request, res: Response): Promise<void> {
  try {
    const period = (req.query.period as string) || 'month';
    const type = (req.query.type as string) || 'ip';
    const data = await getAppearance(period, type);
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении графика появления:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении графика появления' });
  }
}