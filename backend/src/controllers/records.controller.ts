import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { getPaginatedData } from '../services/pagination.service';
import { IpRecord, CreateIpRecordRequest } from '../types/record';
import { PaginationQuery } from '../types/pagination';

// Получить количество записей для каждого MSE
export async function getMseCounts(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT mses FROM ip_records');
    const counts: Record<number, number> = {};
    for (const row of result.rows) {
      if (row.mses && Array.isArray(row.mses)) {
        for (const m of row.mses) {
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    }
    res.json(counts);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении статистики MSE' });
  }
}

const IP_COLUMN_MAP: Record<string, string> = {
  'id': 'id',
  'Где внесено': 'mses',
  'Дата получения': 'date',
  'Откуда получено': 'from_source',
  'Раздел письма': 'letter',
  'Домен': 'domain',
  'IP-адрес': 'ip',
  'Страна': 'country',
  'Владелец': 'owner',
  'Как внесено на МСЭ': 'mse_method',
  'Примечание к внесению': 'note_in',
  'Заявки': 'soib_infr',
  'Дата внесения': 'date_in',
  'Кто вносил': 'who_in',
  'Примечание к исключению': 'note_out',
  'Дата исключения': 'date_out',
  'Кто исключил': 'who_out',
};

const IP_SEARCH_COLUMNS = ['ip', 'from_source', 'domain', 'owner', 'soib_infr', 'note_in', 'letter', 'country', 'who_in', 'note_out', 'who_out'];

// Получить все записи
export async function getAllRecords(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM ip_records ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
}

// Получить записи с пагинацией
export async function getRecordsPaginated(req: Request, res: Response): Promise<void> {
  try {
    const filters: Record<string, string> = req.query.filters ? JSON.parse(req.query.filters as string) : {};
    // Добавляем фильтр по mse, если передан как отдельный параметр
    if (req.query.mse) {
      filters['Где внесено'] = req.query.mse as string;
    }
    const query: PaginationQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'id',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters,
      globalSearch: (req.query.globalSearch as string) || '',
    };

    const result = await getPaginatedData<IpRecord>(
      {
        tableName: 'ip_records',
        columnMap: IP_COLUMN_MAP,
        searchColumns: IP_SEARCH_COLUMNS,
      },
      query
    );

    res.json(result);
  } catch (err) {
    console.error('Ошибка в paginated API:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
}

// Получить запись по ID
export async function getRecordById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ip_records WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении записи' });
  }
}

// Создать запись
export async function createRecord(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as CreateIpRecordRequest;

    // Преобразуем undefined/null mses в null (int[] не принимает пустую строку)
    const mses = data.mses ?? null;

    const result = await pool.query(
      `INSERT INTO ip_records
       (mses, date, from_source, letter, domain, ip, country, owner,
        mse_method, note_in, soib_infr, date_in, who_in, note_out, date_out, who_out)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [mses, data.date, data.from_source, data.letter, data.domain, data.ip,
       data.country, data.owner, data.mse_method, data.note_in, data.soib_infr || '-',
       data.date_in, data.who_in, data.note_out, data.date_out, data.who_out]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при создании записи' });
  }
}

// Обновить запись
export async function updateRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body as Record<string, unknown>;

    // Fetch existing record first to merge with partial update
    const existing = await pool.query('SELECT * FROM ip_records WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    const existingRecord = existing.rows[0];
    // Merge: only update fields that were sent
    const merged = {
      mses: data.mses ?? existingRecord.mses,
      date: data.date ?? existingRecord.date,
      from_source: data.from_source ?? existingRecord.from_source,
      letter: data.letter ?? existingRecord.letter,
      domain: data.domain ?? existingRecord.domain,
      ip: data.ip ?? existingRecord.ip,
      country: data.country ?? existingRecord.country,
      owner: data.owner ?? existingRecord.owner,
      mse_method: data.mse_method ?? existingRecord.mse_method,
      note_in: data.note_in ?? existingRecord.note_in,
      soib_infr: data.soib_infr ?? existingRecord.soib_infr,
      date_in: data.date_in ?? existingRecord.date_in,
      who_in: data.who_in ?? existingRecord.who_in,
      note_out: data.note_out ?? existingRecord.note_out,
      date_out: data.date_out ?? existingRecord.date_out,
      who_out: data.who_out ?? existingRecord.who_out,
    };

    const result = await pool.query(
      `UPDATE ip_records
       SET mses = $1, date = $2, from_source = $3, letter = $4, domain = $5,
           ip = $6, country = $7, owner = $8, mse_method = $9,
           note_in = $10, soib_infr = $11, date_in = $12, who_in = $13,
           note_out = $14, date_out = $15, who_out = $16, updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING *`,
      [merged.mses, merged.date, merged.from_source, merged.letter, merged.domain, merged.ip,
       merged.country, merged.owner, merged.mse_method, merged.note_in, merged.soib_infr,
       merged.date_in, merged.who_in, merged.note_out, merged.date_out, merged.who_out, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при обновлении записи' });
  }
}

// Удалить запись
export async function deleteRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ip_records WHERE id = $1 RETURNING *', [id]);

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