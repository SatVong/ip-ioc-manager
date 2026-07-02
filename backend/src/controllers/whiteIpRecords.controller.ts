import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { getPaginatedData } from '../services/pagination.service';
import { WhiteIpRecord, CreateWhiteIpRecordRequest } from '../types/record';
import { PaginationQuery } from '../types/pagination';

const WHITE_IP_COLUMN_MAP: Record<string, string> = {
  'id': 'id',
  'Где внесено': 'mses',
  'Дата получения': 'date',
  'Откуда получено': 'from_source',
  'Раздел письма': 'letter',
  'IP-адресс': 'ip',
  'Как внесено на МСЭ': 'mse_method',
  'Примечание к внесению': 'note_in',
  'Заявки': 'soib_infr',
  'Дата внесения': 'date_in',
  'Кто вносил': 'who_in',
  'Примечание к исключению': 'note_out',
  'Дата исключения': 'date_out',
  'Кто исключил': 'who_out',
};

const WHITE_IP_SEARCH_COLUMNS = ['ip', 'from_source', 'soib_infr', 'note_in'];

export async function getWhiteIpRecordsPaginated(req: Request, res: Response): Promise<void> {
  try {
    const query: PaginationQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'id',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : {},
      globalSearch: (req.query.globalSearch as string) || '',
    };

    const result = await getPaginatedData<WhiteIpRecord>(
      { tableName: 'white_ip_records', columnMap: WHITE_IP_COLUMN_MAP, searchColumns: WHITE_IP_SEARCH_COLUMNS },
      query
    );

    res.json(result);
  } catch (err) {
    console.error('Ошибка в white IP paginated API:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
}

export async function createWhiteIpRecord(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as CreateWhiteIpRecordRequest;

    const result = await pool.query(
      `INSERT INTO white_ip_records 
       (mses, date, from_source, letter, ip, 
        mse_method, note_in, soib_infr, date_in, who_in, note_out, date_out, who_out) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [data.mses, data.date, data.from_source, data.letter, data.ip,
       data.mse_method, data.note_in, data.soib_infr || '-', data.date_in, data.who_in,
       data.note_out, data.date_out, data.who_out]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании White IP записи:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при создании записи' });
  }
}

export async function updateWhiteIpRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body as CreateWhiteIpRecordRequest;

    const result = await pool.query(
      `UPDATE white_ip_records 
       SET mses = $1, date = $2, from_source = $3, letter = $4, ip = $5,
           mse_method = $6, note_in = $7, soib_infr = $8, date_in = $9,
           who_in = $10, note_out = $11, date_out = $12, who_out = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 
       RETURNING *`,
      [data.mses, data.date, data.from_source, data.letter, data.ip,
       data.mse_method, data.note_in, data.soib_infr, data.date_in, data.who_in,
       data.note_out, data.date_out, data.who_out, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении White IP записи:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при обновлении записи' });
  }
}

export async function deleteWhiteIpRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM white_ip_records WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    res.json({ message: 'Запись удалена', deleted: result.rows[0] });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при удалении записи' });
  }
}