import { Request, Response } from 'express';
import { pool } from '../db/pool';
import { getPaginatedData } from '../services/pagination.service';
import { IocRecord, CreateIocRecordRequest } from '../types/record';
import { PaginationQuery } from '../types/pagination';

const IOC_COLUMN_MAP: Record<string, string> = {
  'id': 'id',
  'Где внесено': 'mses',
  'Дата получения': 'date',
  'Откуда получено': 'from_source',
  'Раздел письма': 'letter',
  'Индикатор компрометации': 'indicator',
  'Кодировка': 'encoding',
  'Статус OpenTip': 'status_opentip',
  'Статус VirusTotal': 'status_virustotal',
  'Примечание к внесению': 'note_in',
  'Дата внесения': 'date_in',
  'Кто вносил': 'who_in',
  'Примечание к исключению': 'note_out',
  'Дата исключения': 'date_out',
  'Кто исключил': 'who_out',
};

const IOC_SEARCH_COLUMNS = ['indicator', 'from_source', 'note_in', 'letter', 'encoding', 'status_opentip', 'status_virustotal', 'who_in', 'note_out', 'who_out'];

export async function getAllIocRecords(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM ioc_records ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении IOC записей' });
  }
}

export async function getIocRecordsPaginated(req: Request, res: Response): Promise<void> {
  try {
    const query: PaginationQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'id',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : {},
      globalSearch: (req.query.globalSearch as string) || '',
    };

    const result = await getPaginatedData<IocRecord>(
      { tableName: 'ioc_records', columnMap: IOC_COLUMN_MAP, searchColumns: IOC_SEARCH_COLUMNS },
      query
    );

    res.json(result);
  } catch (err) {
    console.error('Ошибка в IOC paginated API:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
}

export async function getIocRecordById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ioc_records WHERE id = $1', [id]);
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

export async function createIocRecord(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as CreateIocRecordRequest;

    const result = await pool.query(
      `INSERT INTO ioc_records 
       (mses, date, from_source, letter, indicator, encoding,
        status_opentip, status_virustotal, note_in, date_in,
        who_in, note_out, date_out, who_out) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [data.mses, data.date, data.from_source, data.letter, data.indicator, data.encoding,
       data.status_opentip, data.status_virustotal, data.note_in, data.date_in,
       data.who_in, data.note_out, data.date_out, data.who_out]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при создании IOC записи' });
  }
}

export async function updateIocRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body as Record<string, unknown>;

    // Fetch existing record first to merge with partial update
    const existing = await pool.query('SELECT * FROM ioc_records WHERE id = $1', [id]);
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
      indicator: data.indicator ?? existingRecord.indicator,
      encoding: data.encoding ?? existingRecord.encoding,
      status_opentip: data.status_opentip ?? existingRecord.status_opentip,
      status_virustotal: data.status_virustotal ?? existingRecord.status_virustotal,
      note_in: data.note_in ?? existingRecord.note_in,
      date_in: data.date_in ?? existingRecord.date_in,
      who_in: data.who_in ?? existingRecord.who_in,
      note_out: data.note_out ?? existingRecord.note_out,
      date_out: data.date_out ?? existingRecord.date_out,
      who_out: data.who_out ?? existingRecord.who_out,
    };

    const result = await pool.query(
      `UPDATE ioc_records
       SET mses = $1, date = $2, from_source = $3, letter = $4,
           indicator = $5, encoding = $6, status_opentip = $7,
           status_virustotal = $8, note_in = $9, date_in = $10,
           who_in = $11, note_out = $12, date_out = $13,
           who_out = $14, updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [merged.mses, merged.date, merged.from_source, merged.letter, merged.indicator, merged.encoding,
       merged.status_opentip, merged.status_virustotal, merged.note_in, merged.date_in,
       merged.who_in, merged.note_out, merged.date_out, merged.who_out, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при обновлении IOC записи' });
  }
}

export async function deleteIocRecord(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ioc_records WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Запись не найдена' });
      return;
    }

    res.json({ message: 'Запись удалена', deleted: result.rows[0] });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при удалении IOC записи' });
  }
}